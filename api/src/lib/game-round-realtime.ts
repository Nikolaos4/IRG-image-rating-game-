import { prisma } from "./prisma.js";
import { WebSocket } from "ws";

type RoundStateMessage = {
    type: "round:current";
    game_id: string;
    status: string;
    current_round: number;
    round: {
        current_round: number;
        first_image: number;
        second_image: number;
        first_image_url: string;
        second_image_url: string;
        first_image_votes: number;
        second_image_votes: null;
        votes_received: number;
        votes_required: number;
    } | null;
    completedRound?: {
        current_round: number;
        first_image: number;
        second_image: number;
        first_image_url: string;
        second_image_url: string;
        winner_image_id: number;
        first_image_votes: number;
        second_image_votes: number;
        votes_received: number;
        votes_required: number;
    };
    at: string;
};

const subscribers = new Map<string, Set<WebSocket>>();

function unregisterRoundClient(gamePublicId: string, socket: WebSocket) {
    const clients = subscribers.get(gamePublicId);

    if (!clients) {
        return;
    }

    clients.delete(socket);

    if (clients.size === 0) {
        subscribers.delete(gamePublicId);
    }
}

export function registerRoundClient(gamePublicId: string, socket: WebSocket) {
    const clients = subscribers.get(gamePublicId) ?? new Set<WebSocket>();

    clients.add(socket);
    subscribers.set(gamePublicId, clients);

    socket.on("close", () => {
        unregisterRoundClient(gamePublicId, socket);
    });

    socket.on("error", () => {
        unregisterRoundClient(gamePublicId, socket);
    });
}

export async function createRoundStateMessage(
    gamePublicId: string,
    completedRoundData?: RoundStateMessage["completedRound"],
): Promise<RoundStateMessage | null> {
    const game = await prisma.game.findUnique({
        where: {
            public_id: gamePublicId,
        },
        select: {
            public_id: true,
            status: true,
            current_round: true,
            criteria_id: true,
            rounds: {
                orderBy: {
                    round_id: "desc",
                },
                take: 1,
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
            },
        },
    });

    if (!game) {
        return null;
    }

    const currentRound = game.rounds[0];
    let round = null;

    if (currentRound && game.status === "active") {
        const [firstImageRating, votesReceived, votesRequired, firstImageRoundVotes] = await Promise.all([
            prisma.imageRating.findUnique({
                where: {
                    image_id_criteria_id: {
                        image_id: currentRound.first_image,
                        criteria_id: game.criteria_id,
                    },
                },
                select: {
                    votes: true,
                },
            }),
            prisma.vote.count({
                where: {
                    round_id: currentRound.round_id,
                },
            }),
            prisma.gameMember.count({
                where: {
                    game_id: currentRound.game_id,
                },
            }),
            prisma.vote.count({
                where: {
                    round_id: currentRound.round_id,
                    voted_image_id: currentRound.first_image,
                },
            }),
        ]);

        const firstImageVotesBeforeRound = Math.max((firstImageRating?.votes ?? 0) - firstImageRoundVotes, 0);

        round = {
            current_round: game.current_round,
            first_image: currentRound.first_image,
            second_image: currentRound.second_image,
            first_image_url: currentRound.firstImage.url,
            second_image_url: currentRound.secondImage.url,
            first_image_votes: firstImageVotesBeforeRound,
            second_image_votes: null,
            votes_received: votesReceived,
            votes_required: votesRequired,
        };
    }

    return {
        type: "round:current",
        game_id: game.public_id,
        status: game.status,
        current_round: game.current_round,
        round,
        completedRound: completedRoundData,
        at: new Date().toISOString(),
    };
}

export async function publishRoundUpdate(
    gamePublicId: string,
    completedRoundData?: RoundStateMessage["completedRound"],
) {
    const clients = subscribers.get(gamePublicId);

    if (!clients || clients.size === 0) {
        return;
    }

    const message = await createRoundStateMessage(gamePublicId, completedRoundData);

    if (!message) {
        return;
    }

    const payload = JSON.stringify(message);

    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    }
}
