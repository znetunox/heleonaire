import { PrismaClient } from "@prisma/client";

export type StatKey =
  | "str"
  | "agi"
  | "vit"
  | "int"
  | "dex"
  | "luk";

export interface CharacterStatValues {
  str: number;
  agi: number;
  vit: number;
  int: number;
  dex: number;
  luk: number;
}

export interface DerivedStats {
    maxHp: number;
    maxMp: number;

    atk: number;
    batk: number;
    statusAtk: number;
    patk: number;

    matk: number;

    def1: number;
    def2: number;

    mdef1: number;
    mdef2: number;

    hit: number;
    flee: number;
    crit: number;
}

export type StatModifiers = Partial<Record<
    | "str"
    | "agi"
    | "vit"
    | "int"
    | "dex"
    | "luk"
    | "atk"
    | "matk"
    | "defense"
    | "magicDefense"
    | "hit"
    | "flee"
    | "crit"
    | "maxHpPercent"
    | "maxMpPercent",
    number
    >>;

export interface AspdCalculationInput {
    baseASPD: number;
    agi: number;
    dex: number;
    aspdFixedBonus?: number;
}

export function calculateASPD({
    baseASPD,
    agi,
    dex,
    aspdFixedBonus = 0,
}: AspdCalculationInput): number {
    if (!Number.isFinite(baseASPD) || baseASPD <= 0) {
        throw new Error(
            `Invalid baseASPD: ${baseASPD}`,
        );
    }

    if (!Number.isFinite(agi) || agi < 0) {
        throw new Error(
            `Invalid agi: ${agi}`,
        );
    }

    if (!Number.isFinite(dex) || dex < 0) {
        throw new Error(
            `Invalid dex: ${dex}`,
        );
    }

    if (
        !Number.isFinite(aspdFixedBonus) ||
        aspdFixedBonus < 0
    ) {
        throw new Error(
            `Invalid aspdFixedBonus: ${aspdFixedBonus}`,
        );
    }

    /*
     * rAthena status_base_amotion_pc()
     *
     * Normal melee weapon formula:
     *
     * temp =
     *     DEX² / 5 +
     *     AGI² / 2
     */
    const tempBase =
        (dex * dex) / 5 +
        (agi * agi) * 0.5;

    /*
     * rAthena:
     *
     * sqrt(temp) * 0.25 + 196
     */
    const tempASPD =
        Math.sqrt(tempBase) * 0.25 +
        196;

    /*
     * rAthena:
     *
     * (fixed ASPD bonus * AGI) / 200
     */
    const withFixedBonus =
        tempASPD +
        (aspdFixedBonus * agi) / 200;

    /*
     * rAthena:
     *
     * aspd =
     * floor(temp_aspd + ...) -
     * min(baseASPD, 200)
     */
    const aspd =
        Math.floor(withFixedBonus) -
        Math.min(baseASPD, 200);

    /*
     * Renewal conversion:
     *
     * amotion = 2000 - ASPD * 10
     *
     * Player adelay is half of amotion.
     */
    const amotion =
        2000 - aspd * 10;

    const adelay =
        amotion / 2;

    /*
     * Prevent invalid/negative attack intervals.
     */
    return Math.max(1, Math.floor(adelay));
}

export class StatSystem {
    constructor(private readonly prisma: PrismaClient) { }

    calculateASPD(
        baseASPD: number,
        agi: number,
        dex: number,
        aspdFixedBonus = 0,
    ): number {
        if (!Number.isFinite(baseASPD) || baseASPD <= 0) {
            throw new Error(
                `Invalid baseASPD: ${baseASPD}`,
            );
        }

        if (!Number.isFinite(agi) || agi < 0) {
            throw new Error(
                `Invalid agi: ${agi}`,
            );
        }

        if (!Number.isFinite(dex) || dex < 0) {
            throw new Error(
                `Invalid dex: ${dex}`,
            );
        }

        if (
            !Number.isFinite(aspdFixedBonus) ||
            aspdFixedBonus < 0
        ) {
            throw new Error(
                `Invalid aspdFixedBonus: ${aspdFixedBonus}`,
            );
        }

        /*
         * rAthena Renewal:
         *
         * temp_aspd =
         *     DEX² / 5 +
         *     AGI² / 2
         */
        const tempBase =
            (dex * dex) / 5 +
            (agi * agi) * 0.5;

        /*
         * temp_aspd =
         *     sqrt(temp) * 0.25 + 196
         */
        const tempASPD =
            Math.sqrt(tempBase) * 0.25 +
            196;

        /*
         * Fixed ASPD modifiers:
         *
         * bonus * AGI / 200
         */
        const modifiedASPD =
            tempASPD +
            (aspdFixedBonus * agi) / 200;

        /*
         * rAthena:
         *
         * aspd =
         *     floor(temp_aspd + bonus) -
         *     min(baseASPD, 200)
         */
        const aspd =
            Math.floor(modifiedASPD) -
            Math.min(baseASPD, 200);

        /*
         * Renewal:
         *
         * AMOTION_ZERO_ASPD = 2000
         * AMOTION_INTERVAL  = 10
         *
         * amotion = 2000 - ASPD * 10
         *
         * For players:
         *
         * adelay = amotion / 2
         */
        const amotion =
            2000 - aspd * 10;

        const adelay =
            Math.floor(amotion / 2);

        return Math.max(1, adelay);
    }

    /**
     * Renewal status point cost.
     *
     * Calculates the cost to increase a stat from `currentValue`
     * to `currentValue + 1`.
     */
    getStatCost(currentValue: number): number {
        if (currentValue < 1) {
            throw new Error("Stat value must be at least 1.");
        }

        if (currentValue < 100) {
            return 2 + Math.floor((currentValue - 1) / 10);
        }

        return 16 + 4 * Math.floor((currentValue - 100) / 5);
    }

    /**
     * Calculates the total cost to increase a stat by `amount`.
     */
    getIncreaseCost(currentValue: number, amount: number): number {
        if (amount < 0) {
            throw new Error("Increase amount cannot be negative.");
        }

        let cost = 0;

        for (let i = 0; i < amount; i++) {
            cost += this.getStatCost(currentValue + i);
        }

        return cost;
    }

    /**
     * Calculates how many points are gained when moving
     * from one BaseLevel to the next.
     *
     * StatPointTable stores cumulative values.
     */
    async getLevelUpPoints(level: number): Promise<number> {
        const current = await this.prisma.statPointTable.findUnique({
            where: {
                level,
            },
        });

        const next = await this.prisma.statPointTable.findUnique({
            where: {
                level: level + 1,
            },
        });

        if (!current || !next) {
            throw new Error(
                `Stat point table missing for levels ${level} or ${level + 1}.`,
            );
        }

        return Math.max(0, next.points - current.points);
    }

    /**
     * Returns the cumulative amount of status points
     * available at a given BaseLevel.
     */
    async getTotalPointsAtLevel(level: number): Promise<number> {
        const entry = await this.prisma.statPointTable.findUnique({
            where: {
                level,
            },
        });

        if (!entry) {
            throw new Error(
                `Stat point table entry missing for level ${level}.`,
            );
        }

        return entry.points;
    }

    /**
     * Determines whether a character can increase a stat.
     */
    canIncreaseStat(
        stats: CharacterStatValues,
        availablePoints: number,
        stat: StatKey,
        amount = 1,
    ): boolean {
        if (amount <= 0) {
            return false;
        }

        const currentValue = stats[stat];

        const cost = this.getIncreaseCost(
            currentValue,
            amount,
        );

        return cost <= availablePoints;
    }

    /**
     * Returns the new stat value and remaining points.
     *
     * Does not modify the database.
     */
    increaseStat(
        stats: CharacterStatValues,
        availablePoints: number,
        stat: StatKey,
        amount = 1,
    ): {
        stats: CharacterStatValues;
        availablePoints: number;
        cost: number;
    } {
        if (amount <= 0) {
            throw new Error("Increase amount must be positive.");
        }

        const currentValue = stats[stat];

        const cost = this.getIncreaseCost(
            currentValue,
            amount,
        );

        if (cost > availablePoints) {
            throw new Error(
                `Not enough stat points. Required: ${cost}, available: ${availablePoints}.`,
            );
        }

        return {
            stats: {
                ...stats,
                [stat]: currentValue + amount,
            },
            availablePoints: availablePoints - cost,
            cost,
        };
    }

     /**
     * Retorna o ASPD base importado do rAthena para a classe
     * e tipo de arma informados.
     *
     * O valor retornado aqui é o valor nativo de BaseASPD
     * do rAthena, não o intervalo em milissegundos usado
     * pelo loop de combate do Heleonaire.
     */
    async getBaseASPD(
        jobKey: string,
        weaponType = "Fist",
    ): Promise<number> {
        if (!jobKey) {
            throw new Error(
                "jobKey is required.",
            );
        }

        const gameClass =
            await this.prisma.gameClass.findUnique({
                where: {
                    aegisName: jobKey,
                },
                select: {
                    id: true,
                    aegisName: true,
                    name: true,
                },
            });

        if (!gameClass) {
            throw new Error(
                `GameClass not found for jobKey = ${ jobKey }.`,
            );
        }

        const classAspd =
            await this.prisma.classAspd.findUnique({
                where: {
                    classId_weaponType: {
                        classId: gameClass.id,
                        weaponType,
                    },
                },
                select: {
                    weaponType: true,
                    aspd: true,
                },
            });

        if (!classAspd) {
            throw new Error(
                `ASPD not found for ` +
                `job = ${ jobKey } ` +
                `weaponType = ${ weaponType }.`,
            );
        }

        return classAspd.aspd;
    }

    /**
     * Calculates derived combat values.
     *
     * This is intentionally isolated from persistence.
     */
    calculateDerivedStats(
        stats: CharacterStatValues,
        level: number,
        modifiers: StatModifiers = {},
    ): DerivedStats {
        const effectiveStats: CharacterStatValues = {
            str: stats.str + (modifiers.str ?? 0),
            agi: stats.agi + (modifiers.agi ?? 0),
            vit: stats.vit + (modifiers.vit ?? 0),
            int: stats.int + (modifiers.int ?? 0),
            dex: stats.dex + (modifiers.dex ?? 0),
            luk: stats.luk + (modifiers.luk ?? 0),
        };

        const maxHpBase =
            100 +
            effectiveStats.vit * 10;

        const maxMpBase =
            50 +
            effectiveStats.int * 5;

        const maxHp =
            Math.max(
                1,
                Math.floor(
                    maxHpBase *
                    (1 + (modifiers.maxHpPercent ?? 0) / 100),
                ),
            );

        const maxMp =
            Math.max(
                1,
                Math.floor(
                    maxMpBase *
                    (1 + (modifiers.maxMpPercent ?? 0) / 100),
                ),
            );

        const batk =
            effectiveStats.str +
            Math.floor(effectiveStats.dex / 5) +
            Math.floor(effectiveStats.luk / 3) +
            Math.floor(level / 4);

        const statusAtk = batk * 2;

        const patk = 0;

        return {
            maxHp,
            maxMp,

            atk:
                effectiveStats.str * 2 +
                Math.floor(effectiveStats.dex / 5) +
                (modifiers.atk ?? 0),

            batk,

            statusAtk,

            patk,

            matk:
                effectiveStats.int * 2 +
                Math.floor(effectiveStats.dex / 5) +
                (modifiers.matk ?? 0),

            def1:
                modifiers.defense ?? 0,

            def2:
                Math.floor(
                    (level + effectiveStats.vit) / 2,
                ) +
                Math.floor(
                    effectiveStats.agi / 5,
                ),

            mdef1:
                modifiers.magicDefense ?? 0,

            mdef2:
                effectiveStats.int +
                Math.floor(level / 4) +
                Math.floor((effectiveStats.dex + effectiveStats.vit) / 5),

            hit:
                175 +
                level +
                effectiveStats.dex +
                Math.floor(effectiveStats.luk / 3) +
                (modifiers.hit ?? 0),

            flee:
                100 +
                level +
                effectiveStats.agi +
                Math.floor(effectiveStats.luk / 5) +
                (modifiers.flee ?? 0),

            crit:
                Math.floor(effectiveStats.luk / 3) +
                (modifiers.crit ?? 0),
        };
    }

}


