import { prisma } from "./prisma.js";
import { WebSocket } from "ws";

type RoundStateMessage = {
    type: "round:current";
    game_id: string;
    status: string;
    current_round: number;
    round: {
        round_id: number;
        first_image: number;
        second_image: number;
    } | null;
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

export async function createRoundStateMessage(gamePublicId: string): Promise<RoundStateMessage | null> {
    const game = await prisma.game.findUnique({
        where: {
            public_id: gamePublicId,
        },
        select: {
            public_id: true,
            status: true,
            current_round: true,
            rounds: {
                orderBy: {
                    round_id: "desc",
                },
                take: 1,
                select: {
                    round_id: true,
                    first_image: true,
                    second_image: true,
                },
            },
        },
    });

    if (!game) {
        return null;
    }

    return {
        type: "round:current",
        game_id: game.public_id,
        status: game.status,
        current_round: game.current_round,
        round: game.rounds[0] ?? null,
        at: new Date().toISOString(),
    };
}

export async function publishRoundUpdate(gamePublicId: string) {
    const clients = subscribers.get(gamePublicId);

    if (!clients || clients.size === 0) {
        return;
    }

    const message = await createRoundStateMessage(gamePublicId);

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
