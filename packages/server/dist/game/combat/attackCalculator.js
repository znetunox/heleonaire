export function calculateAttackComposition(components, patk, atkRate, skillRatio, skillConstant) {
    /*
     * Renewal:
     *
     * percentAtk =
     *     (weaponAtk + equipAtk) * atk_rate / 100
     *
     * The percentage ATK does NOT include statusAtk.
     */
    const percentAtk = Math.floor((components.weaponAtk +
        components.equipAtk) *
        atkRate /
        100);
    const baseDamage = components.statusAtk +
        components.weaponAtk +
        components.equipAtk +
        percentAtk;
    const postPatkDamage = Math.floor(baseDamage *
        (100 + patk) /
        100);
    const masteryDamage = postPatkDamage +
        components.masteryAtk;
    const skillDamage = Math.floor(masteryDamage *
        skillRatio /
        100) +
        skillConstant;
    const prePatkDamage = baseDamage;
    const finalDamage = skillDamage;
    return {
        baseDamage,
        prePatkDamage,
        postPatkDamage,
        masteryDamage,
        skillDamage,
        finalDamage,
    };
}
