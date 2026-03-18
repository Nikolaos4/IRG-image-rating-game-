import { FastifyInstance } from "fastify";
import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import { z } from "zod";
import { prisma } from "@/lib/prisma.js";
import { createGameStateMessage, registerGameClient } from "@/lib/game-realtime.js";
import { GetGameParams } from "../index.js";

const GameWsQuery = z.object({
    token: z.string().optional(),
});

export default async function gameRealtime(app: FastifyInstance) {
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
        "/",
        {
            websocket: true,
            schema: {
                operationId: "game-realtime",
                tags: ["game"],
                description: "Subscribe to realtime updates of the game (members, status, etc) by game ID",
                params: GetGameParams,
                querystring: GameWsQuery,
            },
        },
        async (socket, request) => {
            const { id } = request.params as z.infer<typeof GetGameParams>;
            const query = request.query as z.infer<typeof GameWsQuery>;

            const authorizationHeader = request.headers.authorization;
            const bearerToken = authorizationHeader?.startsWith("Bearer ") ? authorizationHeader.slice(7) : undefined;
            const token = query.token ?? bearerToken;

            if (!token) {
                socket.send(
                    JSON.stringify({
                        type: "error",
                        message: "Unauthorized",
                    }),
                );
                socket.close(1008, "Unauthorized");
                return;
            }

            let payload: { user_id: number; role: number };

            try {
                payload = (await app.jwt.verify(token)) as { user_id: number; role: number };
            } catch {
                socket.send(
                    JSON.stringify({
                        type: "error",
                        message: "Unauthorized",
                    }),
                );
                socket.close(1008, "Unauthorized");
                return;
            }

            const game = await prisma.game.findUnique({
                where: {
                    public_id: id,
                },
                select: {
                    public_id: true,
                },
            });

            if (!game) {
                socket.send(
                    JSON.stringify({
                        type: "error",
                        message: "Game not found",
                    }),
                );
                socket.close(1008, "Game not found");
                return;
            }

            registerGameClient(game.public_id, socket);

            const initialMessage = await createGameStateMessage(game.public_id);

            if (initialMessage) {
                socket.send(JSON.stringify(initialMessage));
            }
        },
    );
}
