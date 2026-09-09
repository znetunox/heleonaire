import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const total = await prisma.dropEntry.count();
    const poring = await prisma.mob.findUnique({
        where: {
            id: 1002,
        },
        include: {
            drops: {
                include: {
                    item: {
                        select: {
                            id: true,
                            aegisName: true,
                            name: true,
                        },
                    },
                },
                orderBy: {
                    sourceKey: "asc",
                },
            },
        },
    });
    console.log("");
    console.log("========================================");
    console.log("          IMPORTED DROP TEST");
    console.log("========================================");
    console.log("");
    console.log(`Total DropEntry: ${total}`);
    console.log("");
    if (!poring) {
        console.error("Poring #1002 não encontrado.");
        return;
    }
    console.log(`Mob: ${poring.name}`);
    console.log(`Drops: ${poring.drops.length}`);
    console.log("");
    for (const drop of poring.drops) {
        console.log(`${drop.sourceKey} | ` +
            `${drop.item.aegisName} (#${drop.item.id}) | ` +
            `rate=${drop.rate} | ` +
            `stealProtected=${drop.stealProtected}`);
    }
    const apples = poring.drops.filter((drop) => drop.item.aegisName === "Apple");
    console.log("");
    console.log(`Apple entries: ${apples.length}`);
    for (const apple of apples) {
        console.log(`  ${apple.sourceKey} → rate=${apple.rate}`);
    }
    console.log("");
}
main()
    .catch((error) => {
    console.error(error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
