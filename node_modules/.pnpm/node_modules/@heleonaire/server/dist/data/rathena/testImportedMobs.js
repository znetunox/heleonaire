import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    console.log("");
    console.log("=========================================");
    console.log("       IMPORTED MOB DATABASE TEST");
    console.log("=========================================");
    const count = await prisma.mob.count();
    console.log(`Total mobs in DB: ${count}`);
    const firstMobs = await prisma.mob.findMany({
        orderBy: {
            id: "asc",
        },
        take: 5,
    });
    console.log("");
    console.log("First 5 mobs:");
    console.dir(firstMobs, {
        depth: null,
    });
    const poring = await prisma.mob.findUnique({
        where: {
            id: 1002,
        },
    });
    console.log("");
    console.log("Mob 1002:");
    console.dir(poring, {
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
