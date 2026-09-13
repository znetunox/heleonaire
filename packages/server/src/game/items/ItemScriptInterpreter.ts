import { StatusId } from "../status/StatusTypes";

export type ScriptArgument =
    | {
        type: "number";
        value: number;
    }
    | {
        type: "identifier";
        value: string;
    }
    | {
        type: "string";
        value: string;
    };

export interface ParsedScriptCall {
    command:
    | "bonus"
    | "bonus2"
    | "bonus3"
    | "bonus4"
    | "bonus5";
    opcode: string;
    args: ScriptArgument[];
}

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
    }
    | {
        type: "stat";
        stat:
        | "str"
        | "agi"
        | "vit"
        | "int"
        | "dex"
        | "luk";
        value: number;
    }
    | {
        type: "weaponAtk";
        value: number;
    }
    | {
        type: "weaponAtk2";
        value: number;
    }
    | {
        type: "baseAtk";
        value: number;
    }
    | {
        type: "atkRate";
        value: number;
    }
    | {
        type: "weaponAtkRate";
        value: number;
    }
    | {
        type: "weaponDamageRate";
        weaponType: string;
        value: number;
    }
    | {
        type: "patk";
        value: number;
    }
    | {
        type: "patkRate";
        value: number;
    }
    | {
        type: "ignoreRes";
        value: number;
    }
    | {
        type: "ignoreDefRate";
        value: number;
    }
    | {
        type: "ignoreDefByRace";
        key: string;
        value: number;
    }
    | {
        type: "ignoreDefByClass";
        key: string;
        value: number;
    }
    | {
        type: "defPiercingByRace";
        key: string;
    }
    | {
        type: "defPiercingByElement";
        key: string;
    }
    | {
        type: "defPiercingByClass";
        key: string;
    }
    | {
        type: "weaponAtkByType";
        weaponType: string;
        value: number;
    }
    | {
        type: "def";
        value: number;
    }
    | {
        type: "defRate";
        value: number;
    }
    | {
        type: "def2";
        value: number;
    }
    | {
        type: "def2Rate";
        value: number;
    }
    | {
        type: "addRace";
        key: string;
        value: number;
    }
    | {
        type: "addElement";
        key: string;
        value: number;
    }
    | {
        type: "addSize";
        key: string;
        value: number;
    }
    | {
        type: "addRace2";
        key: string;
        value: number;
    }
    | {
        type: "addClass";
        key: string;
        value: number;
    }
    | {
        type: "subElement";
        key: string;
        value: number;
    }
    | {
        type: "subDefElement";
        key: string;
        value: number;
    }
    | {
        type: "subSize";
        key: string;
        value: number;
    }
    | {
        type: "weaponSubSize";
        key: string;
        value: number;
    }
    | {
        type: "subRace2";
        key: string;
        value: number;
    }
    | {
        type: "subRace";
        key: string;
        value: number;
    }
    | {
        type: "subClass";
        key: string;
        value: number;
    }
    | {
        type: "defenseAgainstAttackerClass";
        key: string;
        value: number;
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

        const statements =
            this.splitStatements(normalized);

        const effects: ItemEffect[] = [];

        for (const statement of statements) {
            const effect =
                this.interpretStatement(statement);

            if (effect) {
                effects.push(effect);
            }
        }

        return effects;
    }

    private interpretStatement(
        statement: string,
    ): ItemEffect | null {
        const normalized =
            statement.trim();

        if (!normalized) {
            return null;
        }

        /*
         * rAthena item scripts:
         *
         * bonus  <opcode>,...
         * bonus2 <opcode>,...
         * bonus3 <opcode>,...
         * bonus4 <opcode>,...
         * bonus5 <opcode>,...
         *
         * The parser accepts all five syntactic forms.
         * Semantic support is intentionally limited to the
         * combat subset currently audited.
         */
        const bonusCall =
            this.parseBonusCall(normalized);

        if (bonusCall) {
            return this.interpretBonus(
                bonusCall,
            );
        }

        const itemHealMatch =
            normalized.match(
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
                this.evaluateNumber(
                    hpExpression,
                );

            const mp =
                this.evaluateNumber(
                    mpExpression,
                );

            if (
                hp === null ||
                mp === null
            ) {
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

            if (
                args.length < 2 ||
                args.length > 6
            ) {
                return null;
            }

            const statusId =
                args[0].trim();

            const durationMs =
                this.evaluateNumber(
                    args[1],
                );

            if (
                !statusId ||
                durationMs === null ||
                durationMs <= 0
            ) {
                return null;
            }

            const values = [
                0,
                0,
                0,
                0,
            ];

            for (
                let i = 2;
                i < args.length;
                i++
            ) {
                const value =
                    this.evaluateNumber(
                        args[i],
                    );

                if (value === null) {
                    return null;
                }

                values[i - 2] = value;
            }

            return {
                type: "STATUS_START",
                statusId:
                    statusId as StatusId,
                durationMs,
                value: values[0],
                value2: values[1],
                value3: values[2],
                value4: values[3],
            };
        }

        const statusEndMatch =
            normalized.match(
                /^sc_end\s+(.+)$/is,
            );

        if (statusEndMatch) {
            const statusId =
                statusEndMatch[1].trim();

            if (!statusId) {
                return null;
            }

            return {
                type: "STATUS_END",
                statusId:
                    statusId as StatusId,
            };
        }

        const percentHealMatch =
            normalized.match(
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
                this.evaluateNumber(
                    hpExpression,
                );

            const mpPercent =
                this.evaluateNumber(
                    mpExpression,
                );

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

    /**
     * Parses the generic rAthena bonus syntax.
     *
     * Examples:
     *
     * bonus bStr,5
     * bonus bAtk,10
     * bonus2 bWeaponAtk,W_SWORD,10
     * bonus3 ...
     * bonus4 ...
     * bonus5 ...
     *
     * This method is deliberately syntax-oriented.
     * It does not decide whether an opcode is supported.
     */
    private parseBonusCall(
        statement: string,
    ): ParsedScriptCall | null {
        const match =
            statement.match(
                /^bonus([2-5]?)\s+(.+)$/is,
            );

        if (!match) {
            return null;
        }

        const suffix =
            match[1] ?? "";

        const command =
            `bonus${suffix}` as
            | "bonus"
            | "bonus2"
            | "bonus3"
            | "bonus4"
            | "bonus5";

        const rawArguments =
            this.splitArguments(
                match[2],
            );

        if (rawArguments.length === 0) {
            return null;
        }

        const parsedArguments:
            ScriptArgument[] = [];

        for (
            const rawArgument
            of rawArguments
        ) {
            const argument =
                this.parseScriptArgument(
                    rawArgument,
                );

            if (!argument) {
                return null;
            }

            parsedArguments.push(
                argument,
            );
        }

        const opcode =
            this.extractOpcode(
                parsedArguments[0],
            );

        if (!opcode) {
            return null;
        }

        return {
            command,
            opcode,
            args:
                parsedArguments.slice(1),
        };
    }

    /**
     * Converts one raw script argument into a
     * typed parser argument.
     *
     * Numeric arguments are preserved as numbers.
     * Identifiers such as W_SWORD are preserved as
     * identifiers.
     * Quoted strings are preserved as strings.
     */
    private parseScriptArgument(
        expression: string,
    ): ScriptArgument | null {
        const normalized =
            expression.trim();

        if (!normalized) {
            return null;
        }

        const numeric =
            this.evaluateNumber(
                normalized,
            );

        if (numeric !== null) {
            return {
                type: "number",
                value: numeric,
            };
        }

        if (
            (
                normalized.startsWith("\"") &&
                normalized.endsWith("\"")
            ) ||
            (
                normalized.startsWith("'") &&
                normalized.endsWith("'")
            )
        ) {
            return {
                type: "string",
                value:
                    normalized.slice(
                        1,
                        -1,
                    ),
            };
        }

        if (
            /^[A-Za-z_][A-Za-z0-9_]*$/.test(
                normalized,
            )
        ) {
            return {
                type: "identifier",
                value: normalized,
            };
        }

        return null;
    }

    private extractOpcode(
        argument: ScriptArgument,
    ): string | null {
        if (
            argument.type !==
            "identifier" &&
            argument.type !==
            "string"
        ) {
            return null;
        }

        const opcode =
            argument.value.trim();

        if (!opcode) {
            return null;
        }

        return opcode;
    }

    /**
     * Applies the semantic subset of rAthena item
     * bonuses currently audited for combat.
     *
     * Unsupported bonus opcodes intentionally return
     * null. They are not guessed or silently converted
     * into another combat attribute.
     */
    private interpretBonus(
        call: ParsedScriptCall,
    ): ItemEffect | null {
        const opcode =
            call.opcode
                .trim()
                .toLowerCase();

        switch (opcode) {
            case "bstr":
                return this.numericEffect(
                    call,
                    (value) => ({
                        type: "stat",
                        stat: "str",
                        value,
                    }),
                );

            case "bagi":
                return this.numericEffect(
                    call,
                    (value) => ({
                        type: "stat",
                        stat: "agi",
                        value,
                    }),
                );

            case "bvit":
                return this.numericEffect(
                    call,
                    (value) => ({
                        type: "stat",
                        stat: "vit",
                        value,
                    }),
                );

            case "bint":
                return this.numericEffect(
                    call,
                    (value) => ({
                        type: "stat",
                        stat: "int",
                        value,
                    }),
                );

            case "bdex":
                return this.numericEffect(
                    call,
                    (value) => ({
                        type: "stat",
                        stat: "dex",
                        value,
                    }),
                );

            case "bluk":
                return this.numericEffect(
                    call,
                    (value) => ({
                        type: "stat",
                        stat: "luk",
                        value,
                    }),
                );

            case "batk":
                return this.numericEffect(
                    call,
                    (value) => ({
                        type: "weaponAtk",
                        value,
                    }),
                );

            case "batk2":
                return this.numericEffect(
                    call,
                    (value) => ({
                        type: "weaponAtk2",
                        value,
                    }),
                );

            case "bbaseatk":
                return this.numericEffect(
                    call,
                    (value) => ({
                        type: "baseAtk",
                        value,
                    }),
                );

            case "batkrate":
                return this.numericEffect(
                    call,
                    (value) => ({
                        type: "atkRate",
                        value,
                    }),
                );

            case "bweaponatkrate":
                return this.numericEffect(
                    call,
                    (value) => ({
                        type: "weaponAtkRate",
                        value,
                    }),
                );

            case "bpatk":
                return this.numericEffect(
                    call,
                    (value) => ({
                        type: "patk",
                        value,
                    }),
                );

            case "bpatkrate":
                return this.numericEffect(
                    call,
                    (value) => ({
                        type: "patkRate",
                        value,
                    }),
                );

            case "bres_eff":
                return this.numericEffect(
                    call,
                    (value) => ({
                        type: "ignoreRes",
                        value,
                    }),
                );

            case "bignoredefrate":
                return this.numericEffect(
                    call,
                    (value) => ({
                        type: "ignoreDefRate",
                        value,
                    }),
                );

            case "bignoredefrace":
            case "bignoredefracerate":
                return this.parseClassificationEffect(
                    call,
                    (key, value) => ({
                        type: "ignoreDefByRace",
                        key,
                        value,
                    }),
                );

            case "bignoredefclass":
            case "bignoredefclassrate":
                return this.parseClassificationEffect(
                    call,
                    (key, value) => ({
                        type: "ignoreDefByClass",
                        key,
                        value,
                    }),
                );

            case "bdefratioatkrace":
                return this.parseClassificationFlagEffect(
                    call,
                    (key) => ({
                        type: "defPiercingByRace",
                        key,
                    }),
                );

            case "bdefratioatkele":
                return this.parseClassificationFlagEffect(
                    call,
                    (key) => ({
                        type: "defPiercingByElement",
                        key,
                    }),
                );

            case "bdefratioatkclass":
                return this.parseClassificationFlagEffect(
                    call,
                    (key) => ({
                        type: "defPiercingByClass",
                        key,
                    }),
                );

            case "bweaponatk":
                return this.parseWeaponTypeEffect(
                    call,
                    (weaponType, value) => ({
                        type:
                            "weaponAtkByType",
                        weaponType,
                        value,
                    }),
                );

            case "bweapondamagerate":
                return this.parseWeaponTypeEffect(
                    call,
                    (weaponType, value) => ({
                        type:
                            "weaponDamageRate",
                        weaponType,
                        value,
                    }),
                );

            case "bdef":
                return this.numericEffect(
                    call,
                    (value) => ({
                        type: "def",
                        value,
                    }),
                );

            case "bdefrate":
                return this.numericEffect(
                    call,
                    (value) => ({
                        type: "defRate",
                        value,
                    }),
                );

            case "bdef2":
                return this.numericEffect(
                    call,
                    (value) => ({
                        type: "def2",
                        value,
                    }),
                );

            case "bdef2rate":
                return this.numericEffect(
                    call,
                    (value) => ({
                        type: "def2Rate",
                        value,
                    }),
                );

            case "baddrace":
                return this.parseClassificationEffect(
                    call,
                    (key, value) => ({
                        type: "addRace",
                        key,
                        value,
                    }),
                );

            case "baddelement":
                return this.parseClassificationEffect(
                    call,
                    (key, value) => ({
                        type: "addElement",
                        key,
                        value,
                    }),
                );

            case "baddsize":
                return this.parseClassificationEffect(
                    call,
                    (key, value) => ({
                        type: "addSize",
                        key,
                        value,
                    }),
                );

            case "baddrace2":
                return this.parseClassificationEffect(
                    call,
                    (key, value) => ({
                        type: "addRace2",
                        key,
                        value,
                    }),
                );

            case "baddclass":
                return this.parseClassificationEffect(
                    call,
                    (key, value) => ({
                        type: "addClass",
                        key,
                        value,
                    }),
                );

            case "bsubelement":
                return this.parseClassificationEffect(
                    call,
                    (key, value) => ({
                        type: "subElement",
                        key,
                        value,
                    }),
                );

            case "bsubdefelement":
                return this.parseClassificationEffect(
                    call,
                    (key, value) => ({
                        type: "subDefElement",
                        key,
                        value,
                    }),
                );

            case "bsubsize":
                return this.parseClassificationEffect(
                    call,
                    (key, value) => ({
                        type: "subSize",
                        key,
                        value,
                    }),
                );

            case "bweaponsubsize":
                return this.parseClassificationEffect(
                    call,
                    (key, value) => ({
                        type: "weaponSubSize",
                        key,
                        value,
                    }),
                );

            case "bsubrace2":
                return this.parseClassificationEffect(
                    call,
                    (key, value) => ({
                        type: "subRace2",
                        key,
                        value,
                    }),
                );

            case "bsubrace":
                return this.parseClassificationEffect(
                    call,
                    (key, value) => ({
                        type: "subRace",
                        key,
                        value,
                    }),
                );

            case "bsubclass":
                return this.parseClassificationEffect(
                    call,
                    (key, value) => ({
                        type: "subClass",
                        key,
                        value,
                    }),
                );

            case "bdefenseagainstattackerclass":
                return this.parseClassificationEffect(
                    call,
                    (key, value) => ({
                        type: "defenseAgainstAttackerClass",
                        key,
                        value,
                    }),
                );

            default:
                return null;
        }
    }

    /**
     * Handles bonus opcodes that require exactly one
     * numeric argument.
     */
    private numericEffect(
        call: ParsedScriptCall,
        create: (
            value: number,
        ) => ItemEffect,
    ): ItemEffect | null {
        if (call.args.length !== 1) {
            return null;
        }

        const argument =
            call.args[0];

        if (
            argument.type !==
            "number"
        ) {
            return null;
        }

        return create(
            argument.value,
        );
    }

    /**
     * Handles:
     *
     * bonus2 bWeaponAtk,W_SWORD,10
     * bonus2 bWeaponDamageRate,W_BOW,20
     *
     * The weapon type remains a separate semantic
     * dimension. It is not collapsed into a generic
     * ATK modifier.
     */
    private parseWeaponTypeEffect(
        call: ParsedScriptCall,
        create: (
            weaponType: string,
            value: number,
        ) => ItemEffect,
    ): ItemEffect | null {
        if (call.args.length !== 2) {
            return null;
        }

        const weaponTypeArgument =
            call.args[0];

        const valueArgument =
            call.args[1];

        if (
            weaponTypeArgument.type !==
            "identifier" &&
            weaponTypeArgument.type !==
            "string"
        ) {
            return null;
        }

        if (
            valueArgument.type !==
            "number"
        ) {
            return null;
        }

        const weaponType =
            weaponTypeArgument.value.trim();

        if (!weaponType) {
            return null;
        }

        return create(
            weaponType,
            valueArgument.value,
        );
    }

    private parseClassificationEffect(
        call: ParsedScriptCall,
        create: (
            key: string,
            value: number,
        ) => ItemEffect,
    ): ItemEffect | null {
        if (call.args.length !== 2) {
            return null;
        }

        const keyArgument = call.args[0];
        const valueArgument = call.args[1];

        if (
            (keyArgument.type !== "identifier" &&
                keyArgument.type !== "string") ||
            valueArgument.type !== "number"
        ) {
            return null;
        }

        const key = keyArgument.value.trim();

        return key
            ? create(key, valueArgument.value)
            : null;
    }

    private parseClassificationFlagEffect(
        call: ParsedScriptCall,
        create: (
            key: string,
        ) => ItemEffect,
    ): ItemEffect | null {
        if (call.args.length !== 1) {
            return null;
        }

        const keyArgument = call.args[0];

        if (
            keyArgument.type !== "identifier" &&
            keyArgument.type !== "string"
        ) {
            return null;
        }

        const key = keyArgument.value.trim();

        return key
            ? create(key)
            : null;
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
                    char ===
                    stringDelimiter &&
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
            const char =
                script[i];

            if (inString) {
                if (
                    char ===
                    stringDelimiter &&
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
                    statements.push(
                        statement,
                    );
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
            statements.push(
                remaining,
            );
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
            const char =
                expression[i];

            if (inString) {
                if (
                    char ===
                    stringDelimiter &&
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
            /^-?\d+$/.test(
                normalized,
            )
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