export function calculateElementDamage(damage, attackElement, targetElement, targetElementLevel, attributeTable) {
    const ratio = attributeTable.getRatio(targetElementLevel, attackElement, targetElement);
    const outputDamage = damage -
        Math.trunc(damage * (100 - ratio) / 100);
    return {
        inputDamage: damage,
        ratio,
        outputDamage,
        attackElement,
        targetElement,
        targetElementLevel,
    };
}
