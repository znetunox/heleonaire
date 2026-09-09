import { rathenaDb } from "../parsers/rathenaParser";
import { importRathenaItems } from "./rathenaItemImporter";
async function main() {
    try {
        console.log("Iniciando importação de Items rAthena...");
        await rathenaDb.load();
        const itemsImported = await importRathenaItems();
        console.log(`Importação concluída com sucesso!`);
        console.log(`Quantidade de Items importados: ${itemsImported}`);
        process.exit(0);
    }
    catch (error) {
        console.error("Erro durante a importação:", error);
        process.exit(1);
    }
}
main();
