import prisma from "./src/db/prisma";
import { equipmentService } from "./src/game/equipment/EquipmentService";
import { StatSystem } from "./src/game/stats/StatSystem";

async function main() {
    const characterId =
        "5b408336-e601-4c71-9dba-259aaf573723";

    const statSystem =
        new StatSystem(prisma);

    const char =
        await prisma.character.findUnique({
            where: {
                id: characterId,
            },
        });

    if (!char) {
        throw new Error("Character not found");
    }

    // ─────────────────────────────────────────────
    // DESEQUIPA
    // ─────────────────────────────────────────────

    const equipment =
        await equipmentService.unequipItem(
            characterId,
            "Right_Hand",
        );

    console.log(
        "EQUIPMENT AFTER UNEQUIP:",
        equipment.map((e) => ({
            slot: e.slot,
            item: e.item.name,
            subType: e.item.subType,
            type: e.item.type,
        })),
    );

    // ─────────────────────────────────────────────
    // IDENTIFICA ARMA
    // ─────────────────────────────────────────────

    const weapon =
        equipment.find(
            (e) =>
                e.item.type === "Weapon" &&
                e.slot === "Right_Hand",
        ) ??
        equipment.find(
            (e) =>
                e.item.type === "Weapon" &&
                e.slot === "Both_Hand",
        ) ??
        equipment.find(
            (e) =>
                e.item.type === "Weapon" &&
                e.slot === "Left_Hand",
        );

    const weaponType =
        weapon?.item.subType ?? "Fist";

    console.log(
        "WEAPON TYPE:",
        weaponType,
    );

    // ─────────────────────────────────────────────
    // CALCULA ASPD
    // ─────────────────────────────────────────────

    const baseASPD =
        await statSystem.getBaseASPD(
            char.jobKey,
            weaponType,
        );

    const aspd =
        statSystem.calculateASPD(
            baseASPD,
            char.agi,
            char.dex,
            0,
        );

    console.log({
        jobKey: char.jobKey,
        weaponType,
        agi: char.agi,
        dex: char.dex,
        baseASPD,
        aspd,
    });

    // ─────────────────────────────────────────────
    // CONFIRMA INVENTÁRIO
    // ─────────────────────────────────────────────

    const inventory =
        await prisma.inventory.findMany({
            where: {
                id: "edc4197c-f292-47cc-b47e-d7a1540aa17d",
            },
            select: {
                id: true,
                itemId: true,
                quantity: true,
                slot: true,
                refineLevel: true,
            },
        });

    console.log(
        "ROD IN INVENTORY:",
        inventory,
    );
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());