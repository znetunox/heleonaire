import {
    calculateAttackerCardfix,
    calculateDefenderCardfix,
} from "./cardfixCalculator";
import type {
    AttackFlags,
    CombatClassification,
} from "./combatTypes";

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

const attackerModifiers = {
    addRace: { DemiHuman: -10 },
    addElement: { Fire: -10 },
    addSize: { Medium: -10 },
    addRace2: {
        TargetRace2A: -17,
        TargetRace2B: -13,
    },
    addClass: { Boss: -10 },
};

const orderedAttacker = calculateAttackerCardfix({
    weaponAtk: 101,
    equipAtk: 50,
    classification,
    flags: enabledFlags,
    modifiers: {
        addRace: { DemiHuman: -10 },
        addElement: { Fire: -10 },
        addSize: { Medium: -10 },
    },
});

if (
    orderedAttacker.weaponAtk !== 74 ||
    orderedAttacker.equipAtk !== 37
) {
    throw new Error(
        `Attacker order/truncation failed: ${JSON.stringify(orderedAttacker)}`,
    );
}

const race2Attacker = calculateAttackerCardfix({
    weaponAtk: 103,
    equipAtk: 103,
    classification,
    flags: enabledFlags,
    modifiers: {
        addRace2: attackerModifiers.addRace2,
    },
});

if (
    race2Attacker.weaponAtk !== 73 ||
    race2Attacker.equipAtk !== 73
) {
    throw new Error(
        `Attacker Race2 aggregation failed: ${JSON.stringify(race2Attacker)}`,
    );
}

const preserved = {
    statusAtk: 123,
    weaponAtk: 100,
    equipAtk: 50,
    masteryAtk: 77,
    patk: 31,
};

const preservedResult = calculateAttackerCardfix({
    weaponAtk: preserved.weaponAtk,
    equipAtk: preserved.equipAtk,
    classification,
    flags: enabledFlags,
    modifiers: {
        addRace: { DemiHuman: 10 },
    },
});

if (
    preserved.statusAtk !== 123 ||
    preserved.masteryAtk !== 77 ||
    preserved.patk !== 31 ||
    preservedResult.weaponAtk !== 110 ||
    preservedResult.equipAtk !== 55
) {
    throw new Error("Attacker component preservation failed");
}

const ignoredAttacker = calculateAttackerCardfix({
    weaponAtk: 100,
    equipAtk: 100,
    classification,
    flags: {
        ...enabledFlags,
        ignoreAttackerCardfix: true,
    },
    modifiers: attackerModifiers,
});

if (
    ignoredAttacker.weaponAtk !== 100 ||
    ignoredAttacker.equipAtk !== 100
) {
    throw new Error("ignoreAttackerCardfix was not isolated");
}

const ignoredElement = calculateAttackerCardfix({
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
    },
});

if (
    ignoredElement.weaponAtk !== 81 ||
    ignoredElement.equipAtk !== 81
) {
    throw new Error(
        `ignoreElementCardfix was not isolated: ${JSON.stringify(ignoredElement)}`,
    );
}

const orderedDefender = calculateDefenderCardfix({
    damage: 1003,
    classification,
    flags: enabledFlags,
    modifiers: {
        subElement: { Neutral: -17 },
        subDefElement: { Neutral: -13 },
        subSize: { Medium: -11 },
        weaponSubSize: { Medium: -7 },
        subRace2: { AttackerRace2: -10 },
        subRace: { DemiHuman: -5 },
        subClass: { Knight: -3 },
        defenseAgainstAttackerClass: { Knight: -2 },
    },
});

if (orderedDefender.damage !== 490) {
    throw new Error(
        `Defender order/truncation failed: ${JSON.stringify(orderedDefender)}`,
    );
}

const ignoredDefender = calculateDefenderCardfix({
    damage: 100,
    classification,
    flags: {
        ...enabledFlags,
        ignoreDefenderCardfix: true,
    },
    modifiers: {
        subRace: { DemiHuman: -50 },
    },
});

if (ignoredDefender.damage !== 100) {
    throw new Error("ignoreDefenderCardfix was not isolated");
}

const ignoredDefenderElement = calculateDefenderCardfix({
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
        subRace: { DemiHuman: -10 },
    },
});

if (ignoredDefenderElement.damage !== 81) {
    throw new Error(
        `Defender ignoreElementCardfix was not isolated: ${JSON.stringify(ignoredDefenderElement)}`,
    );
}

const combinedFlags = calculateAttackerCardfix({
    weaponAtk: 100,
    equipAtk: 100,
    classification,
    flags: {
        ...enabledFlags,
        ignoreAttackerCardfix: true,
        ignoreElementCardfix: true,
    },
    modifiers: attackerModifiers,
});

const combinedDefender = calculateDefenderCardfix({
    damage: 100,
    classification,
    flags: enabledFlags,
    modifiers: {
        subRace: { DemiHuman: -10 },
    },
});

if (
    combinedFlags.weaponAtk !== 100 ||
    combinedFlags.equipAtk !== 100 ||
    combinedDefender.damage !== 90
) {
    throw new Error("Cardfix flags interfered with each other");
}

console.log("Cardfix calculator tests passed");