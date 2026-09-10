export interface PostDefenseResult {
    damage: number;
}

export function calculatePostDefenseDamage(
    damage: number,
): PostDefenseResult {
    return {
        damage: Math.max(1, damage),
    };
}