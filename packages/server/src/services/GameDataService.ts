import { prisma } from "../db/prisma";
import { RATHENA_DB_RE } from "../data/rathena/paths";
import {
    parseAttributeTable,
    ParsedAttributeTable,
} from "../data/rathena/parsers/attrFixParser";

export interface GameMobData {
    id: number;
    aegisName: string;
    name: string;

    level: number;
    hp: number;

    baseExp: number;
    jobExp: number;

    attack: number;
    attack2: number;
    defense: number;
    resistance: number;
    magicDefense: number;

    str: number;
    agi: number;
    vit: number;
    int: number;
    dex: number;
    luk: number;

    attackRange: number;
    skillRange: number;
    chaseRange: number;

    size: string;
    race: string;
    class: string;

    element: string;
    elementLevel: number;

    walkSpeed: number;
    attackDelay: number;
    attackMotion: number;
    damageMotion: number;

    ai: string;
}

export interface GameItemData {
    id: number;
    aegisName: string;
    name: string;

    type: string;
    subType: string | null;

    buy: number;
    sell: number;
    weight: number;

    attack: number | null;
    magicAttack: number | null;
    defense: number | null;

    range: number | null;
    slots: number | null;

    weaponLevel: number | null;
    armorLevel: number | null;

    equipLevelMin: number | null;
    equipLevelMax: number | null;

    refineable: boolean;
    gradable: boolean;

    jobs: string | null;
    job: string | null;
    classes: string | null;
    gender: string | null;
    locations: string | null;

    view: number | null;
    aliasName: string | null;

    script: string | null;
    equipScript: string | null;
    unequipScript: string | null;

    flags: string | null;
    noUse: string | null;
    trade: string | null;
    stack: string | null;
    delay: string | null;

    buyingStore: boolean;
    deadBranch: boolean;
    container: boolean;
    uniqueId: boolean;
    sitting: boolean;
}

export interface GameDropData {
    id: string;
    mobId: number;
    itemId: number;
    rate: number;
    stealProtected: boolean;
    sourceKey: string | null;
}

export interface GameSizeFixData {
    weaponType: string;
    small: number;
    medium: number;
    large: number;
}

class GameDataService {
    private mobs = new Map<number, GameMobData>();
    private items = new Map<number, GameItemData>();
    private drops = new Map<number, GameDropData[]>();
    private sizeFixRules = new Map<string, GameSizeFixData>();
    private attributeTable: ParsedAttributeTable | null = null;

    private initialized = false;
    private initializationPromise: Promise<void> | null = null;

    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this.load();

        try {
            await this.initializationPromise;
            this.initialized = true;
        } finally {
            this.initializationPromise = null;
        }
    }

    private async load(): Promise<void> {
        console.log("[GameDataService] Loading game data...");

        const [mobRows, itemRows, dropRows, sizeFixRows] = await Promise.all([
            prisma.mob.findMany(),
            prisma.item.findMany(),
            prisma.dropEntry.findMany(),
            prisma.sizeFixRule.findMany(),
        ]);

        this.mobs.clear();
        this.items.clear();
        this.drops.clear();
        this.sizeFixRules.clear();

        for (const mob of mobRows) {
            const data: GameMobData = {
                id: mob.id,
                aegisName: mob.aegisName,
                name: mob.name,

                level: mob.level,
                hp: mob.hp,

                baseExp: mob.baseExp,
                jobExp: mob.jobExp,

                attack: mob.attack,
                attack2: mob.attack2,
                defense: mob.defense,
                resistance: mob.resistance,
                magicDefense: mob.magicDefense,

                str: mob.str,
                agi: mob.agi,
                vit: mob.vit,
                int: mob.int,
                dex: mob.dex,
                luk: mob.luk,

                attackRange: mob.attackRange,
                skillRange: mob.skillRange,
                chaseRange: mob.chaseRange,

                size: mob.size,
                race: mob.race,
                class: "Normal",

                element: mob.element,
                elementLevel: mob.elementLevel,

                walkSpeed: mob.walkSpeed,
                attackDelay: mob.attackDelay,
                attackMotion: mob.attackMotion,
                damageMotion: mob.damageMotion,

                ai: mob.ai,
            };

            this.mobs.set(data.id, data);
        }

        for (const item of itemRows) {
            const data: GameItemData = {
                id: item.id,
                aegisName: item.aegisName,
                name: item.name,

                type: item.type,
                subType: item.subType,

                buy: item.buy,
                sell: item.sell,
                weight: item.weight,

                attack: item.attack,
                magicAttack: item.magicAttack,
                defense: item.defense,

                range: item.range,
                slots: item.slots,

                weaponLevel: item.weaponLevel,
                armorLevel: item.armorLevel,

                equipLevelMin: item.equipLevelMin,
                equipLevelMax: item.equipLevelMax,

                refineable: item.refineable,
                gradable: item.gradable,

                jobs: item.jobs,
                job: item.job,
                classes: item.classes,
                gender: item.gender,
                locations: item.locations,

                view: item.view,
                aliasName: item.aliasName,

                script: item.script,
                equipScript: item.equipScript,
                unequipScript: item.unequipScript,

                flags: item.flags,
                noUse: item.noUse,
                trade: item.trade,
                stack: item.stack,
                delay: item.delay,

                buyingStore: item.buyingStore,
                deadBranch: item.deadBranch,
                container: item.container,
                uniqueId: item.uniqueId,
                sitting: item.sitting,
            };

            this.items.set(data.id, data);
        }

        for (const drop of dropRows) {
            const data: GameDropData = {
                id: drop.id,
                mobId: drop.mobId,
                itemId: drop.itemId,
                rate: drop.rate,
                stealProtected: drop.stealProtected,
                sourceKey: drop.sourceKey,
            };

            const mobDrops = this.drops.get(drop.mobId);

            if (mobDrops) {
                mobDrops.push(data);
            } else {
                this.drops.set(drop.mobId, [data]);
            }
        }

        for (const rule of sizeFixRows) {
            const data: GameSizeFixData = {
                weaponType: rule.weaponType,
                small: rule.small,
                medium: rule.medium,
                large: rule.large,
            };

            this.sizeFixRules.set(
                data.weaponType,
                data
            );
        }

        this.attributeTable = parseAttributeTable(
            `${RATHENA_DB_RE}/attr_fix.yml`,
        );

        console.log(
            `[GameDataService] Loaded ${this.mobs.size} mobs, ` +
            `${this.items.size} items, ` +
            `${dropRows.length} drops, ` +
            `${this.sizeFixRules.size} Size Fix rules and ` +
            `Attribute Table (v${this.attributeTable.version}).`
        );
    }

    // ============================================================
    // ATTRIBUTE TABLE
    // ============================================================

    getAttributeTable(): ParsedAttributeTable {
        if (!this.attributeTable) {
            this.attributeTable = parseAttributeTable(
                `${RATHENA_DB_RE}/attr_fix.yml`,
            );
        }
        return this.attributeTable;
    }

    // ============================================================
    // MOBS
    // ============================================================

    getMob(id: number): GameMobData | undefined {
        return this.mobs.get(id);
    }

    getMobCount(): number {
        return this.mobs.size;
    }

    // ============================================================
    // ITEMS
    // ============================================================

    getItem(id: number): GameItemData | undefined {
        return this.items.get(id);
    }

    getItemByAegisName(aegisName: string): GameItemData | undefined {
        for (const item of this.items.values()) {
            if (item.aegisName === aegisName) {
                return item;
            }
        }

        return undefined;
    }

    getItemCount(): number {
        return this.items.size;
    }

    // ============================================================
    // DROPS
    // ============================================================

    getMobDrops(mobId: number): GameDropData[] {
        return this.drops.get(mobId) ?? [];
    }

    getDropCount(): number {
        let count = 0;

        for (const mobDrops of this.drops.values()) {
            count += mobDrops.length;
        }

        return count;
    }

    // ============================================================
    // SIZE FIX
    // ============================================================

    getSizeFix(weaponType: string): GameSizeFixData {
        return (
            this.sizeFixRules.get(weaponType) ?? {
                weaponType,
                small: 100,
                medium: 100,
                large: 100,
            }
        );
    }

    getSizeFixCount(): number {
        return this.sizeFixRules.size;
    }

    // ============================================================
    // STATUS
    // ============================================================

    isInitialized(): boolean {
        return this.initialized;
    }
}

export const gameDataService = new GameDataService();