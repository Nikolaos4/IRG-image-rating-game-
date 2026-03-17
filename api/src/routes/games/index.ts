import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import { prisma } from "@/lib/prisma.js";
import { authenticate } from "@/lib/authenticate.js";

export const CreateGameRequestBody = z.object({
    criteria: z.int().positive().meta({ example: 1, description: "The criteria_id for the game" }),
});

export default async function createGame(app: FastifyInstance) {
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
        "/",
        {
            onRequest: [authenticate],
            schema: {
                operationId: "game-create",
                tags: ["game"],
                description: "Create a new game",
                body: CreateGameRequestBody,
                security: [{ bearerAuth: [] }],
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const { criteria } = request.body as z.infer<typeof CreateGameRequestBody>;

            const data = await prisma.game.create({
                data: {
                    criteria_id: criteria,
                    status: "lobby",
                    created_by: request.user.user_id,
                    members: {
                        create: {
                            user_id: request.user.user_id,
                        },
                    },
                },
                include: {
                    criteria: {
                        select: {
                            criteria_id: true,
                            name: true,
                        },
                    },
                },
            });

            return reply.status(201).send({
                message: "Game created successfully",
                game: {
                    status: data.status,
                    game_id: data.public_id,
                    max_rounds: data.max_rounds,
                    current_round: data.current_round,
                    criteria: {
                        criteria_id: data.criteria.criteria_id,
                        name: data.criteria.name,
                    },
                },
            });
        },
    );
}
