import { prisma } from "../src/lib/prisma.js";

async function main() {
    // создаем роли
    await prisma.role.createMany({
        data: [
            { role_id: 1, name: "user" },
            { role_id: 2, name: "admin" },
        ],
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
