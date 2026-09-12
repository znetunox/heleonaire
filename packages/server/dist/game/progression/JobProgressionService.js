import prisma from "../../db/prisma";
const MAX_LEVEL_JOB_EXP = 999999999n;
class JobProgressionService {
    /**
     * Grants Job EXP to a character and processes Job Level progression.
     *
     * rAthena semantics:
     * - JobExpEntry.level represents the EXP required to go
     *   from the current Job Level to the next one.
     * - Job Level 1 uses the entry with level = 1.
     * - Each Job Level gained grants exactly 1 skill point.
     * - Only one Job Level is gained per EXP event when
     *   multi_level_up is disabled (rAthena default).
     * - At max Job Level, no further progression occurs.
     *
     * All database changes are performed atomically inside
     * a Prisma transaction.
     */
    async gainJobExp(characterId, amount) {
        if (amount < 0n) {
            throw new Error("INVALID_JOB_EXP_AMOUNT");
        }
        if (amount === 0n) {
            return this.getCurrentProgression(characterId);
        }
        return prisma.$transaction(async (tx) => {
            const character = await tx.character.findUnique({
                where: {
                    id: characterId,
                },
            });
            if (!character) {
                throw new Error("CHARACTER_NOT_FOUND");
            }
            const gameClass = await tx.gameClass.findUnique({
                where: {
                    aegisName: character.jobKey,
                },
            });
            if (!gameClass) {
                throw new Error("JOB_NOT_FOUND");
            }
            if (gameClass.jobExpGroupId === null) {
                throw new Error("JOB_EXP_GROUP_NOT_FOUND");
            }
            const jobExpGroup = await tx.jobExpGroup.findUnique({
                where: {
                    id: gameClass.jobExpGroupId,
                },
            });
            if (!jobExpGroup) {
                throw new Error("JOB_EXP_GROUP_NOT_FOUND");
            }
            const maxJobLevel = jobExpGroup.maxJobLevel;
            /*
             * Character.jobLevel should never be below 1,
             * but guard against invalid persisted data.
             */
            if (character.jobLevel < 1) {
                throw new Error("INVALID_JOB_LEVEL");
            }
            /*
             * Already at maximum Job Level.
             *
             * There is no next JobExpEntry to process.
             * Keep the character at max level and do not
             * accumulate additional progression EXP.
             */
            if (character.jobLevel >= maxJobLevel) {
                return {
                    characterId,
                    jobLevel: maxJobLevel,
                    jobExp: character.jobExp,
                    availableSkillPoints: character.availableSkillPoints,
                    jobLevelUps: 0,
                    requiredJobExp: null,
                    maxJobLevel,
                };
            }
            /*
             * The entry at the current Job Level is the
             * threshold required to advance to the next level.
             *
             * Example:
             *   jobLevel = 1
             *   JobExpEntry.level = 1
             *   exp = required EXP for 1 -> 2
             */
            const currentEntry = await tx.jobExpEntry.findUnique({
                where: {
                    groupId_level: {
                        groupId: jobExpGroup.id,
                        level: character.jobLevel,
                    },
                },
            });
            if (!currentEntry) {
                throw new Error("JOB_EXP_ENTRY_NOT_FOUND");
            }
            const requiredJobExp = currentEntry.exp;
            let jobExp = character.jobExp + amount;
            let jobLevel = character.jobLevel;
            let availableSkillPoints = character.availableSkillPoints;
            let jobLevelUps = 0;
            /*
             * rAthena's default configuration has multi_level_up
             * disabled.
             *
             * Therefore one EXP event can cause at most one
             * Job Level increase.
             */
            if (jobExp >= requiredJobExp) {
                jobExp -= requiredJobExp;
                jobLevel += 1;
                availableSkillPoints += 1;
                jobLevelUps = 1;
                /*
                 * With multi_level_up disabled, rAthena prevents
                 * the remaining EXP from immediately causing
                 * another level-up during the same EXP event.
                 *
                 * Keep the remaining EXP below the next threshold.
                 */
                if (jobLevel >= maxJobLevel) {
                    jobExp =
                        jobExp > MAX_LEVEL_JOB_EXP
                            ? MAX_LEVEL_JOB_EXP
                            : jobExp;
                }
                else {
                    const nextEntry = await tx.jobExpEntry.findUnique({
                        where: {
                            groupId_level: {
                                groupId: jobExpGroup.id,
                                level: jobLevel,
                            },
                        },
                    });
                    if (!nextEntry) {
                        throw new Error("JOB_EXP_ENTRY_NOT_FOUND");
                    }
                    const nextRequiredJobExp = nextEntry.exp;
                    if (jobExp >= nextRequiredJobExp) {
                        jobExp =
                            nextRequiredJobExp - 1n;
                    }
                }
            }
            /*
             * At maximum Job Level, no further Job Level
             * progression is possible.
             *
             * We intentionally keep the current remainder,
             * because the exact maximum-level EXP cap can be
             * introduced separately once MAX_LEVEL_JOB_EXP
             * semantics are defined for Heleonaire.
             */
            if (jobLevel > maxJobLevel) {
                jobLevel = maxJobLevel;
            }
            const updatedCharacter = await tx.character.update({
                where: {
                    id: characterId,
                },
                data: {
                    jobLevel,
                    jobExp,
                    availableSkillPoints,
                },
            });
            let updatedRequiredJobExp = null;
            if (updatedCharacter.jobLevel <
                maxJobLevel) {
                const nextEntry = await tx.jobExpEntry.findUnique({
                    where: {
                        groupId_level: {
                            groupId: jobExpGroup.id,
                            level: updatedCharacter.jobLevel,
                        },
                    },
                });
                if (!nextEntry) {
                    throw new Error("JOB_EXP_ENTRY_NOT_FOUND");
                }
                updatedRequiredJobExp =
                    nextEntry.exp;
            }
            return {
                characterId,
                jobLevel: updatedCharacter.jobLevel,
                jobExp: updatedCharacter.jobExp,
                availableSkillPoints: updatedCharacter.availableSkillPoints,
                jobLevelUps,
                requiredJobExp: updatedRequiredJobExp,
                maxJobLevel,
            };
        });
    }
    /**
     * Returns the character's current Job EXP progression
     * without modifying anything.
     */
    async getCurrentProgression(characterId) {
        const character = await prisma.character.findUnique({
            where: {
                id: characterId,
            },
        });
        if (!character) {
            throw new Error("CHARACTER_NOT_FOUND");
        }
        const gameClass = await prisma.gameClass.findUnique({
            where: {
                aegisName: character.jobKey,
            },
        });
        if (!gameClass) {
            throw new Error("JOB_NOT_FOUND");
        }
        if (gameClass.jobExpGroupId === null) {
            throw new Error("JOB_EXP_GROUP_NOT_FOUND");
        }
        const jobExpGroup = await prisma.jobExpGroup.findUnique({
            where: {
                id: gameClass.jobExpGroupId,
            },
        });
        if (!jobExpGroup) {
            throw new Error("JOB_EXP_GROUP_NOT_FOUND");
        }
        const maxJobLevel = jobExpGroup.maxJobLevel;
        let requiredJobExp = null;
        if (character.jobLevel < maxJobLevel) {
            const entry = await prisma.jobExpEntry.findUnique({
                where: {
                    groupId_level: {
                        groupId: jobExpGroup.id,
                        level: character.jobLevel,
                    },
                },
            });
            if (!entry) {
                throw new Error("JOB_EXP_ENTRY_NOT_FOUND");
            }
            requiredJobExp = entry.exp;
        }
        return {
            characterId,
            jobLevel: character.jobLevel,
            jobExp: character.jobExp,
            availableSkillPoints: character.availableSkillPoints,
            jobLevelUps: 0,
            requiredJobExp,
            maxJobLevel,
        };
    }
}
export default JobProgressionService;
