import { prisma } from "@/lib/prisma.js";
import { bot } from "@/bot/client.js";

bot.start(async (ctx) => {
    const token = ctx.message.text.split(" ")[1];

    if (!token) {
        return ctx.reply("Недействительная ссылка");
    }

    const userId = ctx.message.from.id;

    try {
        const confirmation = await prisma.userTgConfirmation.findFirst({
            where: {
                code: token,
            },
            select: {
                code: true,
                user_id: true,
            },
        });

        if (!confirmation) {
            return ctx.reply("Недействительная ссылка");
        }

        try {
            await prisma.userTg.create({
                data: {
                    user_id: confirmation.user_id,
                    tg_id: userId,
                },
            });
        } catch (error) {
            return ctx.reply("Этот телеграм аккаунт уже привязан к другому профилю в Compairy");
        }

        try {
            await prisma.userTgConfirmation.delete({
                where: {
                    user_id: confirmation.user_id,
                },
            });
        } catch (error) {
            return ctx.reply("Внутренняя ошибка. Пожалуйста, свяжитесь с поддержкой support@compairy.ru");
        }

        return ctx.reply("Телеграм аккаунт успешно привязан к вашему профилю в Compairy!");
    } catch (error) {
        return ctx.reply("Внутренняя ошибка. Пожалуйста, свяжитесь с поддержкой support@compairy.ru");
    }
});

bot.launch(() => {
    console.log("Bot started");
});
