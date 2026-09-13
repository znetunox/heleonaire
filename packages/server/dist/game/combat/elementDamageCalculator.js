import { applyRenewalElementRatio } from "../../data/rathena/parsers/attrFixParser";
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
export function calculateElementalDamage(damage, attackElement, targetElement, targetElementLevel, attributeTable) {
    const ratio = attributeTable.getRatio(targetElementLevel, attackElement, targetElement);
    const postElementDamage = applyRenewalElementRatio(damage, ratio);
    return {
        preElementDamage: damage,
        postElementDamage,
        elementRatio: ratio,
        attackElement,
        targetElement,
        targetElementLevel,
    };
}
