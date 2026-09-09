import { randomUUID } from "crypto";
import prisma from "./src/db/prisma";

const INSTANCE_ITEM_TYPES = [
    "Weapon",
    "Armor",
    "Shadowgear",
    "Card",
];

async function main() {
    console.log("\n===== MIGRAÇÃO DE INSTÂNCIAS =====");

    const legacyRows = await prisma.inventory.findMany({
        where: {
            instanceId: null,
            item: {
                type: {
                    in: INSTANCE_ITEM_TYPES,
                },
            },
        },
        select: {
            id: true,
            characterId: true,
            itemId: true,
            quantity: true,
            slot: true,
            refineLevel: true,
            item: {
                select: {
                    name: true,
                    type: true,
                },
            },
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    console.log(`Entradas legadas encontradas: ${legacyRows.length}`);

    let migratedRows = 0;
    let createdInstances = 0;

    await prisma.$transaction(async (tx) => {
        for (const row of legacyRows) {
            if (row.quantity <= 0) {
                throw new Error(
                    `Quantidade inválida: inventoryId=${row.id} quantity=${row.quantity}`,
                );
            }

            /*
             * Mantemos o registro original.
             *
             * Isso é importante porque CharacterEquipment.inventoryId
             * pode apontar para ele.
             */
            await tx.inventory.update({
                where: {
                    id: row.id,
                },
                data: {
                    quantity: 1,
                    instanceId: randomUUID(),
                },
            });

            migratedRows++;

            /*
             * Cada unidade adicional vira uma nova instância física.
             */
            const additionalCount = row.quantity - 1;

            for (let i = 0; i < additionalCount; i++) {
                await tx.inventory.create({
                    data: {
                        characterId: row.characterId,
                        itemId: row.itemId,
                        quantity: 1,
                        slot: -1,
                        instanceId: randomUUID(),
                        refineLevel: row.refineLevel,
                    },
                });

                createdInstances++;
            }

            console.log(
                `[MIGRATE] ${row.item.name} (${row.itemId}) ` +
                `quantity=${row.quantity} -> ${row.quantity} instâncias`,
            );
        }
    });

    console.log("\n===== RESULTADO =====");
    console.log(`Entradas convertidas: ${migratedRows}`);
    console.log(`Novas instâncias criadas: ${createdInstances}`);
    console.log(
        `Total físico após migração: ${migratedRows + createdInstances}`,
    );
}

main()
    .catch((error) => {
        console.error("\n[MIGRATE] ERRO:");
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });