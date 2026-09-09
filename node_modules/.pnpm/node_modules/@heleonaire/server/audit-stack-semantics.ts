import prisma from "./src/db/prisma";
import { parseItems } from "./src/data/rathena/parsers/itemParser";

function summarizeStack(stack: string | undefined) {
    if (!stack) {
        return {
            hasStack: false,
            amount: null,
            inventory: null,
            cart: null,
            storage: null,
            guildStorage: null,
            raw: null,
        };
    }

    try {
        const parsed = JSON.parse(stack);

        return {
            hasStack: true,
            amount: parsed.Amount ?? null,
            inventory: parsed.Inventory ?? null,
            cart: parsed.Cart ?? null,
            storage: parsed.Storage ?? null,
            guildStorage: parsed.GuildStorage ?? null,
            raw: stack,
        };
    } catch {
        return {
            hasStack: true,
            amount: null,
            inventory: null,
            cart: null,
            storage: null,
            guildStorage: null,
            raw: stack,
        };
    }
}

async function main() {
    const parsed = parseItems();

    const all = [...parsed.items.values()];

    const stackable = all.filter(
        item => item.stack !== undefined
    );

    console.log("\n========================================");
    console.log("STACK SEMANTICS - PARSER");
    console.log("========================================");

    console.log(`Total de itens: ${all.length}`);
    console.log(`Com Stack:      ${stackable.length}`);
    console.log(`Sem Stack:      ${all.length - stackable.length}`);

    console.log("\n===== ITENS COM STACK =====");

    for (const item of stackable) {
        const stack = summarizeStack(item.stack);

        console.log({
            id: item.id,
            aegisName: item.aegisName,
            name: item.name,
            type: item.type,
            subType: item.subType,
            refineable: item.refineable,
            stackAmount: stack.amount,
            inventory: stack.inventory,
            cart: stack.cart,
            storage: stack.storage,
            guildStorage: stack.guildStorage,
            rawStack: stack.raw,
        });
    }

    console.log("\n===== STACK POR TIPO =====");

    const byType = new Map<string, number>();

    for (const item of stackable) {
        byType.set(
            item.type,
            (byType.get(item.type) ?? 0) + 1
        );
    }

    console.table(
        [...byType.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => ({
                type,
                count,
            }))
    );

    console.log("\n===== STACK COM INVENTORY=true =====");

    const inventoryStackable = stackable.filter(item => {
        const stack = summarizeStack(item.stack);

        return stack.inventory === true;
    });

    console.log(
        `Itens stackáveis no inventário: ${inventoryStackable.length}`
    );

    console.table(
        inventoryStackable.map(item => {
            const stack = summarizeStack(item.stack);

            return {
                id: item.id,
                name: item.name,
                type: item.type,
                amount: stack.amount,
                inventory: stack.inventory,
            };
        })
    );

    console.log("\n===== COMPARAÇÃO PRISMA =====");

    const dbStacked = await prisma.item.findMany({
        where: {
            stack: {
                not: null,
            },
        },
        select: {
            id: true,
            name: true,
            type: true,
            stack: true,
        },
        orderBy: {
            id: "asc",
        },
    });

    console.log(
        `Prisma com stack != null: ${dbStacked.length}`
    );

    console.table(dbStacked);
}

main()
    .catch(error => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });