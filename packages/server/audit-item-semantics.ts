import prisma from "./src/db/prisma";

async function main() {
    const categories = [
        "Weapon",
        "Armor",
        "Card",
        "Shadowgear",
        "Healing",
        "Etc",
    ];

    for (const type of categories) {
        const items = await prisma.item.findMany({
            where: {
                type,
            },
            select: {
                id: true,
                name: true,
                aegisName: true,
                type: true,
                subType: true,
                stack: true,
                uniqueId: true,
                refineable: true,
                gradable: true,
            },
            orderBy: {
                id: "asc",
            },
            take: 20,
        });

        console.log(`\n===== ${type} (${items.length} amostras) =====`);
        console.table(items);
    }
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });