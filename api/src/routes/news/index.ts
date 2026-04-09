import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import { authenticate, authorizeAdmin } from "@/lib/authenticate.js";
import { prisma } from "@/lib/prisma.js";
import z from "zod";
import { sendNews } from "@/bot/handlers.js";

const NewsRequestBody = z.object({
    title: z.string().max(100).min(1),
    content: z.string().max(1000).min(1),
});

export default async function news(app: FastifyInstance) {
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
        "/",
        {
            onRequest: [authorizeAdmin],
            schema: {
                operationId: "news-post",
                tags: ["news"],
                description: "Post a new news item",
                body: NewsRequestBody,
                security: [{ bearerAuth: [] }],
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            const { title, content } = request.body as z.infer<typeof NewsRequestBody>;

            try {
                await prisma.news.create({
                    data: {
                        title,
                        content,
                        author_id: request.user.user_id,
                    },
                });

                reply.status(201).send({
                    message: "News item created successfully",
                });

                setImmediate(() => {
                    void sendNews(title, content);
                });

                return;
            } catch (error) {
                console.error(error);
                return reply.status(500).send({
                    message: "Internal server error",
                });
            }
        },
    );

    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
        "/",
        {
            onRequest: [authenticate],
            schema: {
                operationId: "news-get",
                tags: ["news"],
                description: "Get news items",
                security: [{ bearerAuth: [] }],
            },
        },
        async (_request: FastifyRequest, reply: FastifyReply) => {
            try {
                const newsItems = await prisma.news.findMany({
                    include: {
                        author: {
                            select: {
                                username: true,
                            },
                        },
                    },
                });

                return reply.status(200).send({
                    news: newsItems.map((item) => ({
                        news_id: item.news_id,
                        title: item.title,
                        content: item.content,
                        created_at: item.created_at,
                        author: item.author,
                    })),
                });
            } catch (error) {
                console.error(error);
                return reply.status(500).send({
                    message: "Internal server error",
                });
            }
        },
    );
}
