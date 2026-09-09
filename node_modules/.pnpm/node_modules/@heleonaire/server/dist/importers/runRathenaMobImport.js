import { rathenaDb } from "../parsers/rathenaParser";
import { importRathenaMobs } from "./rathenaMobImporter";
async function main() {
    try {
        console.log("Iniciando importação de Mobs rAthena...");
        await rathenaDb.load();
        const mobsImported = await importRathenaMobs();
        console.log(`Importação concluída com sucesso!`);
        console.log(`Quantidade de Mobs importados: ${mobsImported}`);
        process.exit(0);
    }
    catch (error) {
        console.error("Erro durante a importação:", error);
        process.exit(1);
    }
}
main();
