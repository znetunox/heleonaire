import {
    calculateAttackComposition,
} from "./attackCalculator";

import {
    calculateDefenseReduction,
} from "./defenseCalculator";

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
                context.attacker.patk,
                context.skillRatio,
                context.skillConstant,
            );

        const defense =
            calculateDefenseReduction(
                attack.finalDamage,
                context.target,
            );

        const damage =
            Math.max(
                1,
                Math.floor(
                    defense.effectiveDef,
                ),
            );

        return {
            damage,

            isCritical:
                context.isCritical,

            hit: true,

            components:
                context.components,

            defense,

            preDefenseDamage:
                attack.finalDamage,

            postDefenseDamage:
                damage,
        };
    }
}
