import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma.js";

export const LoginRequestBody = z.object({
    email: z.email().meta({ example: "you@example.com" }),
    password: z.string().min(6).meta({ example: "your password" }),
});

export default async function login(app: FastifyInstance) {
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
        "/login",
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
}
