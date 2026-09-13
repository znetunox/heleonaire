export function resolveDefPiercing(targetRace, targetElement, targetClass, byRace, byElement, byClass) {
    return (byRace[targetRace] === true ||
        byRace.All === true ||
        byElement[targetElement] === true ||
        byElement.All === true ||
        byClass[targetClass] === true ||
        byClass.All === true);
}
export function calculateDefenseReduction(damage, target, options) {
    let def1 = Math.trunc(target.def1);
    let def2 = Math.trunc(target.def2);
    const ignoreDefRate = Math.min(100, Math.max(0, (options.ignoreDefRate ?? 0) +
        (options.ignoreDefByRace?.[options.targetRace ?? ""] ?? 0) +
        (options.ignoreDefByRace?.All ?? 0) +
        (options.ignoreDefByClass?.[options.targetClass ?? ""] ?? 0) +
        (options.ignoreDefByClass?.All ?? 0)));
    if (ignoreDefRate > 0) {
        def1 -= Math.trunc(def1 *
            ignoreDefRate /
            100);
        def2 -= Math.trunc(def2 *
            ignoreDefRate /
            100);
    }
    if (def1 === -400) {
        def1 = -399;
    }
    const weaponDefenseType = Math.max(0, options.weaponDefenseType ?? 0);
    if (weaponDefenseType > 0) {
        def2 += Math.trunc(def1 * weaponDefenseType);
        def1 = 0;
    }
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
    if (options.ignoreDef) {
        effectiveDef = damage;
    }
    else if (options.simpleDefense) {
        effectiveDef =
            damage -
                def1 -
                def2;
    }
    else if (options.isDefPiercing) {
        effectiveDef +=
            Math.trunc(def1 *
                options.skillRatio /
                200);
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
