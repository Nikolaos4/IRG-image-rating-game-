import { prisma } from "@/lib/prisma.js";
import { bot } from "./client.js";

// TODO: добавить очередь для отправки сообщений, чтобы не превышать лимиты Telegram API
export async function sendNews(title: string, content: string) {
    const message = `<b>${title}</b>\n\n${content}`;

    const receivers = await prisma.userTg.findMany({
        select: {
            tg_id: true,
        },
    });

    try {
        await Promise.allSettled(
            receivers.map((receiver) => {
                return bot.telegram.sendMessage(receiver.tg_id.toString(), message, { parse_mode: "HTML" });
            }),
        );
    } catch (error) {
        console.error("Error sending news to Telegram:", error);
    }
}
