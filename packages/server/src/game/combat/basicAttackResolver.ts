import type {
    AttackComponents,
    PlayerCombatSnapshot,
} from "./combatTypes";

import {
    calculateWeaponAttack,
} from "./weaponAttackCalculator";

import { gameDataService } from "../../services/GameDataService";

export interface BasicAttackOptions {
    targetSize?: string;
    randomValue?: number;
    overRefineRandomValue?: number;
}

export function resolveBasicAttackComponents(
    attacker: PlayerCombatSnapshot,
    options: BasicAttackOptions = {},
): AttackComponents {
    const sizeFixRate =
        attacker.weapon !== null
            ? (() => {
                const sizeFix = gameDataService.getSizeFix(
                    attacker.weapon.weaponType,
                );

                switch (options.targetSize) {
                    case "Small":
                        return sizeFix.small;

                    case "Large":
                        return sizeFix.large;

                    case "Medium":
                    default:
                        return sizeFix.medium;
                }
            })()
            : 100;

    const weaponAttack =
        attacker.weapon !== null
            ? calculateWeaponAttack(
                attacker.combatStats,
                attacker.weapon,
                {
                    weaponAtkRate:
                        attacker.weaponAtkRate,

                    weaponAtkScriptBonus:
                        attacker.weapon.weaponAtkBonus,

                    weaponAtk2ScriptBonus:
                        attacker.weapon.weaponAtk2Bonus,

                    randomValue:
                        options.randomValue ?? 0.5,

                    overRefineRandomValue:
                        options.overRefineRandomValue ?? 0.5,

                    weaponDamageRate:
                        attacker.weaponDamageRateByType[
                        attacker.weapon.weaponType
                        ] ?? 0,

                    sizeFixRate,
                },
            ).value
            : 0;

    return {
        statusAtk:
            attacker.combatStats.batk * 2,

        weaponAtk:
            weaponAttack,

        equipAtk:
            attacker.equipAtk,

        masteryAtk:
            0,

        patk:
            attacker.combatStats.patk,
    };
}