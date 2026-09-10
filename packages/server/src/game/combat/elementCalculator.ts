import type {
    ParsedAttributeTable,
    RathenaElement,
} from "../../data/rathena/parsers/attrFixParser";

export interface ElementCalculationResult {
    inputDamage: number;
    ratio: number;
    outputDamage: number;
    attackElement: RathenaElement;
    targetElement: RathenaElement;
    targetElementLevel: number;
}

export function calculateElementDamage(
    damage: number,
    attackElement: RathenaElement,
    targetElement: RathenaElement,
    targetElementLevel: number,
    attributeTable: ParsedAttributeTable,
): ElementCalculationResult {
    const ratio =
        attributeTable.getRatio(
            targetElementLevel,
            attackElement,
            targetElement,
        );

    const outputDamage =
        damage -
        Math.trunc(
            damage * (100 - ratio) / 100,
        );

    return {
        inputDamage: damage,
        ratio,
        outputDamage,
        attackElement,
        targetElement,
        targetElementLevel,
    };
}