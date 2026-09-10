import { loadYamlFile } from "../yamlLoader";

export const RATHENA_ELEMENTS = [
    "Neutral",
    "Water",
    "Earth",
    "Fire",
    "Wind",
    "Poison",
    "Holy",
    "Dark",
    "Ghost",
    "Undead",
] as const;

export type RathenaElement =
    typeof RATHENA_ELEMENTS[number];

export interface ParsedAttributeTable {
    version: number;
    levels: number[];
    getRatio(
        level: number,
        attackElement: RathenaElement,
        targetElement: RathenaElement,
    ): number;
}

interface RawAttributeDb {
    Header?: {
        Type?: string;
        Version?: number;
    };
    Body?: RawAttributeLevel[];
}

interface RawAttributeLevel {
    Level?: number;
    [attackElement: string]: unknown;
}

function assertElement(
    value: string,
): asserts value is RathenaElement {
    if (
        !RATHENA_ELEMENTS.includes(
            value as RathenaElement,
        )
    ) {
        throw new Error(
            `Unknown rAthena element: ${value}`,
        );
    }
}

export function parseAttributeTable(
    filePath: string,
): ParsedAttributeTable {
    const raw =
        loadYamlFile<RawAttributeDb>(filePath);

    if (raw.Header?.Type !== "ATTRIBUTE_DB") {
        throw new Error(
            `Invalid ATTRIBUTE_DB type: ${raw.Header?.Type}`,
        );
    }

    if (raw.Header?.Version !== 1) {
        throw new Error(
            `Unsupported ATTRIBUTE_DB version: ${raw.Header?.Version}`,
        );
    }

    if (!Array.isArray(raw.Body)) {
        throw new Error(
            "ATTRIBUTE_DB Body must be an array",
        );
    }

    const table = new Map<
        number,
        Map<RathenaElement, Map<RathenaElement, number>>
    >();

    for (const levelEntry of raw.Body) {
        if (
            typeof levelEntry.Level !== "number" ||
            !Number.isInteger(levelEntry.Level)
        ) {
            throw new Error(
                "ATTRIBUTE_DB level must be an integer",
            );
        }

        const level = levelEntry.Level;

        if (level < 1 || level > 4) {
            throw new Error(
                `Unsupported attribute level: ${level}`,
            );
        }

        if (table.has(level)) {
            throw new Error(
                `Duplicate ATTRIBUTE_DB level: ${level}`,
            );
        }

        const attackMap =
            new Map<
                RathenaElement,
                Map<RathenaElement, number>
            >();

        for (const attackElement of RATHENA_ELEMENTS) {
            const rawTargetMap =
                levelEntry[attackElement];

            if (
                rawTargetMap === null ||
                typeof rawTargetMap !== "object" ||
                Array.isArray(rawTargetMap)
            ) {
                throw new Error(
                    `Missing attack element ${attackElement} at level ${level}`,
                );
            }

            const targetMap =
                new Map<
                    RathenaElement,
                    number
                >();

            for (
                const targetElement
                of RATHENA_ELEMENTS
            ) {
                const value = (
                    rawTargetMap as Record<
                        string,
                        unknown
                    >
                )[targetElement];

                if (
                    typeof value !== "number" ||
                    !Number.isFinite(value)
                ) {
                    throw new Error(
                        `Invalid ratio: L${level} ${attackElement} -> ${targetElement}`,
                    );
                }

                if (value < -100 || value > 200) {
                    throw new Error(
                        `Invalid ratio ${value}: L${level} ${attackElement} -> ${targetElement}`,
                    );
                }

                targetMap.set(
                    targetElement,
                    value,
                );
            }

            attackMap.set(
                attackElement,
                targetMap,
            );
        }

        table.set(level, attackMap);
    }

    for (let level = 1; level <= 4; level++) {
        if (!table.has(level)) {
            throw new Error(
                `Missing ATTRIBUTE_DB level: ${level}`,
            );
        }
    }

    return {
        version: 1,

        levels: [1, 2, 3, 4],

        getRatio(
            level,
            attackElement,
            targetElement,
        ) {
            assertElement(attackElement);
            assertElement(targetElement);

            const attackMap =
                table.get(level);

            if (!attackMap) {
                throw new Error(
                    `Invalid attribute level: ${level}`,
                );
            }

            const targetMap =
                attackMap.get(attackElement);

            if (!targetMap) {
                throw new Error(
                    `Missing attack element: ${attackElement}`,
                );
            }

            const ratio =
                targetMap.get(targetElement);

            if (ratio === undefined) {
                throw new Error(
                    `Missing target element: ${targetElement}`,
                );
            }

            return ratio;
        },
    };
}

export function applyRenewalElementRatio(
    damage: number,
    ratio: number,
): number {
    return (
        damage -
        Math.trunc(
            damage * (100 - ratio) / 100,
        )
    );
}