import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import { authorizeAdmin } from "@/lib/authenticate.js";
import { prisma } from "@/lib/prisma.js";

export default async function getUsersAdmin(app: FastifyInstance) {
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
        "/",
        {
            onRequest: [authorizeAdmin],
            schema: {
                operationId: "admin-users-get",
                tags: ["admin"],
                description: "Get all users (admin only)",
                security: [{ bearerAuth: [] }],
            },
        },
        async (_request: FastifyRequest, reply: FastifyReply) => {
            const users = await prisma.user.findMany({
                select: {
                    user_id: true,
                    username: true,
                    email: true,
                    created_at: true,
                    role: {
                        select: {
                            name: true,
                        },
                    },
                    rating: {
                        select: {
                            wins: true,
                            losses: true,
                        },
                    },
                },
                orderBy: {
                    user_id: "asc",
                },
            });

            return reply.status(200).send({
                users: users.map((user) => ({
                    user_id: user.user_id,
                    username: user.username,
                    email: user.email,
                    role: user.role.name,
                    created_at: user.created_at,
                    wins: user.rating?.wins ?? 0,
                    losses: user.rating?.losses ?? 0,
                })),
            });
        },
    );
}
