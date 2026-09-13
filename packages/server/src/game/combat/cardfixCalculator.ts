import type {
    AttackFlags,
    CombatClassification,
} from "./combatTypes";

export interface CardfixConditionalModifier {
    value: number;
    attackType?: "weapon" | "magic" | "misc";
    rangeType?: "short" | "long";
}

export interface AttackerCardfixModifiers {
    addRace?: Record<string, number>;
    addElement?: Record<string, number>;
    addSize?: Record<string, number>;
    addRace2?: Record<string, number>;
    addClass?: Record<string, number>;
    conditional?: CardfixConditionalModifier[];
}

export interface DefenderCardfixModifiers {
    subElement?: Record<string, number>;
    subDefElement?: Record<string, number>;
    subSize?: Record<string, number>;
    weaponSubSize?: Record<string, number>;
    subRace2?: Record<string, number>;
    subRace?: Record<string, number>;
    subClass?: Record<string, number>;
    defenseAgainstAttackerClass?: Record<string, number>;
    conditional?: CardfixConditionalModifier[];
}

export interface AttackerCardfixInput {
    weaponAtk: number;
    equipAtk: number;
    classification: CombatClassification;
    flags: AttackFlags;
    modifiers: AttackerCardfixModifiers;
}

export interface AttackerCardfixResult {
    weaponAtk: number;
    equipAtk: number;
}

export interface DefenderCardfixInput {
    damage: number;
    classification: CombatClassification;
    flags: AttackFlags;
    modifiers: DefenderCardfixModifiers;
}

export interface DefenderCardfixResult {
    damage: number;
}

function applyRenewalCardfix(
    damage: number,
    fix: number,
): number {
    const effectiveFix =
        Math.max(0, 100 + fix);

    return damage - Math.trunc(
        damage *
        (100 - effectiveFix) /
        100,
    );
}

function applyModifier(
    damage: number,
    modifier: number | undefined,
): number {
    return modifier === undefined
        ? damage
        : applyRenewalCardfix(damage, modifier);
}

function applyRace2Modifiers(
    damage: number,
    race2: readonly string[],
    modifiers: Record<string, number> | undefined,
): number {
    if (!modifiers) {
        return damage;
    }

    const totalModifier =
        race2.reduce(
            (total, race) =>
                total +
                (modifiers[race] ?? 0),
            0,
        );

    return applyModifier(
        damage,
        totalModifier,
    );
}

function applyConditionalModifiers(
    damage: number,
    classification: CombatClassification,
    modifiers: CardfixConditionalModifier[] | undefined,
): number {
    if (!modifiers) {
        return damage;
    }

    let result = damage;

    for (const modifier of modifiers) {
        if (
            modifier.attackType !== undefined &&
            modifier.attackType !== classification.attack.type
        ) {
            continue;
        }

        if (
            modifier.rangeType !== undefined &&
            modifier.rangeType !== classification.attack.rangeType
        ) {
            continue;
        }

        result = applyRenewalCardfix(
            result,
            modifier.value,
        );
    }

    return result;
}

export function calculateAttackerCardfix(
    input: AttackerCardfixInput,
): AttackerCardfixResult {
    if (input.flags.ignoreAttackerCardfix) {
        return {
            weaponAtk: input.weaponAtk,
            equipAtk: input.equipAtk,
        };
    }

    const apply = (
        damage: number,
    ): number => {
        const target = input.classification.target;

        damage = applyModifier(
            damage,
            input.modifiers.addRace?.[target.race ?? ""],
        );

        if (!input.flags.ignoreElementCardfix) {
            damage = applyModifier(
                damage,
                input.modifiers.addElement?.[
                    target.element ?? ""
                ],
            );
        }

        damage = applyModifier(
            damage,
            input.modifiers.addSize?.[target.size ?? ""],
        );

        damage = applyRace2Modifiers(
            damage,
            target.race2,
            input.modifiers.addRace2,
        );

        damage = applyModifier(
            damage,
            input.modifiers.addClass?.[
                target.class ?? ""
            ],
        );

        return applyConditionalModifiers(
            damage,
            input.classification,
            input.modifiers.conditional,
        );
    };

    return {
        weaponAtk: apply(input.weaponAtk),
        equipAtk: apply(input.equipAtk),
    };
}

export function calculateDefenderCardfix(
    input: DefenderCardfixInput,
): DefenderCardfixResult {
    if (input.flags.ignoreDefenderCardfix) {
        return {
            damage: input.damage,
        };
    }

    const attacker = input.classification.attacker;
    const target = input.classification.target;
    let damage = input.damage;

    if (!input.flags.ignoreElementCardfix) {
        damage = applyModifier(
            damage,
            input.modifiers.subElement?.[
                input.classification.attack.element
            ],
        );

        damage = applyModifier(
            damage,
            input.modifiers.subDefElement?.[
                attacker.element ?? ""
            ],
        );
    }

    damage = applyModifier(
        damage,
        input.modifiers.subSize?.[
            target.size ?? ""
        ],
    );

    damage = applyModifier(
        damage,
        input.modifiers.weaponSubSize?.[
            target.size ?? ""
        ],
    );

    damage = applyRace2Modifiers(
        damage,
        attacker.race2,
        input.modifiers.subRace2,
    );

    damage = applyModifier(
        damage,
        input.modifiers.subRace?.[
            attacker.race ?? ""
        ],
    );

    damage = applyModifier(
        damage,
        input.modifiers.subClass?.[
            attacker.class ?? ""
        ],
    );

    damage = applyModifier(
        damage,
        input.modifiers.defenseAgainstAttackerClass?.[
            attacker.class ?? ""
        ],
    );

    return {
        damage: applyConditionalModifiers(
            damage,
            input.classification,
            input.modifiers.conditional,
        ),
    };
}
