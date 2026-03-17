import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import { prisma } from "@/lib/prisma.js";
import { publishRoundUpdate } from "@/lib/game-round-realtime.js";

import { GetGameParams } from "../index.js";
import { authenticate } from "@/lib/authenticate.js";
import { Image } from "@/generated/prisma/client.js";

export default async function startGame(app: FastifyInstance) {
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
        "/",
        {
            onRequest: [authenticate],
            schema: {
                operationId: "game-start",
                tags: ["game"],
                description: "Start a game by its ID",
                params: GetGameParams,
                security: [{ bearerAuth: [] }],
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const { id } = request.params as z.infer<typeof GetGameParams>;

            const game = await prisma.game.findFirst({
                where: {
                    public_id: id,
                    status: "lobby",
                },
                select: {
                    max_rounds: true,
                },
            });

            if (!game) {
                return reply.status(404).send({
                    message: "Game not found or already started",
                });
            }

            const roundsLimit = Math.max(game.max_rounds ?? 1, 1);
            const imagesLimit = roundsLimit * 2;

            const images = await prisma.$queryRaw<Image[]>`
                SELECT * FROM image ORDER BY RANDOM() LIMIT ${imagesLimit}
            `;

            if (images.length < imagesLimit) {
                return reply.status(409).send({
                    message: "Not enough images to start game with configured rounds",
                });
            }

            const data = await prisma.game.update({
                where: {
                    public_id: id,
                },
                data: {
                    status: "active",
                    current_round: 1,
                    started_at: new Date(),
                    game_images: {
                        createMany: {
                            data: images.map((img) => ({
                                image_id: img.image_id,
                            })),
                        },
                    },
                    rounds: {
                        create: {
                            first_image: images[0].image_id,
                            second_image: images[1].image_id,
                        },
                    },
                },
            });

            await publishRoundUpdate(data.public_id);

            return reply.status(200).send({
                message: "Game started successfully",
                game: {
                    game_id: data.public_id,
                    status: data.status,
                },
            });
        },
    );
}
