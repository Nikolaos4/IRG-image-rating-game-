import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import { prisma } from "@/lib/prisma.js";
import { authenticate } from "@/lib/authenticate.js";
import { GetGameParams } from "../index.js";
import { publishRoundUpdate } from "@/lib/game-round-realtime.js";

const VoteRoundRequestBody = z.object({
    voted_image_id: z.int().positive().meta({
        example: 10,
        description: "The image selected by the user in the current round",
    }),
});

export default async function getRound(app: FastifyInstance) {
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
        "/",
        {
            onRequest: [authenticate],
            schema: {
                operationId: "round-get",
                tags: ["round"],
                description: "Get current round of a game by its ID",
                params: GetGameParams,
                security: [{ bearerAuth: [] }],
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const { id } = request.params as z.infer<typeof GetGameParams>;

            const data = await prisma.round.findFirst({
                where: {
                    game: {
                        public_id: id,
                    },
                },
                orderBy: {
                    round_id: "desc",
                },
                include: {
                    game: {
                        select: {
                            criteria_id: true,
                            current_round: true,
                        },
                    },
                    firstImage: {
                        select: {
                            url: true,
                        },
                    },
                    secondImage: {
                        select: {
                            url: true,
                        },
                    },
                },
            });

            if (!data) {
                return reply.status(404).send({
                    message: "Round not found",
                });
            }

            const knownImageRating = await prisma.imageRating.findUnique({
                where: {
                    image_id_criteria_id: {
                        image_id: data.first_image,
                        criteria_id: data.game.criteria_id,
                    },
                },
                select: {
                    votes: true,
                },
            });

            const firstImageRoundVotes = await prisma.vote.count({
                where: {
                    round_id: data.round_id,
                    voted_image_id: data.first_image,
                },
            });

            const firstImageVotesBeforeRound = Math.max((knownImageRating?.votes ?? 0) - firstImageRoundVotes, 0);

            const [votesReceived, votesRequired] = await Promise.all([
                prisma.vote.count({
                    where: {
                        round_id: data.round_id,
                    },
                }),
                prisma.gameMember.count({
                    where: {
                        game_id: data.game_id,
                    },
                }),
            ]);

            return reply.status(200).send({
                round: {
                    current_round: data.game.current_round,
                    first_image: data.first_image,
                    second_image: data.second_image,
                    first_image_url: data.firstImage.url,
                    second_image_url: data.secondImage.url,
                    first_image_votes: firstImageVotesBeforeRound,
                    second_image_votes: null,
                    votes_received: votesReceived,
                    votes_required: votesRequired,
                },
            });
        },
    );

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
        "/",
        {
            onRequest: [authenticate],
            schema: {
                operationId: "round-vote",
                tags: ["round"],
                description: "Vote in current round and move game to the next round when all players voted",
                params: GetGameParams,
                body: VoteRoundRequestBody,
                security: [{ bearerAuth: [] }],
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const { id } = request.params as z.infer<typeof GetGameParams>;
            const { voted_image_id } = request.body as z.infer<typeof VoteRoundRequestBody>;

            const voteResult = await prisma.$transaction(async (tx) => {
                const gameRef = await tx.game.findUnique({
                    where: {
                        public_id: id,
                    },
                    select: {
                        game_id: true,
                    },
                });

                if (!gameRef) {
                    return {
                        statusCode: 404,
                        payload: {
                            message: "Game not found",
                        },
                    };
                }

                await tx.$executeRaw`SELECT pg_advisory_xact_lock(${gameRef.game_id})`;

                const game = await tx.game.findUnique({
                    where: {
                        game_id: gameRef.game_id,
                    },
                    select: {
                        game_id: true,
                        public_id: true,
                        status: true,
                        current_round: true,
                        max_rounds: true,
                        criteria_id: true,
                    },
                });

                if (!game) {
                    return {
                        statusCode: 404,
                        payload: {
                            message: "Game not found",
                        },
                    };
                }

                if (game.status !== "active") {
                    return {
                        statusCode: 409,
                        payload: {
                            message: "Game is not active",
                        },
                    };
                }

                const membership = await tx.gameMember.findFirst({
                    where: {
                        game_id: game.game_id,
                        user_id: request.user.user_id,
                    },
                    select: {
                        game_member_id: true,
                    },
                });

                if (!membership) {
                    return {
                        statusCode: 403,
                        payload: {
                            message: "Only game members can vote",
                        },
                    };
                }

                const round = await tx.round.findFirst({
                    where: {
                        game_id: game.game_id,
                    },
                    orderBy: {
                        round_id: "desc",
                    },
                    include: {
                        firstImage: {
                            select: {
                                url: true,
                            },
                        },
                        secondImage: {
                            select: {
                                url: true,
                            },
                        },
                    },
                });

                if (!round) {
                    return {
                        statusCode: 404,
                        payload: {
                            message: "Round not found",
                        },
                    };
                }

                if (voted_image_id !== round.first_image && voted_image_id !== round.second_image) {
                    return {
                        statusCode: 400,
                        payload: {
                            message: "Selected image is not part of the current round",
                        },
                    };
                }

                const existingVote = await tx.vote.findFirst({
                    where: {
                        round_id: round.round_id,
                        user_id: request.user.user_id,
                    },
                    select: {
                        vote_id: true,
                    },
                });

                if (existingVote) {
                    return {
                        statusCode: 409,
                        payload: {
                            message: "User has already voted in this round",
                        },
                    };
                }

                await tx.vote.create({
                    data: {
                        round_id: round.round_id,
                        user_id: request.user.user_id,
                        voted_image_id,
                    },
                });

                const ratingUpdate = await tx.imageRating.updateMany({
                    where: {
                        image_id: voted_image_id,
                        criteria_id: game.criteria_id,
                    },
                    data: {
                        votes: {
                            increment: 1,
                        },
                    },
                });

                if (ratingUpdate.count === 0) {
                    return {
                        statusCode: 409,
                        payload: {
                            message: "Selected image is not configured for this criteria",
                        },
                    };
                }

                const membersCount = await tx.gameMember.count({
                    where: {
                        game_id: game.game_id,
                    },
                });

                const roundVotesCount = await tx.vote.count({
                    where: {
                        round_id: round.round_id,
                    },
                });

                if (roundVotesCount < membersCount) {
                    return {
                        statusCode: 200,
                        publishGameId: game.public_id,
                        payload: {
                            message: "Vote accepted. Waiting for other players",
                            round: {
                                current_round: game.current_round,
                                votes_received: roundVotesCount,
                                votes_required: membersCount,
                            },
                        },
                    };
                }

                const [firstImageRating, secondImageRating] = await Promise.all([
                    tx.imageRating.findUnique({
                        where: {
                            image_id_criteria_id: {
                                image_id: round.first_image,
                                criteria_id: game.criteria_id,
                            },
                        },
                        select: { votes: true },
                    }),
                    tx.imageRating.findUnique({
                        where: {
                            image_id_criteria_id: {
                                image_id: round.second_image,
                                criteria_id: game.criteria_id,
                            },
                        },
                        select: { votes: true },
                    }),
                ]);

                const [firstImageRoundVotes, secondImageRoundVotes] = await Promise.all([
                    tx.vote.count({
                        where: {
                            round_id: round.round_id,
                            voted_image_id: round.first_image,
                        },
                    }),
                    tx.vote.count({
                        where: {
                            round_id: round.round_id,
                            voted_image_id: round.second_image,
                        },
                    }),
                ]);

                const firstImageVotesCurrent = firstImageRating?.votes ?? 0;
                const secondImageVotesCurrent = secondImageRating?.votes ?? 0;
                const firstImageVotesBeforeRound = Math.max(firstImageVotesCurrent - firstImageRoundVotes, 0);
                const secondImageVotesBeforeRound = Math.max(secondImageVotesCurrent - secondImageRoundVotes, 0);
                const winnerImageId =
                    firstImageVotesBeforeRound >= secondImageVotesBeforeRound ? round.first_image : round.second_image;

                const gameImages = await tx.gameImage.findMany({
                    where: {
                        game_id: game.game_id,
                    },
                    orderBy: {
                        game_image_id: "asc",
                    },
                    select: {
                        image_id: true,
                    },
                });

                const maxRoundsBySettings = Math.max(game.max_rounds ?? 1, 1);
                const maxRoundsByImages = Math.floor(gameImages.length / 2);
                const totalRounds = Math.min(maxRoundsBySettings, maxRoundsByImages);
                const isFinalRound = game.current_round >= totalRounds;

                const nextRoundNumber = game.current_round + 1;
                const nextPairStartIndex = (nextRoundNumber - 1) * 2;
                const nextFirstImage = gameImages[nextPairStartIndex]?.image_id;
                const nextSecondImage = gameImages[nextPairStartIndex + 1]?.image_id;

                if (isFinalRound || !nextFirstImage || !nextSecondImage) {
                    const loserImageId = winnerImageId === round.first_image ? round.second_image : round.first_image;

                    const winnerVoters = await tx.vote.findMany({
                        where: {
                            round_id: round.round_id,
                            voted_image_id: winnerImageId,
                        },
                        select: {
                            user_id: true,
                        },
                    });

                    const loserVoters = await tx.vote.findMany({
                        where: {
                            round_id: round.round_id,
                            voted_image_id: loserImageId,
                        },
                        select: {
                            user_id: true,
                        },
                    });

                    for (const voter of winnerVoters) {
                        await tx.userRating.upsert({
                            where: {
                                user_id: voter.user_id,
                            },
                            update: {
                                wins: {
                                    increment: 1,
                                },
                            },
                            create: {
                                user_id: voter.user_id,
                                wins: 1,
                                losses: 0,
                            },
                        });
                    }

                    for (const voter of loserVoters) {
                        await tx.userRating.upsert({
                            where: {
                                user_id: voter.user_id,
                            },
                            update: {
                                losses: {
                                    increment: 1,
                                },
                            },
                            create: {
                                user_id: voter.user_id,
                                wins: 0,
                                losses: 1,
                            },
                        });
                    }

                    const finishedGame = await tx.game.update({
                        where: {
                            game_id: game.game_id,
                        },
                        data: {
                            status: "finished",
                            finished_at: new Date(),
                        },
                        select: {
                            public_id: true,
                            status: true,
                        },
                    });

                    return {
                        statusCode: 200,
                        publishGameId: finishedGame.public_id,
                        payload: {
                            message: "Final vote accepted. Game finished",
                            game: {
                                game_id: finishedGame.public_id,
                                status: finishedGame.status,
                            },
                            round: {
                                current_round: game.current_round,
                                winner_image_id: winnerImageId,
                                first_image_votes: firstImageVotesBeforeRound,
                                second_image_votes: secondImageVotesBeforeRound,
                                unknown_image_id: round.second_image,
                                unknown_image_votes: secondImageVotesBeforeRound,
                            },
                        },
                    };
                }

                const updatedGame = await tx.game.update({
                    where: {
                        game_id: game.game_id,
                    },
                    data: {
                        current_round: {
                            increment: 1,
                        },
                        rounds: {
                            create: {
                                first_image: nextFirstImage,
                                second_image: nextSecondImage,
                            },
                        },
                    },
                    select: {
                        public_id: true,
                        current_round: true,
                        criteria_id: true,
                    },
                });

                const nextRoundData = await tx.round.findFirst({
                    where: {
                        game_id: game.game_id,
                    },
                    orderBy: {
                        round_id: "desc",
                    },
                    include: {
                        firstImage: {
                            select: {
                                url: true,
                            },
                        },
                        secondImage: {
                            select: {
                                url: true,
                            },
                        },
                    },
                });

                const nextRoundFirstImageRating = await tx.imageRating.findUnique({
                    where: {
                        image_id_criteria_id: {
                            image_id: nextFirstImage,
                            criteria_id: updatedGame.criteria_id,
                        },
                    },
                    select: {
                        votes: true,
                    },
                });

                return {
                    statusCode: 200,
                    publishGameId: updatedGame.public_id,
                    completedRoundData: {
                        current_round: game.current_round,
                        first_image: round.first_image,
                        second_image: round.second_image,
                        first_image_url: round.firstImage.url,
                        second_image_url: round.secondImage.url,
                        winner_image_id: winnerImageId,
                        first_image_votes: firstImageVotesBeforeRound,
                        second_image_votes: secondImageVotesBeforeRound,
                        votes_received: roundVotesCount,
                        votes_required: membersCount,
                    },
                    payload: {
                        message: "Vote accepted. Next round started",
                        game: {
                            game_id: updatedGame.public_id,
                            current_round: updatedGame.current_round,
                        },
                        completedRound: {
                            current_round: game.current_round,
                            first_image: round.first_image,
                            second_image: round.second_image,
                            first_image_url: round.firstImage.url,
                            second_image_url: round.secondImage.url,
                            winner_image_id: winnerImageId,
                            first_image_votes: firstImageVotesBeforeRound,
                            second_image_votes: secondImageVotesBeforeRound,
                            votes_received: roundVotesCount,
                            votes_required: membersCount,
                        },
                        round: {
                            current_round: updatedGame.current_round,
                            first_image: nextFirstImage,
                            second_image: nextSecondImage,
                            first_image_url: nextRoundData?.firstImage.url ?? "",
                            second_image_url: nextRoundData?.secondImage.url ?? "",
                            first_image_votes: nextRoundFirstImageRating?.votes ?? 0,
                            second_image_votes: null,
                        },
                    },
                };
            });

            if (voteResult.publishGameId) {
                await publishRoundUpdate(voteResult.publishGameId, voteResult.completedRoundData);
            }

            return reply.status(voteResult.statusCode).send(voteResult.payload);
        },
    );
}
