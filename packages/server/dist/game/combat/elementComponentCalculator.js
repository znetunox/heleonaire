/**
 * Creates element context from attack parameters.
 *
 * This function NO LONGER modifies attack components.
 * It only extracts and returns the element metadata needed for
 * the later elemental damage application.
 *
 * The rAthena Renewal applies elemental damage AFTER DEF/RES/Post-DEF
 * via battle_calc_element_damage(), not before composition.
 *
 * @param attackElement - The attack's effective element
 * @param targetElement - The target's element
 * @param targetElementLevel - The target's element level (1-4)
 * @param attributeTable - The attribute table for ratio lookup
 * @param statusElement - The status element for statusAtk (defaults to "Neutral")
 * @returns ElementContext with all metadata for later elemental application
 */
export function getElementContext(attackElement, targetElement, targetElementLevel, attributeTable, statusElement = "Neutral") {
    const statusRatio = attributeTable.getRatio(targetElementLevel, statusElement, targetElement);
    const weaponRatio = attributeTable.getRatio(targetElementLevel, attackElement, targetElement);
    return {
        attackElement,
        statusElement,
        targetElement,
        targetElementLevel,
        statusRatio,
        weaponRatio,
        attributeTable,
    };
}
/**
 * Legacy wrapper for backwards compatibility.
 *
 * This function now preserves the input components unchanged and returns
 * an ElementContext for later use in calculateElementalDamage.
 *
 * @deprecated Use getElementContext() directly for new code.
 * This wrapper is maintained for backwards compatibility with existing code
 * that expects the old return type.
 */
export function calculateElementalAttackComponents(components, batk, attackElement, targetElement, targetElementLevel, attributeTable, statusElement = "Neutral") {
    // Components are NOT modified - this is the key change
    const input = components;
    const output = { ...components };
    const context = getElementContext(attackElement, targetElement, targetElementLevel, attributeTable, statusElement);
    return {
        input,
        output,
        context,
        // Legacy fields for backwards compatibility
        weaponRatio: context.weaponRatio,
        statusRatio: context.statusRatio,
        attackElement: context.attackElement,
        statusElement: context.statusElement,
        targetElement: context.targetElement,
        targetElementLevel: context.targetElementLevel,
    };
}
