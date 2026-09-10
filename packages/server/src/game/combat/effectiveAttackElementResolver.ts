import type { RathenaElement } from "../../data/rathena/parsers/attrFixParser";

export interface AttackElementStatus {
    enchantArms?: RathenaElement | null;

    waterWeapon?: boolean;
    waterInsignia?: boolean;

    earthWeapon?: boolean;
    earthInsignia?: boolean;

    fireWeapon?: boolean;
    fireInsignia?: boolean;

    windWeapon?: boolean;
    windInsignia?: boolean;

    enchantPoison?: boolean;
    aspersio?: boolean;
    shadowWeapon?: boolean;
    ghostWeapon?: boolean;
    invisibility?: boolean;

    tidalWeaponOption?: boolean;
    tidalWeapon?: boolean;
}

/**
 * Reproduces the priority of rAthena's
 * status_calc_attack_element().
 *
 * The function returns the first applicable override.
 * If no elemental status is active, the original
 * weapon element is preserved.
 */
export function resolveEffectiveAttackElement(
    baseElement: RathenaElement,
    status: AttackElementStatus,
): RathenaElement {
    if (status.enchantArms) {
        return status.enchantArms;
    }

    if (
        status.waterWeapon ||
        status.waterInsignia
    ) {
        return "Water";
    }

    if (
        status.earthWeapon ||
        status.earthInsignia
    ) {
        return "Earth";
    }

    if (
        status.fireWeapon ||
        status.fireInsignia
    ) {
        return "Fire";
    }

    if (
        status.windWeapon ||
        status.windInsignia
    ) {
        return "Wind";
    }

    if (status.enchantPoison) {
        return "Poison";
    }

    if (status.aspersio) {
        return "Holy";
    }

    if (status.shadowWeapon) {
        return "Dark";
    }

    if (
        status.ghostWeapon ||
        status.invisibility
    ) {
        return "Ghost";
    }

    if (
        status.tidalWeaponOption ||
        status.tidalWeapon
    ) {
        return "Water";
    }

    return baseElement;
}