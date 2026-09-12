import type { RathenaElement } from "../../data/rathena/parsers/attrFixParser";
import type { ParsedAttributeTable } from "../../data/rathena/parsers/attrFixParser";
import type { AttackComponents } from "./combatTypes";

export interface ElementComponentCalculationResult {
    input: AttackComponents;
    output: AttackComponents;
    ratio: number;
    attackElement: RathenaElement;
    targetElement: RathenaElement;
    targetElementLevel: number;
}

export function calculateElementalAttackComponents(
    components: AttackComponents,
    attackElement: RathenaElement,
    targetElement: RathenaElement,
    targetElementLevel: number,
    attributeTable: ParsedAttributeTable,
): ElementComponentCalculationResult {
    const ratio = attributeTable.getRatio(
        targetElementLevel,
        attackElement,
        targetElement,
    );

    const applyRatio = (damage: number): number =>
        damage -
        Math.trunc(
            damage * (100 - ratio) / 100,
        );

    const output: AttackComponents = {
        statusAtk: applyRatio(components.statusAtk),
        weaponAtk: applyRatio(components.weaponAtk),
        equipAtk: applyRatio(components.equipAtk),
        masteryAtk: components.masteryAtk,
        patk: components.patk,
    };

    return {
        input: components,
        output,
        ratio,
        attackElement,
        targetElement,
        targetElementLevel,
    };
}