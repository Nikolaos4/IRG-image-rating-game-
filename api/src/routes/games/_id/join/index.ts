import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import { prisma } from "../../../../lib/prisma.js";
import { authenticate } from "../../../../lib/authenticate.js";

export const JoinGameParams = z.object({
    id: z.uuid().meta({ example: "123e4567-e89b-12d3-a456-426614174000", description: "The id of the game" }),
});

export default async function joinGame(app: FastifyInstance) {
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
        "/",
        {
            onRequest: [authenticate],
            schema: {
                operationId: "join-game",
                tags: ["game"],
                description: "Join a game by its ID",
                params: JoinGameParams,
                security: [{ bearerAuth: [] }],
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const { id } = request.params as z.infer<typeof JoinGameParams>;

            const game = await prisma.game.findUnique({
                where: {
                    public_id: id,
                },
                select: {
                    game_id: true,
                    public_id: true,
                    status: true,
                    max_players: true,
                },
            });

            if (!game || game.status !== "lobby") {
                return reply.status(404).send({
                    message: "Game not found or already started",
                });
            }

            const joinResult = await prisma.$transaction(async (tx) => {
                const alreadyMember = await tx.gameMember.findFirst({
                    where: {
                        game_id: game.game_id,
                        user_id: request.user.user_id,
                    },
                });

                if (alreadyMember) {
                    return {
                        statusCode: 409,
                        payload: {
                            message: "User is already in this game",
                        },
                    };
                }

                const membersCount = await tx.gameMember.count({
                    where: {
                        game_id: game.game_id,
                    },
                });

                if (game.max_players !== null && membersCount >= game.max_players) {
                    return {
                        statusCode: 409,
                        payload: {
                            message: "Game is full",
                        },
                    };
                }

                const membership = await tx.gameMember.create({
                    data: {
                        game_id: game.game_id,
                        user_id: request.user.user_id,
                    },
                });

                return {
                    statusCode: 201,
                    payload: {
                        message: "User joined game successfully",
                        game: {
                            game_id: game.public_id,
                            game_member_id: membership.game_member_id,
                        },
                    },
                };
            });

            return reply.status(joinResult.statusCode).send(joinResult.payload);
        },
    );
}
