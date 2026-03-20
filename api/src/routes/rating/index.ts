import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import { authenticate } from "@/lib/authenticate.js";
import { prisma } from "@/lib/prisma.js";

export default async function getRating(app: FastifyInstance) {
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
        "/",
        {
            onRequest: [authenticate],
            schema: {
                operationId: "rating-get",
                tags: ["rating"],
                description: "Get global user rating sorted by wins desc and losses asc",
                security: [{ bearerAuth: [] }],
            },
        },
        async (_request: FastifyRequest, reply: FastifyReply) => {
            const users = await prisma.user.findMany({
                select: {
                    user_id: true,
                    username: true,
                    rating: {
                        select: {
                            wins: true,
                            losses: true,
                        },
                    },
                },
            });

            const rating = users
                .map((user) => ({
                    user_id: user.user_id,
                    username: user.username,
                    wins: user.rating?.wins ?? 0,
                    losses: user.rating?.losses ?? 0,
                }))
                .sort((a, b) => {
                    const aRatio = a.losses === 0 ? (a.wins > 0 ? Number.POSITIVE_INFINITY : 0) : a.wins / a.losses;
                    const bRatio = b.losses === 0 ? (b.wins > 0 ? Number.POSITIVE_INFINITY : 0) : b.wins / b.losses;

                    if (bRatio !== aRatio) {
                        return bRatio - aRatio;
                    }

                    if (b.wins !== a.wins) {
                        return b.wins - a.wins;
                    }

                    if (a.losses !== b.losses) {
                        return a.losses - b.losses;
                    }

                    return a.username.localeCompare(b.username);
                })
                .map((entry, index) => ({
                    ...entry,
                    position: index + 1,
                }));

            return reply.status(200).send({
                rating,
            });
        },
    );
}
