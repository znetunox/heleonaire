export function calculatePostDefenseDamage(damage) {
    const truncatedDamage = Math.trunc(damage);
    return {
        damage: Math.max(1, truncatedDamage),
    };
}
