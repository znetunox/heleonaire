export interface PostDefenseResult {
    damage: number;
}

export function calculatePostDefenseDamage(
    damage: number,
): PostDefenseResult {
    const truncatedDamage =
        Math.trunc(damage);

    return {
        damage:
            Math.max(
                1,
                truncatedDamage,
            ),
    };
}