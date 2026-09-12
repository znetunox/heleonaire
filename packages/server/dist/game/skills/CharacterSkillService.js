import prisma from "../../db/prisma";
class CharacterSkillService {
    /**
     * Returns all skills learned/known by the character,
     * including skills that exist at level 0 but are not learned.
     */
    async getCharacterSkills(characterId) {
        return prisma.characterSkill.findMany({
            where: {
                characterId,
            },
            include: {
                skill: true,
            },
            orderBy: {
                skillId: "asc",
            },
        });
    }
    /**
     * Returns a specific character skill.
     */
    async getCharacterSkill(characterId, skillId) {
        return prisma.characterSkill.findUnique({
            where: {
                characterId_skillId: {
                    characterId,
                    skillId,
                },
            },
            include: {
                skill: true,
            },
        });
    }
    /**
     * Checks whether the character can learn the next level
     * of the specified skill.
     */
    async canLearnSkill(characterId, skillId) {
        const character = await prisma.character.findUnique({
            where: {
                id: characterId,
            },
        });
        if (!character) {
            return {
                canLearn: false,
                reason: "CHARACTER_NOT_FOUND",
            };
        }
        const skill = await prisma.skill.findUnique({
            where: {
                id: skillId,
            },
        });
        if (!skill) {
            return {
                canLearn: false,
                reason: "SKILL_NOT_FOUND",
            };
        }
        /*
         * jobKey is the authoritative runtime job.
         *
         * Example:
         *   MAGE -> GameClass.aegisName = MAGE
         *   SWORDMAN -> GameClass.aegisName = SWORDMAN
         */
        const gameClass = await prisma.gameClass.findUnique({
            where: {
                aegisName: character.jobKey,
            },
        });
        if (!gameClass) {
            return {
                canLearn: false,
                reason: "JOB_NOT_FOUND",
            };
        }
        const classSkill = await prisma.classSkill.findUnique({
            where: {
                classId_skillId: {
                    classId: gameClass.id,
                    skillId,
                },
            },
            include: {
                prerequisites: true,
            },
        });
        if (!classSkill) {
            return {
                canLearn: false,
                reason: "SKILL_NOT_AVAILABLE_FOR_JOB",
            };
        }
        const characterSkill = await prisma.characterSkill.findUnique({
            where: {
                characterId_skillId: {
                    characterId,
                    skillId,
                },
            },
        });
        const currentLevel = characterSkill?.level ?? 0;
        const nextLevel = currentLevel + 1;
        if (nextLevel > classSkill.maxLevel) {
            return {
                canLearn: false,
                reason: "MAX_LEVEL_REACHED",
                currentLevel,
                maxLevel: classSkill.maxLevel,
            };
        }
        if (character.jobLevel < classSkill.requiredJobLevel) {
            return {
                canLearn: false,
                reason: "JOB_LEVEL_TOO_LOW",
                currentJobLevel: character.jobLevel,
                requiredJobLevel: classSkill.requiredJobLevel,
            };
        }
        /*
         * Check every prerequisite required by this job's
         * skill tree branch.
         */
        if (classSkill.prerequisites.length > 0) {
            const requiredSkillIds = classSkill.prerequisites.map(prerequisite => prerequisite.requiredSkillId);
            const learnedSkills = await prisma.characterSkill.findMany({
                where: {
                    characterId,
                    skillId: {
                        in: requiredSkillIds,
                    },
                },
            });
            for (const prerequisite of classSkill.prerequisites) {
                const learnedSkill = learnedSkills.find(entry => entry.skillId === prerequisite.requiredSkillId);
                const learnedLevel = learnedSkill?.level ?? 0;
                if (learnedLevel < prerequisite.requiredLevel) {
                    return {
                        canLearn: false,
                        reason: "PREREQUISITE_NOT_MET",
                        requiredSkillId: prerequisite.requiredSkillId,
                        requiredLevel: prerequisite.requiredLevel,
                        currentLevel: learnedLevel,
                    };
                }
            }
        }
        if (character.availableSkillPoints <= 0) {
            return {
                canLearn: false,
                reason: "NO_SKILL_POINTS",
                availableSkillPoints: character.availableSkillPoints,
            };
        }
        return {
            canLearn: true,
            skillId,
            currentLevel,
            nextLevel,
            maxLevel: classSkill.maxLevel,
            availableSkillPoints: character.availableSkillPoints,
        };
    }
    /**
     * Learns the next level of a skill.
     *
     * The operation is transactional so the skill point cannot
     * be consumed twice by concurrent requests.
     */
    async learnSkill(characterId, skillId) {
        return prisma.$transaction(async (tx) => {
            const character = await tx.character.findUnique({
                where: {
                    id: characterId,
                },
            });
            if (!character) {
                throw new Error("CHARACTER_NOT_FOUND");
            }
            if (character.availableSkillPoints <= 0) {
                throw new Error("NO_SKILL_POINTS");
            }
            const skill = await tx.skill.findUnique({
                where: {
                    id: skillId,
                },
            });
            if (!skill) {
                throw new Error("SKILL_NOT_FOUND");
            }
            const gameClass = await tx.gameClass.findUnique({
                where: {
                    aegisName: character.jobKey,
                },
            });
            if (!gameClass) {
                throw new Error("JOB_NOT_FOUND");
            }
            const classSkill = await tx.classSkill.findUnique({
                where: {
                    classId_skillId: {
                        classId: gameClass.id,
                        skillId,
                    },
                },
                include: {
                    prerequisites: true,
                },
            });
            if (!classSkill) {
                throw new Error("SKILL_NOT_AVAILABLE_FOR_JOB");
            }
            const characterSkill = await tx.characterSkill.findUnique({
                where: {
                    characterId_skillId: {
                        characterId,
                        skillId,
                    },
                },
            });
            const currentLevel = characterSkill?.level ?? 0;
            const nextLevel = currentLevel + 1;
            if (nextLevel > classSkill.maxLevel) {
                throw new Error("MAX_LEVEL_REACHED");
            }
            if (character.jobLevel < classSkill.requiredJobLevel) {
                throw new Error("JOB_LEVEL_TOO_LOW");
            }
            /*
             * Check prerequisites inside the transaction as well.
             * This is intentional: canLearnSkill() is only a query,
             * while learnSkill() must independently enforce all rules.
             */
            for (const prerequisite of classSkill.prerequisites) {
                const requiredCharacterSkill = await tx.characterSkill.findUnique({
                    where: {
                        characterId_skillId: {
                            characterId,
                            skillId: prerequisite.requiredSkillId,
                        },
                    },
                });
                const requiredLevel = requiredCharacterSkill?.level ?? 0;
                if (requiredLevel < prerequisite.requiredLevel) {
                    throw new Error("PREREQUISITE_NOT_MET");
                }
            }
            const updatedSkill = await tx.characterSkill.upsert({
                where: {
                    characterId_skillId: {
                        characterId,
                        skillId,
                    },
                },
                create: {
                    characterId,
                    skillId,
                    level: 1,
                    learned: true,
                },
                update: {
                    level: nextLevel,
                    learned: true,
                },
                include: {
                    skill: true,
                },
            });
            const updatedCharacter = await tx.character.update({
                where: {
                    id: characterId,
                },
                data: {
                    availableSkillPoints: {
                        decrement: 1,
                    },
                },
                select: {
                    availableSkillPoints: true,
                },
            });
            return {
                skill: updatedSkill,
                availableSkillPoints: updatedCharacter.availableSkillPoints,
            };
        });
    }
    /**
     * Skill reset/refund rules are not implemented yet.
     */
    async resetSkill(characterId, skillId) {
        throw new Error("SKILL_RESET_NOT_IMPLEMENTED");
    }
}
export default CharacterSkillService;
