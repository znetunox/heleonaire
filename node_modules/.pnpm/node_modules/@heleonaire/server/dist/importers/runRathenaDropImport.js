import { rathenaDb } from "../parsers/rathenaParser";
import { importRathenaDrops } from "./rathenaDropImporter";
async function main() {
    try {
        console.log("Iniciando importação de Drops rAthena...");
        await rathenaDb.load();
        const { imported, ignored } = await importRathenaDrops();
        console.log(`Importação concluída com sucesso!`);
        console.log(`Quantidade de Drops importados: ${imported}`);
        console.log(`Quantidade de Drops ignorados por Item inexistente: ${ignored}`);
        process.exit(0);
    }
    catch (error) {
        console.error("Erro durante a importação:", error);
        process.exit(1);
    }
}
main();
