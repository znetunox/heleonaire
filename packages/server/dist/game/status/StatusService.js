import { getStatusDefinition, } from "./StatusDefinitions";
export class StatusService {
    constructor() {
        this.statuses = new Map();
    }
    addStatus(characterId, statusId, durationMs, value = 0, value2 = 0, value3 = 0, value4 = 0, source, now = Date.now()) {
        if (!characterId) {
            throw new Error("characterId is required.");
        }
        if (!statusId) {
            throw new Error("statusId is required.");
        }
        if (!Number.isFinite(durationMs) ||
            durationMs <= 0) {
            throw new Error(`Invalid status duration: ${durationMs} `);
        }
        const instance = {
            statusId,
            value,
            value2,
            value3,
            value4,
            startedAt: now,
            expiresAt: now + durationMs,
            source,
        };
        let characterStatuses = this.statuses.get(characterId);
        if (!characterStatuses) {
            characterStatuses =
                new Map();
            this.statuses.set(characterId, characterStatuses);
        }
        characterStatuses.set(statusId, instance);
        return instance;
    }
    getCombatModifiers(characterId) {
        const modifiers = {
            moveSpeedRate: 0,
            aspdFixedBonus: 0,
        };
        const statuses = this.getStatuses(characterId);
        for (const status of statuses) {
            switch (status.statusId) {
                case "SC_SPEEDUP0":
                case "SC_SPEEDUP1":
                    modifiers.moveSpeedRate =
                        Math.max(modifiers.moveSpeedRate, status.value);
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
        ];
        for (const statusId of aspdPotionPriority) {
            const status = statuses.find(entry => entry.statusId === statusId);
            if (status) {
                modifiers.aspdFixedBonus =
                    status.value;
                break;
            }
        }
        return modifiers;
    }
    getStatModifiers(characterId) {
        const modifiers = {};
        const statuses = this.getStatuses(characterId);
        for (const status of statuses) {
            const definition = getStatusDefinition(status.statusId);
            if (!definition) {
                continue;
            }
            for (const modifier of definition.modifiers) {
                if (modifier.type === "ADDITIVE") {
                    const current = modifiers[modifier.stat] ?? 0;
                    modifiers[modifier.stat] =
                        current + status.value;
                    continue;
                }
                if (modifier.type === "PERCENT") {
                    let key;
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
                    const current = modifiers[key] ?? 0;
                    modifiers[key] =
                        current + status.value;
                    continue;
                }
            }
        }
        return modifiers;
    }
    removeStatus(characterId, statusId) {
        const characterStatuses = this.statuses.get(characterId);
        if (!characterStatuses) {
            return false;
        }
        const removed = characterStatuses.delete(statusId);
        if (characterStatuses.size === 0) {
            this.statuses.delete(characterId);
        }
        return removed;
    }
    hasStatus(characterId, statusId) {
        const characterStatuses = this.statuses.get(characterId);
        if (!characterStatuses) {
            return false;
        }
        return characterStatuses.has(statusId);
    }
    getStatus(characterId, statusId) {
        return this.statuses
            .get(characterId)
            ?.get(statusId);
    }
    getStatuses(characterId) {
        const characterStatuses = this.statuses.get(characterId);
        if (!characterStatuses) {
            return [];
        }
        return Array.from(characterStatuses.values());
    }
    update(now = Date.now()) {
        const expired = [];
        for (const [characterId, characterStatuses,] of this.statuses) {
            for (const [statusId, status,] of characterStatuses) {
                if (status.expiresAt <= now) {
                    characterStatuses.delete(statusId);
                    expired.push(`${characterId}:${statusId} `);
                }
            }
            if (characterStatuses.size === 0) {
                this.statuses.delete(characterId);
            }
        }
        return expired;
    }
    clear(characterId) {
        this.statuses.delete(characterId);
    }
    clearAll() {
        this.statuses.clear();
    }
}
export const statusService = new StatusService();
