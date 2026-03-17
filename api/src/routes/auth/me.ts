import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import { prisma } from "@/lib/prisma.js";
import { authenticate } from "@/lib/authenticate.js";

export default async function me(app: FastifyInstance) {
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
        "/me",
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
}
