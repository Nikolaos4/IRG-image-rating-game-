import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import { authorizeAdmin } from "@/lib/authenticate.js";
import { prisma } from "@/lib/prisma.js";
import { z } from "zod";

const AdminUserParams = z.object({
    userId: z.coerce.number().int().positive().meta({ example: 1 }),
});

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
                    bans: {
                        orderBy: {
                            created_at: "desc",
                        },
                        take: 1,
                        select: {
                            reason: true,
                            created_at: true,
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
                    is_blocked: user.bans.length > 0,
                    ban_reason: user.bans[0]?.reason ?? null,
                    banned_at: user.bans[0]?.created_at ?? null,
                })),
            });
        },
    );

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
        "/:userId/ban",
        {
            onRequest: [authorizeAdmin],
            schema: {
                operationId: "admin-users-ban",
                tags: ["admin"],
                description: "Block user (admin only)",
                params: AdminUserParams,
                security: [{ bearerAuth: [] }],
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const { userId } = request.params as z.infer<typeof AdminUserParams>;

            if (userId === request.user.user_id) {
                return reply.status(409).send({ message: "Admin cannot block themselves" });
            }

            const target = await prisma.user.findUnique({
                where: {
                    user_id: userId,
                },
                select: {
                    user_id: true,
                    role: {
                        select: {
                            name: true,
                        },
                    },
                },
            });

            if (!target) {
                return reply.status(404).send({ message: "User not found" });
            }

            if (target.role.name === "admin") {
                return reply.status(409).send({ message: "Cannot block another admin" });
            }

            const existingBan = await prisma.userBan.findFirst({
                where: {
                    user_id: userId,
                },
                select: {
                    user_id: true,
                },
            });

            if (existingBan) {
                return reply.status(200).send({ message: "User already blocked" });
            }

            await prisma.userBan.create({
                data: {
                    user_id: userId,
                    banned_by: request.user.user_id,
                    reason: "Заблокирован администрацией сервера",
                },
            });

            return reply.status(200).send({ message: "User blocked" });
        },
    );

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().delete(
        "/:userId/ban",
        {
            onRequest: [authorizeAdmin],
            schema: {
                operationId: "admin-users-unban",
                tags: ["admin"],
                description: "Unblock user (admin only)",
                params: AdminUserParams,
                security: [{ bearerAuth: [] }],
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const { userId } = request.params as z.infer<typeof AdminUserParams>;

            const result = await prisma.userBan.deleteMany({
                where: {
                    user_id: userId,
                },
            });

            if (result.count === 0) {
                return reply.status(200).send({ message: "User is not blocked" });
            }

            return reply.status(200).send({ message: "User unblocked" });
        },
    );
}
