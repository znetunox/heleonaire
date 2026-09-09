import prisma from "./src/db/prisma";

async function main() {
    const rows = await prisma.classSkillPrerequisite.findMany({
        select: {
            classSkillId: true,
            requiredSkillId: true,
            requiredLevel: true,
        },
    });

    console.log(`Total de prerequisites: ${rows.length}`);

    console.table(rows);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });