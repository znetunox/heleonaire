import prisma from "./src/db/prisma";

async function main() {
    const items = await prisma.item.findMany({
        where: {
            script: {
                contains: "percentheal",
            },
            type: {
                in: ["Healing", "Usable", "DelayConsume"],
            },
        },
        select: {
            id: true,
            name: true,
            type: true,
            script: true,
        },
        take: 30,
    });

    for (const item of items) {
        console.log("");
        console.log(
            `${item.id} - ${item.name} [${item.type}]`,
        );
        console.log(
            item.script?.replace(/\r/g, "").trim(),
        );
    }

    await prisma.$disconnect();
}

main().catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
});
