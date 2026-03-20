import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@/lib/prisma.js";

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    try {
        await request.jwtVerify();
    } catch (_err) {
        return reply.status(401).send({ message: "Unauthorized" });
    }

    const ban = await prisma.userBan.findFirst({
        where: {
            user_id: request.user.user_id,
        },
        select: {
            user_id: true,
        },
    });

    if (ban) {
        return reply.status(403).send({ message: "User is blocked" });
    }
}

export async function authorizeAdmin(request: FastifyRequest, reply: FastifyReply) {
    try {
        await request.jwtVerify();
    } catch (_err) {
        return reply.status(401).send({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
        where: {
            user_id: request.user.user_id,
        },
        select: {
            role: {
                select: {
                    name: true,
                },
            },
        },
    });

    if (!user || user.role.name !== "admin") {
        return reply.status(403).send({ message: "Forbidden" });
    }
}
