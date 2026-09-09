export class StatSystem {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Renewal status point cost.
     *
     * Calculates the cost to increase a stat from `currentValue`
     * to `currentValue + 1`.
     */
    getStatCost(currentValue) {
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
    getIncreaseCost(currentValue, amount) {
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
    async getLevelUpPoints(level) {
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
            throw new Error(`Stat point table missing for levels ${level} or ${level + 1}.`);
        }
        return Math.max(0, next.points - current.points);
    }
    /**
     * Returns the cumulative amount of status points
     * available at a given BaseLevel.
     */
    async getTotalPointsAtLevel(level) {
        const entry = await this.prisma.statPointTable.findUnique({
            where: {
                level,
            },
        });
        if (!entry) {
            throw new Error(`Stat point table entry missing for level ${level}.`);
        }
        return entry.points;
    }
    /**
     * Determines whether a character can increase a stat.
     */
    canIncreaseStat(stats, availablePoints, stat, amount = 1) {
        if (amount <= 0) {
            return false;
        }
        const currentValue = stats[stat];
        const cost = this.getIncreaseCost(currentValue, amount);
        return cost <= availablePoints;
    }
    /**
     * Returns the new stat value and remaining points.
     *
     * Does not modify the database.
     */
    increaseStat(stats, availablePoints, stat, amount = 1) {
        if (amount <= 0) {
            throw new Error("Increase amount must be positive.");
        }
        const currentValue = stats[stat];
        const cost = this.getIncreaseCost(currentValue, amount);
        if (cost > availablePoints) {
            throw new Error(`Not enough stat points. Required: ${cost}, available: ${availablePoints}.`);
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
     * Calculates derived combat values.
     *
     * This is intentionally isolated from persistence.
     */
    calculateDerivedStats(stats) {
        return {
            maxHp: 100 + stats.vit * 10,
            maxMp: 50 + stats.int * 5,
            atk: stats.str * 2 + Math.floor(stats.dex / 5),
            matk: stats.int * 2 + Math.floor(stats.dex / 5),
            defense: stats.vit,
            magicDefense: stats.int,
            hit: 100 + stats.dex,
            flee: stats.agi,
            crit: Math.floor(stats.luk / 3),
        };
    }
}
