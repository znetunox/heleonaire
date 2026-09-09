import prisma from "./src/db/prisma";
import { itemScriptInterpreter } from "./src/game/items/ItemScriptInterpreter";

async function main() {
    const item = await prisma.item.findUnique({
        where: {
            id: 505,
        },
        select: {
            id: true,
            name: true,
            script: true,
        },
    });

    if (!item) {
        throw new Error("Item 505 não encontrado.");
    }

    console.log("ITEM:", item.name);
    console.log("SCRIPT:", JSON.stringify(item.script));

    const result = itemScriptInterpreter.interpret(
        item.script ?? "",
    );

    console.log("RESULT:", result);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});