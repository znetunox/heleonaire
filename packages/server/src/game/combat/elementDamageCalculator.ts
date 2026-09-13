import type { RathenaElement } from "../../data/rathena/parsers/attrFixParser";
import type { ParsedAttributeTable } from "../../data/rathena/parsers/attrFixParser";
import { applyRenewalElementRatio } from "../../data/rathena/parsers/attrFixParser";

/**
 * Result of elemental damage calculation.
 *
 * Preserves the pre-element damage for auditing purposes.
 */
export interface ElementalDamageResult {
    /**
     * Damage before elemental adjustment.
     * This is the input damage, unchanged.
     */
    preElementDamage: number;

    /**
     * Damage after elemental adjustment.
     * This is the effective damage after element type interaction.
     */
    postElementDamage: number;

    /**
     * The element ratio applied (0-100).
     * 100 = neutral (no change)
     * < 100 = reduced damage
     * > 100 = increased damage
     */
    elementRatio: number;

    /**
     * Attack element used for the calculation.
     */
    attackElement: RathenaElement;

    /**
     * Target element used for the calculation.
     */
    targetElement: RathenaElement;

    /**
     * Target element level used for the calculation.
     */
    targetElementLevel: number;
}

/**
 * Applies Renewal elemental damage calculation to a composed damage value.
 *
 * This function implements the equivalent of rAthena's battle_calc_element_damage(),
 * which is applied AFTER DEF/RES/Post-DEF, not before composition.
 *
 * Formula:
 *   result = damage - trunc(damage * (100 - ratio) / 100)
 *
 * Where ratio comes from the attribute table based on:
 *   - attackElement (weapon/status element)
 *   - targetElement (mob/player element)
 *   - targetElementLevel (1-4)
 *
 * @param damage - The composed damage before elemental adjustment
 * @param attackElement - The attack's effective element
 * @param targetElement - The target's element
 * @param targetElementLevel - The target's element level (1-4)
 * @param attributeTable - The attribute table for ratio lookup
 * @returns ElementalDamageResult with pre/post damage values
 */
export function calculateElementalDamage(
    damage: number,
    attackElement: RathenaElement,
    targetElement: RathenaElement,
    targetElementLevel: number,
    attributeTable: ParsedAttributeTable,
): ElementalDamageResult {
    const ratio = attributeTable.getRatio(
        targetElementLevel,
        attackElement,
        targetElement,
    );

    const postElementDamage = applyRenewalElementRatio(
        damage,
        ratio,
    );

    return {
        preElementDamage: damage,
        postElementDamage,
        elementRatio: ratio,
        attackElement,
        targetElement,
        targetElementLevel,
    };
}
