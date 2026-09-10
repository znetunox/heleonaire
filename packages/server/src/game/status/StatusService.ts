import {
    StatusId,
    StatusInstance,
    StatusSource,
} from "./StatusTypes";

import {
    getStatusDefinition,
} from "./StatusDefinitions";

export type StatusStatKey =
    | "str"
    | "agi"
    | "vit"
    | "int"
    | "dex"
    | "luk"
    | "atk"
    | "matk"
    | "defense"
    | "magicDefense"
    | "hit"
    | "flee"
    | "crit";

export type StatusPercentKey =
    | "maxHpPercent"
    | "maxMpPercent"
    | "atkRate"
    | "weaponAtkRate"
    | "weaponDamageRate";

export type StatusStatModifiers =
    Partial<Record<StatusStatKey, number>>
    & Partial<Record<StatusPercentKey, number>>;

export interface StatusCombatModifiers {
    moveSpeedRate: number;
    aspdFixedBonus: number;
}

export class StatusService {
    private readonly statuses =
        new Map<string, Map<StatusId, StatusInstance>>();

    addStatus(
        characterId: string,
        statusId: StatusId,
        durationMs: number,
        value = 0,
        value2 = 0,
        value3 = 0,
        value4 = 0,
        source?: StatusSource,
        now = Date.now(),
    ): StatusInstance {
        if (!characterId) {
            throw new Error("characterId is required.");
        }

        if (!statusId) {
            throw new Error("statusId is required.");
        }

        if (
            !Number.isFinite(durationMs) ||
            durationMs <= 0
        ) {
            throw new Error(
                `Invalid status duration: ${ durationMs } `,
            );
        }

        const instance: StatusInstance = {
            statusId,
            value,
            value2,
            value3,
            value4,
            startedAt: now,
            expiresAt: now + durationMs,
            source,
        };

        let characterStatuses =
            this.statuses.get(characterId);

        if (!characterStatuses) {
            characterStatuses =
                new Map<StatusId, StatusInstance>();

            this.statuses.set(
                characterId,
                characterStatuses,
            );
        }

        characterStatuses.set(
            statusId,
            instance,
        );

        return instance;
    }

    getCombatModifiers(
        characterId: string,
    ): StatusCombatModifiers {
        const modifiers: StatusCombatModifiers = {
            moveSpeedRate: 0,
            aspdFixedBonus: 0,
        };

        const statuses =
            this.getStatuses(characterId);

        for (const status of statuses) {
            switch (status.statusId) {
                case "SC_SPEEDUP0":
                case "SC_SPEEDUP1":
                    modifiers.moveSpeedRate =
                        Math.max(
                            modifiers.moveSpeedRate,
                            status.value,
                        );
                    break;

                default:
                    break;
            }
        }

        /*
         * Renewal rAthena:
         *
         * SC_ASPDPOTION3
         * SC_ASPDPOTION2
         * SC_ASPDPOTION1
         * SC_ASPDPOTION0
         *
         * The first active status in this priority order
         * contributes its val1 as the fixed ASPD bonus.
         */
        const aspdPotionPriority = [
            "SC_ASPDPOTION3",
            "SC_ASPDPOTION2",
            "SC_ASPDPOTION1",
            "SC_ASPDPOTION0",
        ] as const;

        for (const statusId of aspdPotionPriority) {
            const status =
                statuses.find(
                    entry => entry.statusId === statusId,
                );

            if (status) {
                modifiers.aspdFixedBonus =
                    status.value;
                break;
            }
        }

        return modifiers;
    }

    getStatModifiers(
        characterId: string,
    ): StatusStatModifiers {
        const modifiers: StatusStatModifiers = {};

        const statuses =
            this.getStatuses(characterId);

        for (const status of statuses) {
            const definition =
                getStatusDefinition(
                    status.statusId,
                );

            if (!definition) {
                continue;
            }

            for (const modifier of definition.modifiers) {
                if (modifier.type === "ADDITIVE") {
                    const current =
                        modifiers[modifier.stat] ?? 0;

                    modifiers[modifier.stat] =
                        current + status.value;

                    continue;
                }

                if (modifier.type === "PERCENT") {
                    let key: StatusPercentKey;

                    switch (modifier.stat) {
                        case "maxHp":
                            key = "maxHpPercent";
                            break;

                        case "maxMp":
                            key = "maxMpPercent";
                            break;

                        case "atkRate":
                            key = "atkRate";
                            break;

                        case "weaponAtkRate":
                            key = "weaponAtkRate";
                            break;

                        case "weaponDamageRate":
                            key = "weaponDamageRate";
                            break;
                    }

                    const current =
                        modifiers[key] ?? 0;

                    modifiers[key] =
                        current + status.value;

                    continue;
                }
            }
        }

        return modifiers;
    }

    removeStatus(
        characterId: string,
        statusId: StatusId,
    ): boolean {
        const characterStatuses =
            this.statuses.get(characterId);

        if (!characterStatuses) {
            return false;
        }

        const removed =
            characterStatuses.delete(statusId);

        if (characterStatuses.size === 0) {
            this.statuses.delete(characterId);
        }

        return removed;
    }

    hasStatus(
        characterId: string,
        statusId: StatusId,
    ): boolean {
        const characterStatuses =
            this.statuses.get(characterId);

        if (!characterStatuses) {
            return false;
        }

        return characterStatuses.has(statusId);
    }

    getStatus(
        characterId: string,
        statusId: StatusId,
    ): StatusInstance | undefined {
        return this.statuses
            .get(characterId)
            ?.get(statusId);
    }

    getStatuses(
        characterId: string,
    ): StatusInstance[] {
        const characterStatuses =
            this.statuses.get(characterId);

        if (!characterStatuses) {
            return [];
        }

        return Array.from(
            characterStatuses.values(),
        );
    }

    update(
        now = Date.now(),
    ): string[] {
        const expired: string[] = [];

        for (
            const [
                characterId,
                characterStatuses,
            ]
            of this.statuses
        ) {
            for (
                const [
                    statusId,
                    status,
                ]
                of characterStatuses
            ) {
                if (
                    status.expiresAt <= now
                ) {
                    characterStatuses.delete(
                        statusId,
                    );

                    expired.push(
                        `${ characterId }:${ statusId } `,
                    );
                }
            }

            if (
                characterStatuses.size === 0
            ) {
                this.statuses.delete(
                    characterId,
                );
            }
        }

        return expired;
    }

    clear(
        characterId: string,
    ): void {
        this.statuses.delete(
            characterId,
        );
    }

    clearAll(): void {
        this.statuses.clear();
    }
}

export const statusService =
    new StatusService();