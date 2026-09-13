import type { RathenaElement } from "../../data/rathena/parsers/attrFixParser";
import type { ParsedAttributeTable } from "../../data/rathena/parsers/attrFixParser";
import type { AttackComponents } from "./combatTypes";

/**
 * Element context metadata.
 *
 * This provides the necessary information for elemental damage calculation
 * WITHOUT modifying the attack components.
 *
 * The actual elemental damage application happens later in the pipeline
 * via calculateElementalDamage(), after RES/DEF/Post-DEF.
 */
export interface ElementContext {
    /**
     * The effective attack element (after status overrides).
     */
    attackElement: RathenaElement;

    /**
     * The status element used for statusAtk calculation.
     */
    statusElement: RathenaElement;

    /**
     * The target's element.
     */
    targetElement: RathenaElement;

    /**
     * The target's element level (1-4).
     */
    targetElementLevel: number;

    /**
     * Element ratio for statusAtk (from attribute table).
     * Used for informational purposes / telemetry.
     */
    statusRatio: number;

    /**
     * Element ratio for weaponAtk/equipAtk (from attribute table).
     * Used for informational purposes / telemetry.
     */
    weaponRatio: number;

    /**
     * The attribute table reference for later use in calculateElementalDamage.
     */
    attributeTable: ParsedAttributeTable;
}

/**
 * Legacy result type for backwards compatibility with existing tests.
 *
 * This preserves the input components unchanged and provides element context
 * instead of transforming the components.
 */
export interface ElementComponentCalculationResult {
    /**
     * The original input components, UNMODIFIED.
     */
    input: AttackComponents;

    /**
     * The output is now the same as input - components are NOT modified.
     * This field is kept for backwards compatibility but should not be used
     * for actual damage calculation.
     */
    output: AttackComponents;

    /**
     * Element context for later use in calculateElementalDamage.
     */
    context: ElementContext;

    /**
     * @deprecated Use context.weaponRatio instead.
     */
    weaponRatio: number;

    /**
     * @deprecated Use context.statusRatio instead.
     */
    statusRatio: number;

    /**
     * @deprecated Use context.attackElement instead.
     */
    attackElement: RathenaElement;

    /**
     * @deprecated Use context.statusElement instead.
     */
    statusElement: RathenaElement;

    /**
     * @deprecated Use context.targetElement instead.
     */
    targetElement: RathenaElement;

    /**
     * @deprecated Use context.targetElementLevel instead.
     */
    targetElementLevel: number;
}

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
export function getElementContext(
    attackElement: RathenaElement,
    targetElement: RathenaElement,
    targetElementLevel: number,
    attributeTable: ParsedAttributeTable,
    statusElement: RathenaElement = "Neutral",
): ElementContext {
    const statusRatio = attributeTable.getRatio(
        targetElementLevel,
        statusElement,
        targetElement,
    );

    const weaponRatio = attributeTable.getRatio(
        targetElementLevel,
        attackElement,
        targetElement,
    );

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
export function calculateElementalAttackComponents(
    components: AttackComponents,
    batk: number,
    attackElement: RathenaElement,
    targetElement: RathenaElement,
    targetElementLevel: number,
    attributeTable: ParsedAttributeTable,
    statusElement: RathenaElement = "Neutral",
): ElementComponentCalculationResult {
    // Components are NOT modified - this is the key change
    const input = components;
    const output = { ...components };

    const context = getElementContext(
        attackElement,
        targetElement,
        targetElementLevel,
        attributeTable,
        statusElement,
    );

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
