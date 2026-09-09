import { StatusId } from "../status/StatusTypes";

export type ItemEffect =
    | {
        type: "HEAL";
        hp: number;
        mp: number;
    }
    | {
        type: "PERCENT_HEAL";
        hpPercent: number;
        mpPercent: number;
    }
    | {
        type: "STATUS_START";
        statusId: StatusId;
        durationMs: number;
        value: number;
        value2: number;
        value3: number;
        value4: number;
    }
    | {
        type: "STATUS_END";
        statusId: StatusId;
    };

export class ItemScriptInterpreter {
    interpret(script: string): ItemEffect[] {
        if (!script || typeof script !== "string") {
            return [];
        }

        const normalized = script
            .replace(/\/\/.*$/gm, "")
            .trim();

        if (!normalized) {
            return [];
        }

        const statements = this.splitStatements(normalized);
        const effects: ItemEffect[] = [];

        for (const statement of statements) {
            const effect = this.interpretStatement(statement);

            if (effect) {
                effects.push(effect);
            }
        }

        return effects;
    }

    private interpretStatement(
        statement: string,
    ): ItemEffect | null {
        const normalized = statement.trim();

        if (!normalized) {
            return null;
        }

        const itemHealMatch = normalized.match(
            /^itemheal\s+(.+)$/is,
        );

        if (itemHealMatch) {
            const separatorIndex =
                this.findTopLevelComma(
                    itemHealMatch[1],
                );

            if (separatorIndex === -1) {
                return null;
            }

            const hpExpression =
                itemHealMatch[1]
                    .slice(0, separatorIndex)
                    .trim();

            const mpExpression =
                itemHealMatch[1]
                    .slice(separatorIndex + 1)
                    .trim();

            const hp =
                this.evaluateNumber(hpExpression);

            const mp =
                this.evaluateNumber(mpExpression);

            
            if (hp === null || mp === null) {
                return null;
            }

            return {
                type: "HEAL",
                hp,
                mp,
            };
        }

        const statusStartMatch =
            normalized.match(
                /^sc_start(?:2|4)?\s+(.+)$/is,
            );

        if (statusStartMatch) {
            const args =
                this.splitArguments(
                    statusStartMatch[1],
                );

            if (args.length < 2 || args.length > 6) {
                return null;
            }

            const statusId =
                args[0].trim();

            const durationMs =
                this.evaluateNumber(args[1]);

            if (
                !statusId ||
                durationMs === null ||
                durationMs <= 0
            ) {
                return null;
            }

            const values = [0, 0, 0, 0];

            for (
                let i = 2;
                i < args.length;
                i++
            ) {
                const value =
                    this.evaluateNumber(args[i]);

                if (value === null) {
                    return null;
                }

                values[i - 2] = value;
            }

            return {
                type: "STATUS_START",
                statusId,
                durationMs,
                value: values[0],
                value2: values[1],
                value3: values[2],
                value4: values[3],
            };
        }

        const statusEndMatch =
            normalized.match(/^sc_end\s+(.+)$/is);

        if (statusEndMatch) {
            const statusId = statusEndMatch[1].trim();

            if (!statusId) {
                return null;
            }

            return {
                type: "STATUS_END",
                statusId,
            };
        }

        const percentHealMatch = normalized.match(
            /^percentheal\s+(.+)$/is,
        );

        if (percentHealMatch) {
            const separatorIndex =
                this.findTopLevelComma(
                    percentHealMatch[1],
                );

            if (separatorIndex === -1) {
                return null;
            }

            const hpExpression =
                percentHealMatch[1]
                    .slice(0, separatorIndex)
                    .trim();

            const mpExpression =
                percentHealMatch[1]
                    .slice(separatorIndex + 1)
                    .trim();

            const hpPercent =
                this.evaluateNumber(hpExpression);

            const mpPercent =
                this.evaluateNumber(mpExpression);

            if (
                hpPercent === null ||
                mpPercent === null
            ) {
                return null;
            }

            return {
                type: "PERCENT_HEAL",
                hpPercent,
                mpPercent,
            };
        }

        return null;
    }

    private splitArguments(
        expression: string,
    ): string[] {
        const argumentsList: string[] = [];

        let start = 0;
        let depth = 0;
        let inString = false;
        let stringDelimiter = "";

        for (
            let i = 0;
            i < expression.length;
            i++
        ) {
            const char =
                expression[i];

            if (inString) {
                if (
                    char === stringDelimiter &&
                    expression[i - 1] !== "\\"
                ) {
                    inString = false;
                    stringDelimiter = "";
                }

                continue;
            }

            if (
                char === '"' ||
                char === "'"
            ) {
                inString = true;
                stringDelimiter = char;
                continue;
            }

            if (char === "(") {
                depth++;
                continue;
            }

            if (char === ")") {
                depth--;

                if (depth < 0) {
                    return [];
                }

                continue;
            }

            if (
                char === "," &&
                depth === 0
            ) {
                const argument =
                    expression
                        .slice(start, i)
                        .trim();

                if (!argument) {
                    return [];
                }

                argumentsList.push(
                    argument,
                );

                start = i + 1;
            }
        }

        if (
            depth !== 0 ||
            inString
        ) {
            return [];
        }

        const remaining =
            expression
                .slice(start)
                .trim();

        if (!remaining) {
            return [];
        }

        argumentsList.push(
            remaining,
        );

        return argumentsList;
    }

    private splitStatements(
        script: string,
    ): string[] {
        const statements: string[] = [];

        let start = 0;
        let depth = 0;
        let inString = false;
        let stringDelimiter = "";

        for (
            let i = 0;
            i < script.length;
            i++
        ) {
            const char = script[i];

            if (
                inString
            ) {
                if (
                    char === stringDelimiter &&
                    script[i - 1] !== "\\"
                ) {
                    inString = false;
                    stringDelimiter = "";
                }

                continue;
            }

            if (
                char === '"' ||
                char === "'"
            ) {
                inString = true;
                stringDelimiter = char;
                continue;
            }

            if (char === "(") {
                depth++;
                continue;
            }

            if (char === ")") {
                depth--;

                if (depth < 0) {
                    return [];
                }

                continue;
            }

            if (
                char === ";" &&
                depth === 0
            ) {
                const statement =
                    script
                        .slice(start, i)
                        .trim();

                if (statement) {
                    statements.push(statement);
                }

                start = i + 1;
            }
        }

        if (
            depth !== 0 ||
            inString
        ) {
            return [];
        }

        const remaining =
            script
                .slice(start)
                .trim();

        if (remaining) {
            statements.push(remaining);
        }

        return statements;
    }

    private findTopLevelComma(
        expression: string,
    ): number {
        let depth = 0;
        let inString = false;
        let stringDelimiter = "";

        for (
            let i = 0;
            i < expression.length;
            i++
        ) {
            const char = expression[i];

            if (inString) {
                if (
                    char === stringDelimiter &&
                    expression[i - 1] !== "\\"
                ) {
                    inString = false;
                    stringDelimiter = "";
                }

                continue;
            }

            if (
                char === '"' ||
                char === "'"
            ) {
                inString = true;
                stringDelimiter = char;
                continue;
            }

            if (char === "(") {
                depth++;
                continue;
            }

            if (char === ")") {
                depth--;

                if (depth < 0) {
                    return -1;
                }

                continue;
            }

            if (
                char === "," &&
                depth === 0
            ) {
                return i;
            }
        }

        if (
            depth !== 0 ||
            inString
        ) {
            return -1;
        }

        return -1;
    }

    private evaluateNumber(
        expression: string,
    ): number | null {
        const normalized =
            expression.trim();

        if (
            /^-?\d+$/.test(normalized)
        ) {
            return Number(normalized);
        }

        const random =
            normalized.match(
                /^rand\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)$/i,
            );

        if (!random) {
            return null;
        }

        const min =
            Number(random[1]);

        const max =
            Number(random[2]);

        if (min > max) {
            return null;
        }

        return (
            Math.floor(
                Math.random() *
                    (max - min + 1),
            ) + min
        );
    }
}

export const itemScriptInterpreter =
    new ItemScriptInterpreter();
