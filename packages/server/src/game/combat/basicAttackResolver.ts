import type {
    AttackComponents,
    PlayerCombatSnapshot,
} from "./combatTypes";

import {
    calculateWeaponAttack,
} from "./weaponAttackCalculator";

export interface BasicAttackOptions {
    randomValue?: number;
    overRefineRandomValue?: number;
}

export function resolveBasicAttackComponents(
    attacker: PlayerCombatSnapshot,
    options: BasicAttackOptions = {},
): AttackComponents {
    const weaponAttack =
        attacker.weapon !== null
            ? calculateWeaponAttack(
                attacker.combatStats,
                attacker.weapon,
                attacker.weaponAtkRate,
                options.randomValue ?? 0.5,
                options.overRefineRandomValue ?? 0.5,
            ).value
            : 0;

    return {
        statusAtk:
            attacker.combatStats.statusAtk,

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