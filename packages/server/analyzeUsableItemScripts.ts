import prisma from "./src/db/prisma";

function extractCommands(script: string): string[] {
    const commands: string[] = [];

    /*
     * Procura identificadores que aparecem no início
     * de uma instrução ou depois de ';', '{' ou '}'.
     *
     * Não é um parser completo. É apenas diagnóstico.
     */
    const regex = /(?:^|[;{}])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\(|\s)/g;

    let match: RegExpExecArray | null;

    while ((match = regex.exec(script)) !== null) {
        commands.push(match[1].toLowerCase());
    }

    return commands;
}

async function main() {
    const items = await prisma.item.findMany({
        where: {
            script: {
                not: null,
            },
            type: {
                in: ["Healing", "Usable", "DelayConsume"],
            },
        },
        select: {
            id: true,
            name: true,
            type: true,
            script: true,
        },
    });

    const counts = new Map<string, number>();
    const examples = new Map<
        string,
        {
            id: number;
            name: string;
            type: string;
            script: string;
        }[]
    >();

    for (const item of items) {
        if (!item.script) {
            continue;
        }

        const commands = extractCommands(item.script);
        const uniqueCommands = [...new Set(commands)];

        for (const command of uniqueCommands) {
            counts.set(
                command,
                (counts.get(command) ?? 0) + 1,
            );

            if (!examples.has(command)) {
                examples.set(command, []);
            }

            const list = examples.get(command)!;

            if (list.length < 3) {
                list.push({
                    id: item.id,
                    name: item.name,
                    type: item.type,
                    script: item.script,
                });
            }
        }
    }

    const sorted = [...counts.entries()]
        .sort((a, b) => b[1] - a[1]);

    console.log("");
    console.log(
        `Itens utilizáveis analisados: ${items.length}`,
    );
    console.log("");

    console.log("=== COMANDOS POR FREQUÊNCIA ===");

    for (const [command, count] of sorted) {
        console.log(`${command.padEnd(24)} ${count}`);
    }

    console.log("");
    console.log("=== EXEMPLOS DOS PRINCIPAIS ===");

    for (const [command] of sorted.slice(0, 20)) {
        console.log("");
        console.log(`--- ${command} ---`);

        for (const example of examples.get(command) ?? []) {
            console.log(
                `${example.id} - ${example.name} [${example.type}]`,
            );

            console.log(
                example.script
                    .replace(/\r/g, "")
                    .trim(),
            );
        }
    }

    await prisma.$disconnect();
}

main().catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
});
