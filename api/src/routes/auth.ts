import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma.js";
import { authenticate } from "@/lib/authenticate.js";
import { PrismaClientKnownRequestError } from "@/generated/prisma/internal/prismaNamespace.js";

export const LoginRequestBody = z.object({
    email: z.email().meta({ example: "you@example.com" }),
    password: z.string().min(6).meta({ example: "your password" }),
});

export const RegisterRequestBody = z.object({
    email: z.email().meta({ example: "you@example.com" }),
    username: z.string().min(1).meta({ example: "your username" }),
    password: z.string().min(6).meta({ example: "your password" }),
});

export default async function auth(app: FastifyInstance) {
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
        "/auth/login",
        {
            schema: {
                operationId: "auth-login",
                tags: ["auth"],
                description: "Login",
                body: LoginRequestBody,
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const { email, password } = request.body as z.infer<typeof LoginRequestBody>;

            const user = await prisma.user.findUnique({
                where: { email },
            });

            if (!user) {
                return reply.status(401).send({ message: "Invalid email or password" });
            }

            const ban = await prisma.userBan.findFirst({
                where: {
                    user_id: user.user_id,
                },
                select: {
                    reason: true,
                },
            });

            if (ban) {
                return reply.status(403).send({ message: `Вы заблокированы по причине: ${ban.reason}` });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return reply.status(401).send({ message: "Invalid email or password" });
            }

            const token = app.jwt.sign(
                {
                    user_id: user.user_id,
                    role: user.role_id,
                },
                { expiresIn: "7d" },
            );

            return reply.status(201).send({ message: "User logged in successfully", user_id: user.user_id, token });
        },
    );
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
        "/auth/me",
        {
            onRequest: [authenticate],
            schema: {
                operationId: "auth-me",
                tags: ["auth"],
                description: "Get current authenticated user",
                security: [{ bearerAuth: [] }],
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const user = await prisma.user.findUnique({
                where: {
                    user_id: request.user.user_id,
                },
                include: {
                    rating: true,
                    role: true,
                },
            });

            if (!user) {
                return reply.status(404).send({
                    message: "User not found",
                });
            }

            return reply.status(200).send({
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    email: user.email,
                    role: user.role.name,
                    created_at: user.created_at,
                    rating: {
                        wins: user.rating?.wins || 0,
                        losses: user.rating?.losses || 0,
                    },
                },
            });
        },
    );

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
        "/auth/register",
        {
            schema: {
                operationId: "auth-register",
                tags: ["auth"],
                description: "Register",
                body: RegisterRequestBody,
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const { email, username, password } = request.body as z.infer<typeof RegisterRequestBody>;

            const hashedPassword = await bcrypt.hash(password, 10);

            try {
                const user = await prisma.user.create({
                    data: {
                        email,
                        username,
                        password: hashedPassword,
                        role: {
                            connect: { role_id: 1 },
                        },
                    },
                });

                const token = app.jwt.sign(
                    {
                        user_id: user.user_id,
                        role: user.role_id,
                    },
                    { expiresIn: "7d" },
                );

                return reply
                    .status(201)
                    .send({ message: "User registered successfully", user_id: user.user_id, token });
            } catch (error) {
                if (error instanceof PrismaClientKnownRequestError) {
                    if (error.code === "P2002") {
                        return reply.status(400).send({ message: "Email or username already exists" });
                    }
                }
                console.error("Error registering user:", error);
                return reply.status(500).send({ message: "Internal server error" });
            }
        },
    );
}
