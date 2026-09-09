import prisma from "./src/db/prisma";

async function main() {
    const rows = await prisma.gameClass.findMany({
        where: {
            aegisName: {
                in: [
                    "SWORDMAN",
                    "KNIGHT",
                    "LORD_KNIGHT",
                    "RUNE_KNIGHT",
                    "DRAGON_KNIGHT",
                    "THIEF",
                    "ASSASSIN",
                    "ASSASSIN_CROSS",
                    "GUILLOTINE_CROSS",
                    "SHADOW_CROSS",
                    "ARCHER",
                    "HUNTER",
                    "SNIPER",
                    "RANGER",
                    "WINDHAWK",
                    "MAGE",
                    "WIZARD",
                    "HIGH_WIZARD",
                    "WARLOCK",
                    "ARCH_MAGE",
                    "ACOLYTE",
                    "PRIEST",
                    "HIGH_PRIEST",
                    "ARCH_BISHOP",
                    "CARDINAL",
                ],
            },
        },
        select: {
            id: true,
            aegisName: true,
            name: true,
            parentId: true,
            parent: {
                select: {
                    aegisName: true,
                },
            },
            _count: {
                select: {
                    skills: true,
                },
            },
        },
        orderBy: {
            id: "asc",
        },
    });

    console.table(rows);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });