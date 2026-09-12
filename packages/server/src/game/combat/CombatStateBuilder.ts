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
         * Importante:
         *
         * bBaseAtk NÃO é BATK.
         *
         * BATK/statusAtk e EATK/equipAtk permanecem separados.
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
        const equipmentService =
            this.getEquipmentService();

        const equipmentModifiers =
            await equipmentService.getStatModifiers(
                character.id,
            );

        const weapon =
            await equipmentService.getWeaponContext(
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
         * `atk` continua zerado aqui.
         *
         * Não devemos colocar bBaseAtk em `atk`, porque:
         *
         *     bBaseAtk -> EATK
         *
         * e não:
         *
         *     bBaseAtk -> BATK
         *
         * Também não colocamos ainda bPAtk/bPAtkRate no
         * StatSystem porque o StatSystem atual não possui
         * suporte específico para P.ATK percentual.
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
                     * Equipment DEF é DEF1 / hard DEF.
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
         */
        const combatStats: CombatStats = {
            level:
                character.level,

            str:
                stats.str,

            agi:
                stats.agi,

            vit:
                stats.vit,

            int:
                stats.int,

            dex:
                stats.dex,

            luk:
                stats.luk,

            batk:
                derived.batk,

            statusAtk:
                derived.statusAtk,

            /*
             * P.ATK permanece no valor derivado atual.
             *
             * bPAtk e bPAtkRate serão aplicados em uma etapa
             * própria quando fecharmos o modelo de P.ATK.
             */
            patk:
                derived.patk,

            def1:
                derived.def1,

            def2:
                derived.def2,

            res:
                0,

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
         * Fontes:
         *
         *   Item.attack
         *       -> equipamento físico
         *
         *   bBaseAtk
         *       -> EATK
         *
         * `statusModifiers.atk` NÃO entra aqui.
         */
        const equipAtk =
            equipmentModifiers.equipAtk;

        /*
         * Ammo permanece separado.
         *
         * O uso efetivo do ammo será decidido no estágio
         * de ataque que souber se a skill/basic attack usa
         * munição.
         */
        const ammoAtk =
            equipmentModifiers.ammoAtk;

        /*
         * ---------------------------------------------------------
         * 7. Percentage attack modifiers
         * ---------------------------------------------------------
         *
         * bAtkRate:
         *
         *     não é bWeaponAtkRate.
         *
         * Ele deve permanecer disponível para o estágio que
         * calcula:
         *
         *     (weaponAtk + equipAtk) * atkRate / 100
         *
         * bWeaponAtkRate:
         *
         *     modifica WATK antes da variância da arma.
         *
         * Os dois podem existir simultaneamente em status e
         * equipamento.
         */
        const atkRate =
            (statusModifiers.atkRate ?? 0) +
            (equipmentModifiers.atkRate ?? 0);

        const weaponAtkRate =
            (statusModifiers.weaponAtkRate ?? 0) +
            (equipmentModifiers.weaponAtkRate ?? 0);

        /*
         * ---------------------------------------------------------
         * 8. Weapon damage rate
         * ---------------------------------------------------------
         *
         * Temporariamente continua escalar porque
         * PlayerCombatSnapshot ainda usa:
         *
         *     weaponDamageRate: number
         *
         * A modelagem definitiva deverá ser por tipo de arma,
         * porque rAthena bWeaponDamageRate possui dimensão de
         * weapon type.
         */
        const weaponDamageRateByType: Record<string, number> = {
            ...(equipmentModifiers.weaponDamageRateByType ?? {}),
        };

        for (const [
            weaponType,
            value,
        ] of Object.entries(
            equipmentModifiers.weaponDamageRateByType ?? {},
        )) {
            weaponDamageRateByType[weaponType] =
                (weaponDamageRateByType[weaponType] ?? 0) +
                value;
        }

        const weaponAtkByType: Record<string, number> = {
            ...(equipmentModifiers.weaponAtkByType ?? {}),
        };

        /*
         * ---------------------------------------------------------
         * 9. P.ATK equipment modifiers
         * ---------------------------------------------------------
         *
         * NÃO aplicamos matematicamente ainda.
         *
         * O EquipmentService já coleta:
         *
         *     bPAtk
         *     bPAtkRate
         *
         * mas o CombatStats atual não possui esses campos e o
         * StatSystem ainda retorna patk = 0.
         *
         * Portanto, não vamos esconder esses valores nem
         * aplicá-los em lugar incorreto.
         *
         * A integração definitiva será feita quando o modelo
         * de P.ATK for fechado.
         */

        /*
         * ---------------------------------------------------------
         * 10. Return snapshot
         * ---------------------------------------------------------
         */
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

            atkRate,

            weaponAtkRate,

            weaponDamageRateByType,

            weaponAtkByType,

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
         * Mobs não usam as mesmas fórmulas de HIT/FLEE/DEF2/MDEF2
         * dos personagens.
         *
         * Renewal:
         *
         *   HIT  = 150 + Level + DEX
         *   FLEE = 100 + Level + AGI
         *   DEF2 = floor((Level + VIT) / 2)
         *   MDEF2 = floor((INT + Level) / 4)
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
             * Esses campos de ataque serão preenchidos quando
             * implementarmos o pipeline mob -> player.
             */
            batk: 0,
            statusAtk: 0,
            patk: 0,

            /*
             * Renewal mob DB:
             *
             * defense -> DEF1
             * resistance -> RES
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