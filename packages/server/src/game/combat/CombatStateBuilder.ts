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
    PlayerCombatSnapshot,
} from "./combatTypes";

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

    private getEquipmentService(): EquipmentService {
        return new EquipmentService();
    }
}
