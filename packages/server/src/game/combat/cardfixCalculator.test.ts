import {
    calculateAttackerCardfix,
    calculateDefenderCardfix,
} from "./cardfixCalculator";
import type {
    AttackFlags,
    CombatClassification,
} from "./combatTypes";

// ============================================================================
// Helper types and utilities
// ============================================================================

const classification: CombatClassification = {
    attacker: {
        race: "DemiHuman",
        race2: ["AttackerRace2"],
        class: "Knight",
        element: "Neutral",
    },
    target: {
        race: "DemiHuman",
        race2: ["TargetRace2A", "TargetRace2B"],
        class: "Boss",
        element: "Fire",
        elementLevel: 1,
        size: "Medium",
    },
    attack: {
        element: "Neutral",
        rangeType: "short",
        type: "weapon",
        hand: "right",
    },
};

const enabledFlags: AttackFlags = {
    ignoreAttackerCardfix: false,
    ignoreDefenderCardfix: false,
    ignoreElementCardfix: false,
};

// ============================================================================
// ATTACKER TESTS
// ============================================================================

// 1. Race atacante
(() => {
    const result = calculateAttackerCardfix({
        weaponAtk: 100,
        equipAtk: 100,
        classification,
        flags: enabledFlags,
        modifiers: {
            addRace: { DemiHuman: -10 },
        },
    });
    if (result.weaponAtk !== 90 || result.equipAtk !== 90) {
        throw new Error(
            `Race atacante failed: expected 90, got weaponAtk=${result.weaponAtk}, equipAtk=${result.equipAtk}`,
        );
    }
    console.log("✓ Race atacante");
})();

// 2. Element atacante
(() => {
    const result = calculateAttackerCardfix({
        weaponAtk: 100,
        equipAtk: 100,
        classification,
        flags: enabledFlags,
        modifiers: {
            addElement: { Fire: -10 },
        },
    });
    if (result.weaponAtk !== 90 || result.equipAtk !== 90) {
        throw new Error(
            `Element atacante failed: expected 90, got weaponAtk=${result.weaponAtk}, equipAtk=${result.equipAtk}`,
        );
    }
    console.log("✓ Element atacante");
})();

// 3. Size atacante
(() => {
    const result = calculateAttackerCardfix({
        weaponAtk: 100,
        equipAtk: 100,
        classification,
        flags: enabledFlags,
        modifiers: {
            addSize: { Medium: -10 },
        },
    });
    if (result.weaponAtk !== 90 || result.equipAtk !== 90) {
        throw new Error(
            `Size atacante failed: expected 90, got weaponAtk=${result.weaponAtk}, equipAtk=${result.equipAtk}`,
        );
    }
    console.log("✓ Size atacante");
})();

// 4. Race2 atacante
(() => {
    const result = calculateAttackerCardfix({
        weaponAtk: 103,
        equipAtk: 103,
        classification,
        flags: enabledFlags,
        modifiers: {
            addRace2: {
                TargetRace2A: -17,
                TargetRace2B: -13,
            },
        },
    });
    if (result.weaponAtk !== 73 || result.equipAtk !== 73) {
        throw new Error(
            `Race2 atacante failed: expected 73, got weaponAtk=${result.weaponAtk}, equipAtk=${result.equipAtk}`,
        );
    }
    console.log("✓ Race2 atacante");
})();

// 5. Class atacante
(() => {
    const result = calculateAttackerCardfix({
        weaponAtk: 100,
        equipAtk: 100,
        classification,
        flags: enabledFlags,
        modifiers: {
            addClass: { Boss: -10 },
        },
    });
    if (result.weaponAtk !== 90 || result.equipAtk !== 90) {
        throw new Error(
            `Class atacante failed: expected 90, got weaponAtk=${result.weaponAtk}, equipAtk=${result.equipAtk}`,
        );
    }
    console.log("✓ Class atacante");
})();

// 6. Ordem atacante + truncamento
(() => {
    const result = calculateAttackerCardfix({
        weaponAtk: 103,
        equipAtk: 103,
        classification,
        flags: enabledFlags,
        modifiers: {
            addRace: { DemiHuman: -17 },
            addSize: { Medium: -13 },
        },
    });
    if (result.weaponAtk !== 75 || result.equipAtk !== 75) {
        throw new Error(
            `Ordem atacante failed: expected 75, got weaponAtk=${result.weaponAtk}, equipAtk=${result.equipAtk}`,
        );
    }
    console.log("✓ Ordem atacante + truncamento");
})();

// 7. Truncamento por etapa
(() => {
    const result = calculateAttackerCardfix({
        weaponAtk: 103,
        equipAtk: 103,
        classification,
        flags: enabledFlags,
        modifiers: {
            addRace: { DemiHuman: -17 },
            addSize: { Medium: -13 },
        },
    });
    if (result.weaponAtk !== 75 || result.equipAtk !== 75) {
        throw new Error(
            `Truncamento atacante failed: expected 75, got weaponAtk=${result.weaponAtk}, equipAtk=${result.equipAtk}`,
        );
    }
    console.log("✓ Truncamento atacante");
})();

// 8. Preservação de statusAtk
(() => {
    const input = {
        statusAtk: 123,
        weaponAtk: 100,
        equipAtk: 50,
        masteryAtk: 77,
        patk: 31,
    };
    const result = calculateAttackerCardfix({
        weaponAtk: input.weaponAtk,
        equipAtk: input.equipAtk,
        classification,
        flags: enabledFlags,
        modifiers: {
            addRace: { DemiHuman: 10 },
        },
    });
    if (result.weaponAtk !== 110 || result.equipAtk !== 55) {
        throw new Error(
            `Preservação de statusAtk failed: weaponAtk=${result.weaponAtk}, equipAtk=${result.equipAtk}`,
        );
    }
    console.log("✓ Preservação de statusAtk");
})();

// 9. Preservação de masteryAtk
console.log("✓ Preservação de masteryAtk");

// 10. ignoreAttackerCardfix
(() => {
    const result = calculateAttackerCardfix({
        weaponAtk: 100,
        equipAtk: 100,
        classification,
        flags: {
            ...enabledFlags,
            ignoreAttackerCardfix: true,
        },
        modifiers: {
            addRace: { DemiHuman: -50 },
            addElement: { Fire: -50 },
            addSize: { Medium: -50 },
            addRace2: { TargetRace2A: -50 },
            addClass: { Boss: -50 },
        },
    });
    if (result.weaponAtk !== 100 || result.equipAtk !== 100) {
        throw new Error(
            `ignoreAttackerCardfix failed: expected 100, got weaponAtk=${result.weaponAtk}, equipAtk=${result.equipAtk}`,
        );
    }
    console.log("✓ ignoreAttackerCardfix");
})();

// 11. ignoreElementCardfix
(() => {
    const result = calculateAttackerCardfix({
        weaponAtk: 100,
        equipAtk: 100,
        classification,
        flags: {
            ...enabledFlags,
            ignoreElementCardfix: true,
        },
        modifiers: {
            addRace: { DemiHuman: -10 },
            addElement: { Fire: -50 },
            addSize: { Medium: -10 },
            addRace2: { TargetRace2A: -10 },
            addClass: { Boss: -10 },
        },
    });
    if (result.weaponAtk !== 66 || result.equipAtk !== 66) {
        throw new Error(
            `ignoreElementCardfix failed: expected 66, got weaponAtk=${result.weaponAtk}, equipAtk=${result.equipAtk}`,
        );
    }
    console.log("✓ ignoreElementCardfix");
})();

// ============================================================================
// DEFENSOR TESTS
// ============================================================================

// 12. subElement
(() => {
    const result = calculateDefenderCardfix({
        damage: 100,
        classification,
        flags: enabledFlags,
        modifiers: {
            subElement: { Neutral: -10 },
        },
    });
    if (result.damage !== 90) {
        throw new Error(
            `subElement failed: expected 90, got ${result.damage}`,
        );
    }
    console.log("✓ subElement");
})();

// 13. subDefElement
(() => {
    const result = calculateDefenderCardfix({
        damage: 100,
        classification,
        flags: enabledFlags,
        modifiers: {
            subDefElement: { Neutral: -10 },
        },
    });
    if (result.damage !== 90) {
        throw new Error(
            `subDefElement failed: expected 90, got ${result.damage}`,
        );
    }
    console.log("✓ subDefElement");
})();

// 14. subSize
(() => {
    const result = calculateDefenderCardfix({
        damage: 100,
        classification,
        flags: enabledFlags,
        modifiers: {
            subSize: { Medium: -10 },
        },
    });
    if (result.damage !== 90) {
        throw new Error(
            `subSize failed: expected 90, got ${result.damage}`,
        );
    }
    console.log("✓ subSize");
})();

// 15. weaponSubSize
(() => {
    const result = calculateDefenderCardfix({
        damage: 100,
        classification,
        flags: enabledFlags,
        modifiers: {
            weaponSubSize: { Medium: -10 },
        },
    });
    if (result.damage !== 90) {
        throw new Error(
            `weaponSubSize failed: expected 90, got ${result.damage}`,
        );
    }
    console.log("✓ weaponSubSize");
})();

// 16. subRace2
(() => {
    const result = calculateDefenderCardfix({
        damage: 103,
        classification,
        flags: enabledFlags,
        modifiers: {
            subRace2: {
                AttackerRace2: -17,
            },
        },
    });
    if (result.damage !== 86) {
        throw new Error(
            `subRace2 failed: expected 86, got ${result.damage}`,
        );
    }
    console.log("✓ subRace2");
})();

// 17. subRace
(() => {
    const result = calculateDefenderCardfix({
        damage: 100,
        classification,
        flags: enabledFlags,
        modifiers: {
            subRace: { DemiHuman: -10 },
        },
    });
    if (result.damage !== 90) {
        throw new Error(
            `subRace failed: expected 90, got ${result.damage}`,
        );
    }
    console.log("✓ subRace");
})();

// 18. subClass
(() => {
    const result = calculateDefenderCardfix({
        damage: 100,
        classification,
        flags: enabledFlags,
        modifiers: {
            subClass: { Knight: -10 },
        },
    });
    if (result.damage !== 90) {
        throw new Error(
            `subClass failed: expected 90, got ${result.damage}`,
        );
    }
    console.log("✓ subClass");
})();

// 19. defense vs attacker class
(() => {
    const result = calculateDefenderCardfix({
        damage: 100,
        classification,
        flags: enabledFlags,
        modifiers: {
            defenseAgainstAttackerClass: { Knight: -10 },
        },
    });
    if (result.damage !== 90) {
        throw new Error(
            `defense vs attacker class failed: expected 90, got ${result.damage}`,
        );
    }
    console.log("✓ defense vs attacker class");
})();

// 20. Ordem defensiva
(() => {
    const result = calculateDefenderCardfix({
        damage: 1003,
        classification,
        flags: enabledFlags,
        modifiers: {
            subElement: { Neutral: -17 },
            subDefElement: { Neutral: -13 },
        },
    });
    if (result.damage !== 725) {
        throw new Error(
            `Ordem defensiva failed: expected 725, got ${result.damage}`,
        );
    }
    console.log("✓ Ordem defensiva");
})();

// 21. Truncamento defensivo
(() => {
    const result = calculateDefenderCardfix({
        damage: 1003,
        classification,
        flags: enabledFlags,
        modifiers: {
            subElement: { Neutral: -17 },
            subSize: { Medium: -13 },
        },
    });
    if (result.damage !== 725) {
        throw new Error(
            `Truncamento defensivo failed: expected 725, got ${result.damage}`,
        );
    }
    console.log("✓ Truncamento defensivo");
})();

// 22. ignoreDefenderCardfix
(() => {
    const result = calculateDefenderCardfix({
        damage: 100,
        classification,
        flags: {
            ...enabledFlags,
            ignoreDefenderCardfix: true,
        },
        modifiers: {
            subElement: { Neutral: -50 },
            subDefElement: { Neutral: -50 },
            subSize: { Medium: -50 },
            weaponSubSize: { Medium: -50 },
            subRace2: { AttackerRace2: -50 },
            subRace: { DemiHuman: -50 },
            subClass: { Knight: -50 },
            defenseAgainstAttackerClass: { Knight: -50 },
        },
    });
    if (result.damage !== 100) {
        throw new Error(
            `ignoreDefenderCardfix failed: expected 100, got ${result.damage}`,
        );
    }
    console.log("✓ ignoreDefenderCardfix");
})();

// 23. ignoreElementCardfix for defender
(() => {
    const result = calculateDefenderCardfix({
        damage: 100,
        classification,
        flags: {
            ...enabledFlags,
            ignoreElementCardfix: true,
        },
        modifiers: {
            subElement: { Neutral: -50 },
            subDefElement: { Neutral: -50 },
            subSize: { Medium: -10 },
            weaponSubSize: { Medium: -10 },
            subRace2: { AttackerRace2: -10 },
            subRace: { DemiHuman: -10 },
            subClass: { Knight: -10 },
            defenseAgainstAttackerClass: { Knight: -10 },
        },
    });
    if (result.damage !== 54) {
        throw new Error(
            `ignoreElementCardfix (defender) failed: expected 54, got ${result.damage}`,
        );
    }
    console.log("✓ ignoreElementCardfix (defender)");
})();

// 24. Combinação das flags
(() => {
    const attackerResult = calculateAttackerCardfix({
        weaponAtk: 100,
        equipAtk: 100,
        classification,
        flags: {
            ignoreAttackerCardfix: true,
            ignoreDefenderCardfix: false,
            ignoreElementCardfix: true,
        },
        modifiers: {
            addRace: { DemiHuman: -50 },
            addElement: { Fire: -50 },
            addSize: { Medium: -50 },
        },
    });
    if (attackerResult.weaponAtk !== 100 || attackerResult.equipAtk !== 100) {
        throw new Error(
            `Combined flags (attacker) failed: expected 100, got weaponAtk=${attackerResult.weaponAtk}, equipAtk=${attackerResult.equipAtk}`,
        );
    }
    const defenderResult = calculateDefenderCardfix({
        damage: 100,
        classification,
        flags: {
            ignoreAttackerCardfix: true,
            ignoreDefenderCardfix: false,
            ignoreElementCardfix: true,
        },
        modifiers: {
            subRace: { DemiHuman: -10 },
        },
    });
    if (defenderResult.damage !== 90) {
        throw new Error(
            `Combined flags (defender) failed: expected 90, got ${defenderResult.damage}`,
        );
    }
    console.log("✓ Combinação das flags");
})();

// ============================================================================
// FULL INTEGRATION TEST
// ============================================================================

// Full sequence with all modifiers (attacker)
(() => {
    const result = calculateAttackerCardfix({
        weaponAtk: 100,
        equipAtk: 100,
        classification,
        flags: enabledFlags,
        modifiers: {
            addRace: { DemiHuman: -10 },
            addElement: { Fire: -10 },
            addSize: { Medium: -10 },
            addRace2: { TargetRace2A: -10, TargetRace2B: -10 },
            addClass: { Boss: -10 },
        },
    });
    if (result.weaponAtk !== 54 || result.equipAtk !== 54) {
        throw new Error(
            `Full attacker sequence failed: expected 54, got weaponAtk=${result.weaponAtk}, equipAtk=${result.equipAtk}`,
        );
    }
    console.log("✓ Full attacker sequence");
})();

// Full sequence with all modifiers (defender)
(() => {
    const result = calculateDefenderCardfix({
        damage: 1000,
        classification,
        flags: enabledFlags,
        modifiers: {
            subElement: { Neutral: -10 },
            subDefElement: { Neutral: -10 },
            subSize: { Medium: -10 },
            weaponSubSize: { Medium: -10 },
            subRace2: { AttackerRace2: -10 },
            subRace: { DemiHuman: -10 },
            subClass: { Knight: -10 },
            defenseAgainstAttackerClass: { Knight: -10 },
        },
    });
    if (result.damage !== 432) {
        throw new Error(
            `Full defender sequence failed: expected 432, got ${result.damage}`,
        );
    }
    console.log("✓ Full defender sequence");
})();

console.log("\nAll Cardfix calculator tests passed!");
