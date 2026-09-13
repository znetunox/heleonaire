import { gameDataService } from "../../services/GameDataService";
const table = gameDataService.getAttributeTable();
console.log("Attribute Table Ratios:");
console.log("=======================");
const elements = ["Neutral", "Water", "Earth", "Fire", "Wind", "Poison", "Holy", "Dark", "Ghost", "Undead"];
for (const attackElement of elements) {
    for (const targetElement of elements) {
        const ratio = table.getRatio(1, attackElement, targetElement);
        if (ratio !== 100) {
            console.log(`${attackElement.padEnd(10)} -> ${targetElement.padEnd(10)}: ${ratio}`);
        }
    }
}
console.log("\nSpecific checks:");
console.log("Fire -> Water:", table.getRatio(1, "Fire", "Water"));
console.log("Fire -> Earth:", table.getRatio(1, "Fire", "Earth"));
console.log("Water -> Fire:", table.getRatio(1, "Water", "Fire"));
console.log("Earth -> Fire:", table.getRatio(1, "Earth", "Fire"));
