import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { FastifyZodOpenApiTypeProvider } from "fastify-zod-openapi";
import { authenticate } from "@/lib/authenticate.js";
import { prisma } from "@/lib/prisma.js";

export default async function account(app: FastifyInstance) {
    app.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
        "/account/connect-tg",
        {
            onRequest: [authenticate],
            schema: {
                operationId: "account-connect-tg",
                tags: ["account"],
                description: "Connect telegram account",
                security: [{ bearerAuth: [] }],
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const existingConfirmation = await prisma.userTgConfirmation.findUnique({
                    where: {
                        user_id: request.user.user_id,
                    },
                });

                if (existingConfirmation) {
                    return reply.status(200).send({
                        code: existingConfirmation.code,
                    });
                }
            } catch (error) {
                console.error(error);
                return reply.status(500).send({
                    message: "Internal server error",
                });
            }
            try {
                const confirmation = await prisma.userTgConfirmation.create({
                    data: {
                        user_id: request.user.user_id,
                    },
                    select: {
                        code: true,
                    },
                });
                return reply.status(200).send({
                    code: confirmation.code,
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
