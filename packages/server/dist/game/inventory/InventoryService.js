import { randomUUID } from "crypto";
import prisma from "../../db/prisma";
const INSTANCE_ITEM_TYPES = new Set([
    "Weapon",
    "Armor",
    "Shadowgear",
    "Card",
]);
export class InventoryService {
    getItemInventorySemantics(itemType) {
        return INSTANCE_ITEM_TYPES.has(itemType)
            ? "INSTANCE"
            : "STACKABLE";
    }
    async addItem(characterId, itemId, quantity) {
        if (!characterId) {
            console.warn(`[InventoryService] addItem rejected: invalid characterId`);
            return false;
        }
        if (!Number.isInteger(itemId) || itemId <= 0) {
            console.warn(`[InventoryService] addItem rejected: invalid itemId=${itemId}`);
            return false;
        }
        if (!Number.isInteger(quantity) || quantity <= 0) {
            console.warn(`[InventoryService] addItem rejected: invalid quantity=${quantity}`);
            return false;
        }
        const item = await prisma.item.findUnique({
            where: { id: itemId },
            select: {
                id: true,
                name: true,
                type: true,
            },
        });
        if (!item) {
            console.warn(`[InventoryService] addItem rejected: item not found itemId=${itemId}`);
            return false;
        }
        const semantics = this.getItemInventorySemantics(item.type);
        /*
         * Equipamentos, armas, armaduras, cartas e shadowgear
         * representam objetos físicos individuais.
         *
         * Cada unidade recebe:
         * - quantity = 1
         * - instanceId único
         */
        if (semantics === "INSTANCE") {
            await prisma.inventory.createMany({
                data: Array.from({ length: quantity }, () => ({
                    characterId,
                    itemId,
                    quantity: 1,
                    slot: -1,
                    instanceId: randomUUID(),
                    refineLevel: 0,
                })),
            });
            console.log(`[InventoryService] Instances added: ${item.name} (${item.id}) quantity=${quantity} character=${characterId}`);
            return true;
        }
        /*
         * Consumíveis / Etc continuam sendo agrupados
         * em uma entrada de inventário.
         */
        const existing = await prisma.inventory.findFirst({
            where: {
                characterId,
                itemId,
                instanceId: null,
            },
        });
        if (existing) {
            await prisma.inventory.update({
                where: {
                    id: existing.id,
                },
                data: {
                    quantity: {
                        increment: quantity,
                    },
                },
            });
            console.log(`[InventoryService] Item stacked: ${item.name} (${item.id}) +${quantity} total=${existing.quantity + quantity} character=${characterId}`);
            return true;
        }
        await prisma.inventory.create({
            data: {
                characterId,
                itemId,
                quantity,
                slot: -1,
                instanceId: null,
                refineLevel: 0,
            },
        });
        console.log(`[InventoryService] Item added: ${item.name} (${item.id}) quantity=${quantity} character=${characterId}`);
        return true;
    }
    async consumeItem(characterId, inventoryId, quantity = 1) {
        if (!characterId) {
            console.warn(`[InventoryService] consumeItem rejected: invalid characterId`);
            return false;
        }
        if (!inventoryId) {
            console.warn(`[InventoryService] consumeItem rejected: invalid inventoryId`);
            return false;
        }
        if (!Number.isInteger(quantity) || quantity <= 0) {
            console.warn(`[InventoryService] consumeItem rejected: invalid quantity=${quantity}`);
            return false;
        }
        const result = await prisma.inventory.updateMany({
            where: {
                id: inventoryId,
                characterId,
                quantity: {
                    gte: quantity,
                },
            },
            data: {
                quantity: {
                    decrement: quantity,
                },
            },
        });
        if (result.count !== 1) {
            console.warn(`[InventoryService] consumeItem rejected: inventory entry not found or insufficient quantity inventoryId=${inventoryId} character=${characterId} quantity=${quantity}`);
            return false;
        }
        await prisma.inventory.deleteMany({
            where: {
                id: inventoryId,
                characterId,
                quantity: 0,
            },
        });
        console.log(`[InventoryService] Item consumed: inventoryId=${inventoryId} quantity=${quantity} character=${characterId}`);
        return true;
    }
    async getInventory(characterId) {
        if (!characterId) {
            console.warn(`[InventoryService] getInventory rejected: invalid characterId`);
            return [];
        }
        const inventory = await prisma.inventory.findMany({
            where: {
                characterId,
            },
            include: {
                item: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
            },
            orderBy: [
                {
                    slot: "asc",
                },
                {
                    createdAt: "asc",
                },
            ],
        });
        return inventory.map((entry) => ({
            id: entry.id,
            itemId: entry.itemId,
            itemName: entry.item.name,
            itemType: entry.item.type,
            quantity: entry.quantity,
            slot: entry.slot,
            instanceId: entry.instanceId,
            refineLevel: entry.refineLevel,
        }));
    }
}
export const inventoryService = new InventoryService();
