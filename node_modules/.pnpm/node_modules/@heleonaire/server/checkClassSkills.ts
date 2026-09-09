import prisma from "./src/db/prisma";

const classes = [
    "SWORDMAN",
    "KNIGHT",
    "RUNE_KNIGHT",
    "DRAGON_KNIGHT",
];

async function main() {
    for (const aegisName of classes) {
        const gameClass = await prisma.gameClass.findUnique({
            where: {
                aegisName,
            },
            select: {
                id: true,
                aegisName: true,
                name: true,
                parent: {
                    select: {
                        aegisName: true,
                    },
                },
                skills: {
                    select: {
                        classId: true,
                        skillId: true,
                        requiredJobLevel: true,
                        skill: {
                            select: {
                                id: true,
                                aegisName: true,
                                description: true,
                                maxLevel: true,
                            },
                        },
                    },
                    orderBy: {
                        skillId: "asc",
                    },
                },
            },
        });

        if (!gameClass) {
            console.log(`\n${aegisName}: NÃO ENCONTRADA`);
            continue;
        }

        console.log("\n========================================");
        console.log(`${gameClass.aegisName}`);
        console.log(`ID: ${gameClass.id}`);
        console.log(`Parent: ${gameClass.parent?.aegisName ?? "NULL"}`);
        console.log(`Skills atribuídas: ${gameClass.skills.length}`);
        console.log("========================================");

        console.table(
            gameClass.skills.map((classSkill) => ({
                classId: classSkill.classId,
                skillId: classSkill.skillId,
                aegisName: classSkill.skill.aegisName,
                maxLevel: classSkill.skill.maxLevel,
                requiredJobLevel: classSkill.requiredJobLevel,
            }))
        );
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });