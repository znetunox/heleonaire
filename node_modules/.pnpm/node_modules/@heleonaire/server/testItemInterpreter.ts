import {
    itemScriptInterpreter,
} from "./src/game/items/ItemScriptInterpreter";

const tests = [
    {
        name: "Red Potion",
        script: "itemheal rand(45,65),0;",
    },
    {
        name: "Yggdrasil Berry",
        script: "percentheal 100,100;",
    },
    {
        name: "Harvest Biscuit",
        script: "percentheal 3,0; itemheal 0,100;",
    },
    {
        name: "Blue Potion",
        script: "itemheal 0,rand(40,60);",
    },
    {
        name: "Negative Percent Heal",
        script: "percentheal -100,-100;",
    },
];

for (const test of tests) {
    console.log("");
    console.log(`=== ${test.name} ===`);
    console.log(`SCRIPT: ${test.script}`);

    const result =
        itemScriptInterpreter.interpret(
            test.script,
        );

    console.dir(result, {
        depth: null,
    });
}
