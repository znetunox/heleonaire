import prisma from "./src/db/prisma";

async function main() {
    const rows = await prisma.classSkillPrerequisite.findMany({
        select: {
            requiredLevel: true,

            classSkill: {
                select: {
                    classId: true,
                    class: {
                        select: {
                            aegisName: true,
                        },
                    },
                    skill: {
                        select: {
                            aegisName: true,
                        },
                    },
                },
            },

            requiredSkill: {
                select: {
                    id: true,
                    aegisName: true,
                },
            },
        },
    });

    console.log(`\nTotal de prerequisites: ${rows.length}\n`);

    // Agrupa por classe
    const byClass = new Map<
        string,
        {
            count: number;
            examples: string[];
        }
    >();

    for (const row of rows) {
        const className = row.classSkill.class.aegisName;

        if (!byClass.has(className)) {
            byClass.set(className, {
                count: 0,
                examples: [],
            });
        }

        const data = byClass.get(className)!;
        data.count++;

        if (data.examples.length < 3) {
            data.examples.push(
                `${row.classSkill.skill.aegisName} -> ${row.requiredSkill.aegisName} Lv.${row.requiredLevel}`
            );
        }
    }

    console.log("Prerequisites por classe:");
    console.table(
        [...byClass.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([className, data]) => ({
                class: className,
                prerequisites: data.count,
                examples: data.examples.join(" | "),
            }))
    );

    // Verifica requisitos apontando para skills inexistentes
    const invalid = rows.filter(
        row => !row.requiredSkill
    );

    console.log(`\nRequisitos com skill inexistente: ${invalid.length}`);

    if (invalid.length > 0) {
        console.table(
            invalid.slice(0, 20).map(row => ({
                class: row.classSkill.class.aegisName,
                skill: row.classSkill.skill.aegisName,
                requiredSkillId: row.requiredSkill?.id ?? "MISSING",
                requiredLevel: row.requiredLevel,
            }))
        );
    }

    // Verifica níveis inválidos
    const invalidLevels = rows.filter(
        row => row.requiredLevel < 1
    );

    console.log(`Requisitos com nível inválido (< 1): ${invalidLevels.length}`);

    // Algumas skills importantes para inspeção
    const importantSkills = [
        "LK_SPIRALPIERCE",
        "LK_BERSERK",
        "RK_DRAGONBREATH",
        "RK_SONICWAVE",
    ];

    const important = rows.filter(row =>
        importantSkills.includes(row.classSkill.skill.aegisName)
    );

    console.log(`\nRequisitos das skills selecionadas: ${important.length}`);

    console.table(
        important.map(row => ({
            class: row.classSkill.class.aegisName,
            skill: row.classSkill.skill.aegisName,
            requiredSkill: row.requiredSkill.aegisName,
            requiredLevel: row.requiredLevel,
        }))
    );
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });