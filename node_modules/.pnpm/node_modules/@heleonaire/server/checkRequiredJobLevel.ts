import prisma from "./src/db/prisma";

async function main() {
    const rows = await prisma.classSkill.findMany({
        where: {
            requiredJobLevel: {
                not: 0,
            },
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
                    description: true,
                    maxLevel: true,
                },
            },
        },
    });

    console.table(
        rows.map((row) => ({
            classId: row.classId,
            class: row.class.aegisName,
            skillId: row.skillId,
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