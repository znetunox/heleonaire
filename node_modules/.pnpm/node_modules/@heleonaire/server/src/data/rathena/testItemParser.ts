import { parseItems } from "./parsers/itemParser";

const result = parseItems();

console.log("");
console.log("=================================");
console.log("        ITEM PARSER TEST");
console.log("=================================");
console.log(`Items: ${result.items.size}`);
console.log(`Duplicates: ${result.duplicates}`);
console.log("=================================");
console.log("");

const firstItems = Array.from(result.items.values()).slice(0, 5);

console.dir(firstItems, {
  depth: null,
});