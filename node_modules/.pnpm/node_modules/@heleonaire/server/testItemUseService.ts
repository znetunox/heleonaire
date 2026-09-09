import prisma from "./src/db/prisma";
import { itemUseService } from "./src/game/items/ItemUseService";

async function main() {
    const character = await prisma.character.findUnique({
        where: {
            name: "Dada",
        },
    });

    if (!character) {
        throw new Error("Character Dada not found");
    }

    const inventoryEntry = await prisma.inventory.findFirst({
        where: {
            characterId: character.id,
            item: {
                name: "Red Potion",
            },
        },
        include: {
            item: true,
        },
    });

    if (!inventoryEntry) {
        throw new Error(
            "Dada does not have Red Potion in inventory",
        );
    }

    console.log("");
    console.log("=== BEFORE ===");
    console.log(`Character: ${character.name}`);
    console.log(`HP: ${character.hp}`);
    console.log(`Max HP: ${character.maxHp ?? "N/A"}`);
    console.log(`MP: ${character.mp}`);
    console.log(`Max MP: ${character.maxMp ?? "N/A"}`);
    console.log(
        `Item: ${inventoryEntry.item.name}`,
    );
    console.log(
        `Quantity: ${inventoryEntry.quantity}`,
    );

    const player = {
        characterId: character.id,
        hp: character.hp,
        maxHp: character.maxHp ?? 100,
        mp: character.mp,
        maxMp: character.maxMp ?? 50,
    };

    const result = await itemUseService.useItem(
        player,
        inventoryEntry.id,
    );

    console.log("");
    console.log("=== RESULT ===");
    console.dir(result, {
        depth: null,
    });

    console.log("");
    console.log("=== AFTER PLAYER OBJECT ===");
    console.log(`HP: ${player.hp}/${player.maxHp}`);
    console.log(`MP: ${player.mp}/${player.maxMp}`);

    const remaining = await prisma.inventory.findUnique({
        where: {
            id: inventoryEntry.id,
        },
    });

    console.log("");
    console.log("=== AFTER INVENTORY ===");

    if (remaining) {
        console.log(
            `Quantity: ${remaining.quantity}`,
        );
    } else {
        console.log("Inventory entry was deleted.");
    }

    await prisma.$disconnect();
}

main().catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
});

