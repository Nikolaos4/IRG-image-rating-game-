import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import { prisma } from "@/lib/prisma.js";

import { GetGameParams } from "../index.js";
import { authenticate } from "@/lib/authenticate.js";
import { publishGameUpdate } from "@/lib/game-realtime.js";

export const EditGameRequestBody = z
    .object({
        max_rounds: z
            .int()
            .positive()
            .meta({ example: 5, description: "The maximum number of rounds for the game" })
            .optional(),
        max_players: z
            .int()
            .positive()
            .meta({ example: 2, description: "The maximum number of players for the game" })
            .optional(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
        message: "At least one field must be provided",
    });

export default async function editGame(app: FastifyInstance) {
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().patch(
        "/",
        {
            onRequest: [authenticate],
            schema: {
                operationId: "game-settings",
                tags: ["game"],
                description: "Edit a game by its ID",
                params: GetGameParams,
                body: EditGameRequestBody,
                security: [{ bearerAuth: [] }],
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const { id } = request.params as z.infer<typeof GetGameParams>;

            const game = await prisma.game
                .findUnique({
                    where: {
                        public_id: id,
                    },
                    select: {
                        public_id: true,
                        status: true,
                    },
                })
                .catch(() => null);

            if (!game || game.status !== "lobby") {
                return reply.status(404).send({
                    message: "Game not found or already started",
                });
            }

            const { max_rounds, max_players } = request.body as z.infer<typeof EditGameRequestBody>;

            const data = await prisma.game.update({
                where: {
                    public_id: id,
                },
                data: {
                    max_rounds: max_rounds,
                    max_players: max_players,
                },
            });

            await publishGameUpdate(data.public_id);

            return reply.status(200).send({
                message: "Game settings updated successfully",
                game: {
                    game_id: data.public_id,
                    max_rounds: data.max_rounds,
                    max_players: data.max_players,
                },
            });
        },
    );
}
