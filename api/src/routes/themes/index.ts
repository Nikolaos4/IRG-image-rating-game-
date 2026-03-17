import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import { prisma } from "@/lib/prisma.js";
import { authenticate } from "@/lib/authenticate.js";

export default async function getThemes(app: FastifyInstance) {
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
        "/",
        {
            onRequest: [authenticate],
            schema: {
                operationId: "themes-get",
                tags: ["theme"],
                description: "Get all themes",
                security: [{ bearerAuth: [] }],
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const themes = await prisma.criteria.findMany({
                select: {
                    name: true,
                    criteria_id: true,
                    description: true,
                    _count: {
                        select: {
                            image_ratings: true,
                        },
                    },
                },
            });

            const themesWithImageCount = themes.map((theme) => ({
                criteria_id: theme.criteria_id,
                name: theme.name,
                description: theme.description,
                images_count: theme._count.image_ratings,
            }));

            return reply.status(200).send({
                message: "Themes retrieved successfully",
                themes: themesWithImageCount,
            });
        },
    );
}
