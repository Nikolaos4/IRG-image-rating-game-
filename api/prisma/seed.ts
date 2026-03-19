import { prisma } from "../src/lib/prisma.js";
import bcrypt from "bcrypt";

async function main() {
    // создаем роли
    await prisma.role.createMany({
        data: [
            { role_id: 1, name: "user" },
            { role_id: 2, name: "admin" },
        ],
        skipDuplicates: true,
    });

    // создаем критерии
    await prisma.criteria.createMany({
        data: [
            { criteria_id: 1, name: "Какой кот милее?", description: "Выберите самого милого кота" },
            { criteria_id: 2, name: "Что вкуснее?", description: "Выберите самое вкусное блюдо" },
        ],
        skipDuplicates: true,
    });

    // создаем тестовые изображения
    await prisma.image.createMany({
        data: [
            { image_id: 1, url: "https://i.redd.it/3yzvxoky9rqf1.jpeg" },
            { image_id: 2, url: "https://i.redd.it/efyfokgqbrqf1.jpeg" },
            { image_id: 3, url: "https://i.redd.it/pf1glvcxkrqf1.jpeg" },
            { image_id: 4, url: "https://i.redd.it/49ig54r7ywqf1.jpeg" },
            { image_id: 5, url: "https://i.redd.it/kca84fgo1zqf1.jpeg" },
            { image_id: 6, url: "https://i.redd.it/a9o22nlbc2rf1.jpeg" },
            { image_id: 7, url: "https://i.redd.it/t7lsd70huhrf1.jpeg" },
            { image_id: 8, url: "https://i.redd.it/pijosj0ejkrf1.jpeg" },
            { image_id: 9, url: "https://i.redd.it/3a9pyzejoqrf1.jpeg" },
            { image_id: 10, url: "https://i.redd.it/13hel5g8axrf1.png" },
        ],
        skipDuplicates: true,
    });

    // создаем рейтинг для изображений
    await prisma.imageRating.createMany({
        data: [
            { image_id: 1, criteria_id: 1, votes: 5 },
            { image_id: 2, criteria_id: 1, votes: 4 },
            { image_id: 3, criteria_id: 1, votes: 3 },
            { image_id: 4, criteria_id: 1, votes: 2 },
            { image_id: 5, criteria_id: 1, votes: 1 },
            { image_id: 6, criteria_id: 1, votes: 5 },
            { image_id: 7, criteria_id: 1, votes: 4 },
            { image_id: 8, criteria_id: 1, votes: 3 },
            { image_id: 9, criteria_id: 1, votes: 2 },
            { image_id: 10, criteria_id: 1, votes: 1 },
        ],
        skipDuplicates: true,
    });

    // создаем тестового администратора
    const adminPasswordHash = await bcrypt.hash("admin123", 10);

    const adminUser = await prisma.user.upsert({
        where: {
            email: "admin@compairy.test",
        },
        update: {
            username: "admin",
            password: adminPasswordHash,
            role_id: 2,
        },
        create: {
            username: "admin",
            email: "admin@compairy.test",
            password: adminPasswordHash,
            role_id: 2,
        },
    });

    await prisma.userRating.upsert({
        where: {
            user_id: adminUser.user_id,
        },
        update: {
            wins: 0,
            losses: 0,
        },
        create: {
            user_id: adminUser.user_id,
            wins: 0,
            losses: 0,
        },
    });

    console.log("Database seeded successfully");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
