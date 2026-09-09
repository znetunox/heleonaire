import prisma from "./db/prisma";

async function main() {
    const items = await prisma.item.findMany({
        where: {
            name: {
                in: [
                    "Red Potion",
                    "Orange Potion",
                    "White Potion",
                    "Blue Potion",
                ],
            },
        },
        select: {
            id: true,
            aegisName: true,
            name: true,
            type: true,
            subType: true,
            script: true,
            equipScript: true,
            unequipScript: true,
        },
        orderBy: {
            id: "asc",
        },
    });

    for (const item of items) {
        console.log("========================================");
        console.log(`${item.id} - ${item.name}`);
        console.log(`aegisName=${item.aegisName}`);
        console.log(`type=${item.type} subType=${item.subType}`);

        console.log("script:");
        console.log(item.script ?? "(null)");

        console.log("equipScript:");
        console.log(item.equipScript ?? "(null)");

        console.log("unequipScript:");
        console.log(item.unequipScript ?? "(null)");
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
