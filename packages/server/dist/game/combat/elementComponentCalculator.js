import { applyRenewalElementRatio } from "../../data/rathena/parsers/attrFixParser";
/**
 * Applies Renewal elemental adjustments to attack components according to
 * rAthena battle_calc_weapon_attack():
 *
 * 1. statusAtk:
 *    batk receives elemental adjustment (Neutral by default, or Mild Wind)
 *    and is then doubled for right hand.
 *
 * 2. weaponAtk:
 *    receives elemental adjustment with effective weapon element.
 *
 * 3. equipAtk:
 *    receives elemental adjustment with effective weapon element.
 *
 * 4. masteryAtk & patk:
 *    unaffected by weapon element at this stage.
 */
export function calculateElementalAttackComponents(components, batk, attackElement, targetElement, targetElementLevel, attributeTable, statusElement = "Neutral") {
    const statusRatio = attributeTable.getRatio(targetElementLevel, statusElement, targetElement);
    const weaponRatio = attributeTable.getRatio(targetElementLevel, attackElement, targetElement);
    const elementalBatk = applyRenewalElementRatio(batk, statusRatio);
    const statusAtk = elementalBatk * 2;
    const weaponAtk = applyRenewalElementRatio(components.weaponAtk, weaponRatio);
    const equipAtk = applyRenewalElementRatio(components.equipAtk, weaponRatio);
    const output = {
        statusAtk,
        weaponAtk,
        equipAtk,
        masteryAtk: components.masteryAtk,
        patk: components.patk,
    };
    return {
        input: components,
        output,
        weaponRatio,
        statusRatio,
        attackElement,
        statusElement,
        targetElement,
        targetElementLevel,
    };
}
