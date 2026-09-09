import { inventoryService } from "./src/game/inventory/InventoryService";

async function main() {
    const characterId = "5b408336-e601-4c71-9dba-259aaf573723";

    await inventoryService.addItem(
        characterId,
        501,
        10,
    );

    console.log("10 Red Potions adicionadas ao personagem Dada.");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
