export interface ClientInventoryItem {
    id: string;
    itemId: number;
    itemName: string;
    quantity: number;
    slot: number;
    instanceId: string | null;
    refineLevel: number;
}

export class InventoryManager {
    private items: Map<string, ClientInventoryItem> = new Map();

    setInventory(items: ClientInventoryItem[]) {
        this.items.clear();

        for (const item of items) {
            this.items.set(item.id, item);
        }

        console.log(
            `[InventoryManager] Inventory loaded: ` +
            `${this.items.size} entries`,
        );

        for (const item of this.items.values()) {
            console.log(
                `[InventoryManager] ` +
                `${item.itemName} (${item.itemId}) ` +
                `x${item.quantity} ` +
                `slot=${item.slot}`,
            );
        }
    }

    upsertItem(item: ClientInventoryItem) {
        this.items.set(item.id, item);
    }

    removeItem(inventoryId: string) {
        this.items.delete(inventoryId);
    }

    getItems(): ClientInventoryItem[] {
        return Array.from(this.items.values());
    }

    getItem(
        inventoryId: string,
    ): ClientInventoryItem | undefined {
        return this.items.get(inventoryId);
    }

    getItemQuantity(itemId: number): number {
        let total = 0;

        for (const item of this.items.values()) {
            if (item.itemId === itemId) {
                total += item.quantity;
            }
        }

        return total;
    }

    clear() {
        this.items.clear();
    }

    get size(): number {
        return this.items.size;
    }
}

export const inventoryManager =
    new InventoryManager();