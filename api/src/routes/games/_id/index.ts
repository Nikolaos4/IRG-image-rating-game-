import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import { prisma } from "@/lib/prisma.js";
import { authenticate } from "@/lib/authenticate.js";

export const GetGameParams = z.object({
    id: z.uuid().meta({ example: "123e4567-e89b-12d3-a456-426614174000", description: "The id of the game" }),
});

export default async function getGame(app: FastifyInstance) {
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
        "/",
        {
            onRequest: [authenticate],
            schema: {
                operationId: "game-get",
                tags: ["game"],
                description: "Get a game by its ID",
                params: GetGameParams,
                security: [{ bearerAuth: [] }],
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const { id } = request.params as z.infer<typeof GetGameParams>;

            const data = await prisma.game
                .findUniqueOrThrow({
                    where: {
                        public_id: id,
                    },
                    include: {
                        members: {
                            include: {
                                user: true,
                            },
                        },
                        creator: true,
                        criteria: {
                            select: {
                                criteria_id: true,
                                name: true,
                            },
                        },
                    },
                })
                .catch(() => {
                    return reply.status(404).send({
                        message: "Game not found",
                    });
                });

            return reply.status(200).send({
                game: {
                    status: data.status,
                    game_id: data.public_id,
                    max_players: data.max_players,
                    max_rounds: data.max_rounds,
                    current_round: data.current_round,
                    criteria: {
                        criteria_id: data.criteria.criteria_id,
                        name: data.criteria.name,
                    },

                    creator: {
                        user_id: data.creator.user_id,
                        username: data.creator.username,
                    },

                    members: data.members
                        .filter((member) => data.creator.user_id !== member.user.user_id)
                        .map((member) => ({
                            user_id: member.user.user_id,
                            username: member.user.username,
                        })),
                },
            });
        },
    );
}
