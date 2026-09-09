import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    console.log("");
    console.log("=========================================");
    console.log("       IMPORTED ITEM DATABASE TEST");
    console.log("=========================================");
    const count = await prisma.item.count();
    console.log(`Total items in DB: ${count}`);
    const firstItems = await prisma.item.findMany({
        orderBy: {
            id: "asc",
        },
        take: 5,
    });
    console.log("");
    console.log("First 5 items:");
    console.dir(firstItems, {
        depth: null,
    });
    const taurusSword = await prisma.item.findUnique({
        where: {
            id: 1100,
        },
    });
    console.log("");
    console.log("Item 1100:");
    console.dir(taurusSword, {
        depth: null,
    });
    console.log("");
    console.log("=========================================");
    await prisma.$disconnect();
}
main().catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
});
