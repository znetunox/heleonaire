import prisma from "./src/db/prisma";
import { parseItems } from "./src/data/rathena/parsers/itemParser";

async function main() {
    const parsed = parseItems();

    const parsedSword = parsed.items.get(1101);

    if (!parsedSword) {
        throw new Error("Sword 1101 não encontrado no parser.");
    }

    const dbSword = await prisma.item.findUnique({
        where: {
            id: 1101,
        },
        select: {
            id: true,
            aegisName: true,
            name: true,
            refineable: true,
            gradable: true,
            stack: true,
            source: true,
            sourceHash: true,
        },
    });

    console.log("\n===== PARSER =====");
    console.dir(parsedSword, { depth: null });

    console.log("\n===== PRISMA =====");
    console.dir(dbSword, { depth: null });
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });