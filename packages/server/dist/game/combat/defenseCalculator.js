export function calculateDefenseReduction(damage, target, options) {
    let def1 = Math.trunc(target.def1);
    if (def1 === -400) {
        def1 = -399;
    }
    const def2 = Math.trunc(target.def2);
    /*
     * Renewal physical DEF calculation.
     *
     * DEF piercing adds the piercing term before the
     * normal DEF reduction.
     *
     * Ignore DEF skips the normal DEF1 reduction.
     *
     * RES and post-defense modifiers are intentionally
     * handled outside this function.
     */
    let effectiveDef = damage;
    if (options.isDefPiercing) {
        effectiveDef +=
            def1 *
                options.skillRatio /
                200;
    }
    else if (!options.ignoreDef) {
        effectiveDef = Math.trunc(effectiveDef *
            (4000 + def1) /
            (4000 + 10 * def1) -
            def2);
    }
    return {
        def1,
        def2,
        effectiveDef,
    };
}
