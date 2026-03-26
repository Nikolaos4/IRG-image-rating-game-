import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma.js";
import { PrismaClientKnownRequestError } from "@/generated/prisma/internal/prismaNamespace.js";

export const RegisterRequestBody = z.object({
    email: z.email().meta({ example: "you@example.com" }),
    username: z.string().min(1).meta({ example: "your username" }),
    password: z.string().min(6).meta({ example: "your password" }),
});

export default async function register(app: FastifyInstance) {
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
        "/register",
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
