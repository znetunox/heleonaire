import { parseItems } from "./src/data/rathena/parsers/itemParser";

async function main() {
    const { items } = parseItems();
    const all = [...items.values()];

    const types = [
        "Usable",
        "Healing",
        "Etc",
        "Card",
        "Weapon",
        "Armor",
        "Shadowgear",
    ];

    console.log("\n===== RESUMO =====");

    for (const type of types) {
        const list = all.filter(item => item.type === type);

        const refineable = list.filter(item => item.refineable).length;
        const gradable = list.filter(item => item.gradable).length;
        const stack = list.filter(item => item.stack != null).length;
        const locations = list.filter(item => item.locations != null).length;

        console.log(
            `${type.padEnd(12)} ` +
            `total=${String(list.length).padStart(5)} ` +
            `refine=${String(refineable).padStart(4)} ` +
            `grade=${String(gradable).padStart(4)} ` +
            `stack=${String(stack).padStart(4)} ` +
            `locations=${String(locations).padStart(4)}`
        );
    }

    console.log("\n===== STACK =====");

    for (const item of all.filter(item => item.stack != null)) {
        console.log(
            `${item.id} | ${item.aegisName} | ${item.type} | ${item.stack}`
        );
    }

    console.log("\n===== USABLE/HEALING COM REFINE OU GRADE =====");

    for (const item of all.filter(
        item =>
            (item.type === "Usable" || item.type === "Healing") &&
            (item.refineable || item.gradable)
    )) {
        console.log(
            `${item.id} | ${item.aegisName} | ${item.type} | ` +
            `refine=${item.refineable} grade=${item.gradable}`
        );
    }

    console.log("\n===== ETC COM PROPRIEDADES DE EQUIPAMENTO =====");

    for (const item of all.filter(
        item =>
            item.type === "Etc" &&
            (
                item.refineable ||
                item.gradable ||
                item.locations != null
            )
    )) {
        console.log(
            `${item.id} | ${item.aegisName} | ` +
            `refine=${item.refineable} ` +
            `grade=${item.gradable} ` +
            `locations=${item.locations ?? "null"}`
        );
    }
}

main()
    .catch(error => {
        console.error(error);
        process.exit(1);
    });