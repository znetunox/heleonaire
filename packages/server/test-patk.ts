import {
    calculateAttackComposition,
    calculateEffectivePatk,
} from "./src/game/combat/attackCalculator";

const effectivePatk =
    calculateEffectivePatk(0, 25, 20);

if (effectivePatk !== 30) {
    throw new Error(
        `P.ATK efetivo incorreto: esperado 30, recebido ${effectivePatk}`,
    );
}

const result = calculateAttackComposition(
    {
        statusAtk: 101,
        weaponAtk: 50,
        equipAtk: 9,
        masteryAtk: 7,
        patk: effectivePatk,
    },
    effectivePatk,
    0,
    100,
    0,
);

if (result.postPatkDamage !== 208) {
    throw new Error(
        `P.ATK não aplicado no estágio correto: esperado 208, recebido ${result.postPatkDamage}`,
    );
}

if (result.masteryDamage !== 215) {
    throw new Error(
        `MasteryATK foi alterado pelo P.ATK: esperado 215, recebido ${result.masteryDamage}`,
    );
}

console.log("P.ATK tests passed");