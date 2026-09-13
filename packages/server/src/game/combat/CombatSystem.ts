import {
    calculateAttackComposition,
} from "./attackCalculator";

import {
    calculateDefenseReduction,
    resolveDefPiercing,
} from "./defenseCalculator";

import {
    combatConfig,
} from "./combatConfig";

import {
    calculateResistanceReduction,
} from "./resistanceCalculator";

import {
    calculatePostDefenseDamage,
} from "./postDefenseCalculator";

import {
    calculateCriticalDamage,
} from "./criticalCalculator";

import {
    getElementContext,
    calculateElementalAttackComponents,
} from "./elementComponentCalculator";

import {
    calculateElementalDamage,
} from "./elementDamageCalculator";

import { gameDataService } from "../../services/GameDataService";

import type {
    AttackContext,
    DamageResult,
} from "./combatTypes";

export class CombatSystem {

    performWeaponAttack(
        context: AttackContext,
    ): DamageResult {

        const attributeTable =
            context.attributeTable ??
            gameDataService.getAttributeTable();

        // Get element context WITHOUT modifying components
        // Element will be applied AFTER RES/DEF/Post-DEF per Renewal
        const elementContext =
            getElementContext(
                context.attackElement,
                context.targetElement,
                context.targetElementLevel,
                attributeTable,
                context.statusElement ?? "Neutral",
            );

        // Legacy: preserve old behavior for backwards compatibility
        const elementalComponentsResult =
            calculateElementalAttackComponents(
                context.components,
                context.attacker.combatStats.batk,
                context.attackElement,
                context.targetElement,
                context.targetElementLevel,
                attributeTable,
                context.statusElement ?? "Neutral",
            );

        // Composition uses the ORIGINAL components (not element-modified)
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
                context.ignoreResRate ??
                context.attacker.ignoreRes,
                context.ignoreRes ?? false,
            );

        const defense =
            calculateDefenseReduction(
                resistance.damageAfterResistance,
                context.target.stats,
                {
                    skillRatio: context.skillRatio,
                    isDefPiercing:
                        context.defPiercing ??
                        resolveDefPiercing(
                            context.target.race,
                            context.target.element,
                            context.target.class,
                            context.attacker.defPiercingByRace,
                            context.attacker.defPiercingByElement,
                            context.attacker.defPiercingByClass,
                        ),
                    ignoreDef:
                        context.ignoreDef ?? false,
                    simpleDefense:
                        context.simpleDefense ?? false,
                    weaponDefenseType:
                        combatConfig.weaponDefenseType,
                    ignoreDefRate:
                        context.attacker.ignoreDefRate,
                    targetRace:
                        context.target.race,
                    targetClass:
                        context.target.class,
                    ignoreDefByRace:
                        context.attacker.ignoreDefByRace,
                    ignoreDefByClass:
                        context.attacker.ignoreDefByClass,
                },
            );

        const postDefense =
            calculatePostDefenseDamage(
                defense.effectiveDef,
            );

        // Apply elemental damage AFTER RES/DEF/Post-DEF (Renewal order)
        const elementalDamage =
            calculateElementalDamage(
                postDefense.damage,
                elementContext.attackElement,
                elementContext.targetElement,
                elementContext.targetElementLevel,
                elementContext.attributeTable,
            );

        // Critical is applied AFTER element
        const critical =
            calculateCriticalDamage(
                elementalDamage.postElementDamage,
                context.attacker.combatStats.crit,
                context.isCritical,
            );

        const damage =
            critical.outputDamage;

        return {
            damage,

            isCritical:
                context.isCritical,

            hit: true,

            components:
                context.components,

            elementalComponents: elementalComponentsResult.output,

            resistance,

            defense,

            preDefenseDamage:
                attack.finalDamage,

            postResistanceDamage:
                resistance.damageAfterResistance,

            postDefenseDamage:
                postDefense.damage,

            // Elemental damage tracking
            preElementDamage:
                elementalDamage.preElementDamage,

            postElementDamage:
                elementalDamage.postElementDamage,

        };
    }

}

export const combatSystem =
    new CombatSystem();
