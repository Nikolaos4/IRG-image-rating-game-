import { FastifyInstance } from "fastify";
import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import { z } from "zod";
import { prisma } from "../../../../../lib/prisma.js";
import { createRoundStateMessage, registerRoundClient } from "../../../../../lib/game-round-realtime.js";
import { GetGameParams } from "../../index.js";

const RoundWsQuery = z.object({
    token: z.string().optional(),
});

export default async function roundRealtime(app: FastifyInstance) {
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
        "/",
        {
            websocket: true,
            schema: {
                operationId: "round-realtime",
                tags: ["game"],
                description: "Subscribe to realtime updates of the current round by game ID",
                params: GetGameParams,
                querystring: RoundWsQuery,
            },
        },
        async (socket, request) => {
            const { id } = request.params as z.infer<typeof GetGameParams>;
            const query = request.query as z.infer<typeof RoundWsQuery>;

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
                    game_id: true,
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

            const membership = await prisma.gameMember.findFirst({
                where: {
                    game_id: game.game_id,
                    user_id: payload.user_id,
                },
                select: {
                    game_member_id: true,
                },
            });

            if (!membership) {
                socket.send(
                    JSON.stringify({
                        type: "error",
                        message: "Forbidden",
                    }),
                );
                socket.close(1008, "Forbidden");
                return;
            }

            registerRoundClient(id, socket);

            const initialState = await createRoundStateMessage(id);

            socket.send(
                JSON.stringify({
                    type: "connected",
                    game_id: id,
                }),
            );

            if (initialState) {
                socket.send(JSON.stringify(initialState));
            }
        },
    );
}
