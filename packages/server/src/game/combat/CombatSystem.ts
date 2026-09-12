import {
    calculateAttackComposition,
} from "./attackCalculator";

import {
    calculateDefenseReduction,
} from "./defenseCalculator";

import {
    calculateResistanceReduction,
} from "./resistanceCalculator";

import {
    calculatePostDefenseDamage,
} from "./postDefenseCalculator";

import type {
    AttackContext,
    DamageResult,
} from "./combatTypes";

export class CombatSystem {

    performWeaponAttack(
        context: AttackContext,
    ): DamageResult {

        const attack =
            calculateAttackComposition(
                context.components,
                context.attacker.combatStats.patk,
                context.attacker.atkRate,
                context.skillRatio,
                context.skillConstant,
            );

        const resistance =
            calculateResistanceReduction(
                attack.finalDamage,
                context.target.stats.res,
            );

        const defense =
            calculateDefenseReduction(
                resistance.damageAfterResistance,
                context.target.stats,
                {
                    skillRatio: context.skillRatio,
                    isDefPiercing: false,
                    ignoreDef: false,
                },
            );

        const postDefense =
            calculatePostDefenseDamage(
                defense.effectiveDef,
            );

        const damage =
            postDefense.damage;

        return {
            damage,

            isCritical:
                context.isCritical,

            hit: true,

            components:
                context.components,

            resistance,

            defense,

            preDefenseDamage:
                attack.finalDamage,

            postResistanceDamage:
                resistance.damageAfterResistance,

            postDefenseDamage:
                damage,

        };
    }
}

export const combatSystem =
    new CombatSystem();
