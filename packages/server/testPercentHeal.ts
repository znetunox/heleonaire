import {
    itemScriptInterpreter,
} from "./src/game/items/ItemScriptInterpreter";

interface TestCase {
    name: string;
    script: string;
    maxHp: number;
    maxMp: number;
    currentHp: number;
    currentMp: number;
}

const tests: TestCase[] = [
    {
        name: "3% HP",
        script: "percentheal 3,0;",
        maxHp: 190,
        maxMp: 95,
        currentHp: 41,
        currentMp: 95,
    },
    {
        name: "50% HP + 50% MP",
        script: "percentheal 50,50;",
        maxHp: 190,
        maxMp: 95,
        currentHp: 41,
        currentMp: 20,
    },
    {
        name: "100% HP + 100% MP",
        script: "percentheal 100,100;",
        maxHp: 190,
        maxMp: 95,
        currentHp: 41,
        currentMp: 20,
    },
    {
        name: "-100% HP + -100% MP",
        script: "percentheal -100,-100;",
        maxHp: 190,
        maxMp: 95,
        currentHp: 41,
        currentMp: 20,
    },
];

for (const test of tests) {
    const effects =
        itemScriptInterpreter.interpret(
            test.script,
        );

    console.log("");
    console.log(`=== ${test.name} ===`);
    console.log(`Script: ${test.script}`);
    console.log(
        `State: HP ${test.currentHp}/${test.maxHp} | MP ${test.currentMp}/${test.maxMp}`,
    );

    console.dir(effects, {
        depth: null,
    });

    if (effects.length !== 1) {
        console.log("RESULT: FAIL - quantidade de efeitos inesperada");
        continue;
    }

    const effect = effects[0];

    if (effect.type !== "PERCENT_HEAL") {
        console.log("RESULT: FAIL - efeito inesperado");
        continue;
    }

    const hpDelta = Math.floor(
        test.maxHp *
            effect.hpPercent /
            100,
    );

    const mpDelta = Math.floor(
        test.maxMp *
            effect.mpPercent /
            100,
    );

    const finalHp = Math.min(
        test.maxHp,
        Math.max(
            0,
            test.currentHp + hpDelta,
        ),
    );

    const finalMp = Math.min(
        test.maxMp,
        Math.max(
            0,
            test.currentMp + mpDelta,
        ),
    );

    console.log(
        `Delta: HP ${hpDelta >= 0 ? "+" : ""}${hpDelta} | MP ${mpDelta >= 0 ? "+" : ""}${mpDelta}`,
    );

    console.log(
        `Final: HP ${finalHp}/${test.maxHp} | MP ${finalMp}/${test.maxMp}`,
    );

    console.log("RESULT: PASS");
}
