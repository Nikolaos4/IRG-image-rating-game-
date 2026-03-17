import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import { prisma } from "@/lib/prisma.js";
import { authenticate } from "@/lib/authenticate.js";
import { GetGameParams } from "../index.js";

export default async function getResult(app: FastifyInstance) {
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
        "/",
        {
            onRequest: [authenticate],
            schema: {
                operationId: "game-result",
                tags: ["game"],
                description: "Get game results by its ID",
                params: GetGameParams,
                security: [{ bearerAuth: [] }],
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const { id } = request.params as z.infer<typeof GetGameParams>;

            const game = await prisma.game.findUnique({
                where: {
                    public_id: id,
                },
                include: {
                    criteria: true,
                    game_images: {
                        include: {
                            image: true,
                        },
                    },
                },
            });

            if (!game) {
                return reply.status(404).send({
                    message: "Game not found",
                });
            }

            if (game.status !== "finished") {
                return reply.status(409).send({
                    message: "Game is not finished yet",
                });
            }

            const rounds = await prisma.round.findMany({
                where: {
                    game_id: game.game_id,
                },
                select: {
                    round_id: true,
                },
            });

            const roundIds = rounds.map((round) => round.round_id);

            const votes =
                roundIds.length > 0
                    ? await prisma.vote.findMany({
                          where: {
                              round_id: {
                                  in: roundIds,
                              },
                          },
                          select: {
                              voted_image_id: true,
                          },
                      })
                    : [];

            const voteCountByImage = new Map<number, number>();

            for (const gameImage of game.game_images) {
                voteCountByImage.set(gameImage.image_id, 0);
            }

            for (const vote of votes) {
                voteCountByImage.set(vote.voted_image_id, (voteCountByImage.get(vote.voted_image_id) ?? 0) + 1);
            }

            const results = game.game_images
                .map((gameImage) => ({
                    image_id: gameImage.image.image_id,
                    url: gameImage.image.url,
                    votes: voteCountByImage.get(gameImage.image_id) ?? 0,
                }))
                .sort((a, b) => b.votes - a.votes || a.image_id - b.image_id)
                .map((item, index) => ({
                    ...item,
                    position: index + 1,
                }));

            const maxVotes = results[0]?.votes ?? 0;
            const winners = results.filter((item) => item.votes === maxVotes);

            return reply.status(200).send({
                game: {
                    game_id: game.public_id,
                    status: game.status,
                    max_rounds: game.max_rounds,
                    played_rounds: rounds.length,
                    criteria: {
                        criteria_id: game.criteria.criteria_id,
                        name: game.criteria.name,
                        description: game.criteria.description,
                    },
                    total_votes: votes.length,
                    winners,
                    results,
                },
            });
        },
    );
}
