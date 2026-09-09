import prisma from "./src/db/prisma";

async function main() {
    const rows = await prisma.classSkill.findMany({
        where: {
            OR: [
                { requiredJobLevel: { not: 0 } },
            ],
        },
        select: {
            classId: true,
            skillId: true,
            requiredJobLevel: true,
            class: {
                select: {
                    aegisName: true,
                    name: true,
                },
            },
            skill: {
                select: {
                    aegisName: true,
                    maxLevel: true,
                },
            },
        },
        orderBy: [
            { classId: "asc" },
            { requiredJobLevel: "asc" },
        ],
    });

    console.table(
        rows.map((row) => ({
            classId: row.classId,
            class: row.class.aegisName,
            skill: row.skill.aegisName,
            maxLevel: row.skill.maxLevel,
            requiredJobLevel: row.requiredJobLevel,
        }))
    );
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });