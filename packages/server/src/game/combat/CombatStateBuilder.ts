import type {
    PrismaClient,
} from "@prisma/client";

import {
    StatusService,
    statusService,
    type StatusStatModifiers,
} from "../status/StatusService";

import {
    EquipmentService,
} from "../equipment/EquipmentService";

import {
    StatSystem,
    type CharacterStatValues,
} from "../stats/StatSystem";

import type {
    CombatStats,
    MobCombatSnapshot,
    PlayerCombatSnapshot,
} from "./combatTypes";

import type {
    GameMobData,
} from "../../services/GameDataService";

export interface CombatCharacterInput {
    id: string;
    name: string;
    jobKey: string;

    level: number;

    str: number;
    agi: number;
    vit: number;
    int: number;
    dex: number;
    luk: number;
}

export class CombatStateBuilder {
    private readonly statSystem: StatSystem;

    constructor(
        private readonly prisma: PrismaClient,
        private readonly statuses: StatusService = statusService,
    ) {
        this.statSystem =
            new StatSystem(prisma);
    }

    async buildPlayerSnapshot(
        character: CombatCharacterInput,
    ): Promise<PlayerCombatSnapshot> {

        /*
         * ---------------------------------------------------------
         * 1. Status modifiers
         * ---------------------------------------------------------
         *
         * Important Renewal semantic:
         *
         *   bBaseAtk
         *       -> EATK
         *
         * Therefore modifiers.atk MUST NOT enter BATK.
         */
        const statusModifiers =
            this.statuses.getStatModifiers(
                character.id,
            );



        /*
         * ---------------------------------------------------------
         * 2. Equipment state
         * ---------------------------------------------------------
         */
        const equipmentModifiers =
            await this
                .getEquipmentService()
                .getStatModifiers(
                    character.id,
                );

        const weapon =
            await this
                .getEquipmentService()
                .getWeaponContext(
                    character.id,
                );

        /*
         * ---------------------------------------------------------
         * 3. Effective primary stats
         * ---------------------------------------------------------
         */
        const stats: CharacterStatValues = {
            str:
                character.str +
                (statusModifiers.str ?? 0),

            agi:
                character.agi +
                (statusModifiers.agi ?? 0),

            vit:
                character.vit +
                (statusModifiers.vit ?? 0),

            int:
                character.int +
                (statusModifiers.int ?? 0),

            dex:
                character.dex +
                (statusModifiers.dex ?? 0),

            luk:
                character.luk +
                (statusModifiers.luk ?? 0),
        };

        /*
         * ---------------------------------------------------------
         * 4. Derived Renewal stats
         * ---------------------------------------------------------
         *
         * We deliberately remove `atk` before calling
         * StatSystem.calculateDerivedStats().
         *
         * In Renewal:
         *
         *   BATK =
         *       STR
         *     + floor(DEX / 5)
         *     + floor(LUK / 3)
         *     + floor(Level / 4)
         *     + 5 * POW
         *
         * The current project does not yet have POW.
         *
         * `bBaseAtk` is EATK and therefore belongs outside BATK.
         */
        const statSystemModifiers: StatusStatModifiers = {
            ...statusModifiers,
            atk: 0,
        };

        const derived =
            this.statSystem.calculateDerivedStats(
                {
                    str: character.str,
                    agi: character.agi,
                    vit: character.vit,
                    int: character.int,
                    dex: character.dex,
                    luk: character.luk,
                },
                character.level,
                {
                    ...statSystemModifiers,

                    /*
                     * Equipment DEF is hard DEF / DEF1.
                     */
                    defense:
                        (statusModifiers.defense ?? 0) +
                        equipmentModifiers.armorDef,
                },
            );

        /*
         * ---------------------------------------------------------
         * 5. Combat stats
         * ---------------------------------------------------------
         *
         * These fields are the current project's combat snapshot.
         *
         * PATK/RES/MRES/POW/CON/etc. will be expanded when those
         * Renewal status fields are introduced into Character and
         * StatSystem.
         */
        const combatStats: CombatStats = {
            level:
                character.level,

            str: stats.str,
            agi: stats.agi,
            vit: stats.vit,
            int: stats.int,
            dex: stats.dex,
            luk: stats.luk,

            batk:
                derived.batk,

            statusAtk:
                derived.statusAtk,

            patk:
                derived.patk,

            def1:
                derived.def1,

            def2:
                derived.def2,

            res: 0,

            mdef1:
                derived.mdef1,

            mdef2:
                derived.mdef2,

            hit:
                derived.hit,

            flee:
                derived.flee,

            crit:
                derived.crit,
        };

        /*
         * ---------------------------------------------------------
         * 6. EATK
         * ---------------------------------------------------------
         *
         * Current supported sources:
         *
         *   status.atk
         *   equipment.equipAtk
         *
         * Ammo is deliberately kept separate because rAthena only
         * adds arrow/ammo ATK to equipAtk when the attack actually
         * uses ammunition.
         */
        const equipAtk =
            (statusModifiers.atk ?? 0) +
            equipmentModifiers.equipAtk;

        const ammoAtk =
            equipmentModifiers.ammoAtk;

        return {
            characterId:
                character.id,

            name:
                character.name,

            jobKey:
                character.jobKey,

            stats,

            combatStats,

            equipAtk,

            ammoAtk,

            atkRate:
                statusModifiers.atkRate ?? 0,

            weaponAtkRate:
                statusModifiers.weaponAtkRate ?? 0,

            weaponDamageRate:
                statusModifiers.weaponDamageRate ?? 0,

            weapon,

            ammo:
                null,
        };
    }

    buildMobSnapshot(
        mob: GameMobData,
    ): MobCombatSnapshot {

        /*
         * ---------------------------------------------------------
         * Renewal mob derived combat stats
         * ---------------------------------------------------------
         *
         * Mobs do not use the same HIT/FLEE/DEF2/MDEF2 formulas
         * as player characters.
         *
         * Renewal:
         *
         *   HIT  = 150 + Level + DEX
         *   FLEE = 100 + Level + AGI
         *   DEF2 = floor((Level + VIT) / 2)
         *   MDEF2 = floor((INT + Level) / 4)
         *
         * LUK does not participate in the generic mob HIT/FLEE
         * formulas.
         */

        const def2 =
            Math.floor(
                (mob.level + mob.vit) / 2,
            );

        const mdef2 =
            Math.floor(
                (mob.int + mob.level) / 4,
            );

        const hit =
            150 +
            mob.level +
            mob.dex;

        const flee =
            100 +
            mob.level +
            mob.agi;

        const combatStats: CombatStats = {
            level:
                mob.level,

            str:
                mob.str,

            agi:
                mob.agi,

            vit:
                mob.vit,

            int:
                mob.int,

            dex:
                mob.dex,

            luk:
                mob.luk,

            /*
             * These attack-side fields are not required when the mob
             * is currently being used as the target of a player attack.
             *
             * They will be populated when the mob -> player combat
             * pipeline is implemented.
             */
            batk: 0,
            statusAtk: 0,
            patk: 0,

            /*
             * Renewal mob DB values:
             *
             * defense     -> hard DEF / DEF1
             * resistance  -> RES
             */
            def1:
                mob.defense,

            def2,

            res:
                mob.resistance,

            mdef1:
                mob.magicDefense,

            mdef2,

            hit,

            flee,

            crit: 0,
        };

        return {
            mobDbId:
                mob.id,

            aegisName:
                mob.aegisName,

            name:
                mob.name,

            stats:
                combatStats,

            attack:
                mob.attack,

            attack2:
                mob.attack2,

            attackRange:
                mob.attackRange,

            size:
                mob.size,

            race:
                mob.race,

            element:
                mob.element,

            elementLevel:
                mob.elementLevel,
        };
    }

    private getEquipmentService(): EquipmentService {
        return new EquipmentService();
    }
}
