import { prisma } from "./prisma.js";
import { WebSocket } from "ws";

type GameStateMessage = {
    type: "game:updated";
    game_id: string;
    status: string;
    current_round: number;
    members?: Array<{
        user_id: number;
        username: string;
    }>;
    at: string;
};

const subscribers = new Map<string, Set<WebSocket>>();

function unregisterGameClient(gamePublicId: string, socket: WebSocket) {
    const clients = subscribers.get(gamePublicId);

    if (!clients) {
        return;
    }

    clients.delete(socket);

    if (clients.size === 0) {
        subscribers.delete(gamePublicId);
    }
}

export function registerGameClient(gamePublicId: string, socket: WebSocket) {
    const clients = subscribers.get(gamePublicId) ?? new Set<WebSocket>();

    clients.add(socket);
    subscribers.set(gamePublicId, clients);

    socket.on("close", () => {
        unregisterGameClient(gamePublicId, socket);
    });

    socket.on("error", () => {
        unregisterGameClient(gamePublicId, socket);
    });
}

export async function createGameStateMessage(gamePublicId: string): Promise<GameStateMessage | null> {
    const game = await prisma.game.findUnique({
        where: {
            public_id: gamePublicId,
        },
        select: {
            public_id: true,
            status: true,
            current_round: true,
            creator: {
                select: {
                    user_id: true,
                    username: true,
                },
            },
            members: {
                select: {
                    user: {
                        select: {
                            user_id: true,
                            username: true,
                        },
                    },
                },
            },
        },
    });

    if (!game) {
        return null;
    }

    const allMembers = game.members
        .filter((member) => member.user.user_id !== game.creator.user_id)
        .map((member) => member.user);

    return {
        type: "game:updated",
        game_id: game.public_id,
        status: game.status,
        current_round: game.current_round,
        members: allMembers,
        at: new Date().toISOString(),
    };
}

export async function publishGameUpdate(gamePublicId: string) {
    const clients = subscribers.get(gamePublicId);

    if (!clients || clients.size === 0) {
        return;
    }

    const message = await createGameStateMessage(gamePublicId);

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
