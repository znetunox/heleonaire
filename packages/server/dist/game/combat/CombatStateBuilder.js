import { statusService, } from "../status/StatusService";
import { EquipmentService, } from "../equipment/EquipmentService";
import { StatSystem, } from "../stats/StatSystem";
import { calculateEffectivePatk, } from "./attackCalculator";
export class CombatStateBuilder {
    constructor(prisma, statuses = statusService) {
        this.prisma = prisma;
        this.statuses = statuses;
        this.statSystem =
            new StatSystem(prisma);
    }
    async buildPlayerSnapshot(character) {
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
        const statusModifiers = this.statuses.getStatModifiers(character.id);
        /*
         * ---------------------------------------------------------
         * 2. Equipment state
         * ---------------------------------------------------------
         */
        const equipmentService = this.getEquipmentService();
        const equipmentModifiers = await equipmentService.getStatModifiers(character.id);
        const weapon = await equipmentService.getWeaponContext(character.id);
        /*
         * ---------------------------------------------------------
         * 3. Effective primary stats
         * ---------------------------------------------------------
         */
        const stats = {
            str: character.str +
                (statusModifiers.str ?? 0),
            agi: character.agi +
                (statusModifiers.agi ?? 0),
            vit: character.vit +
                (statusModifiers.vit ?? 0),
            int: character.int +
                (statusModifiers.int ?? 0),
            dex: character.dex +
                (statusModifiers.dex ?? 0),
            luk: character.luk +
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
        const statSystemModifiers = {
            ...statusModifiers,
            atk: 0,
        };
        const derived = this.statSystem.calculateDerivedStats(stats, character.level, {
            ...statSystemModifiers,
            defense: (statusModifiers.defense ?? 0) +
                equipmentModifiers.armorDef +
                equipmentModifiers.def,
            defenseRate: (statusModifiers.defenseRate ?? 0) +
                equipmentModifiers.defRate,
            defense2: (statusModifiers.defense2 ?? 0) +
                equipmentModifiers.def2,
            defense2Rate: (statusModifiers.defense2Rate ?? 0) +
                equipmentModifiers.def2Rate,
        });
        /*
         * ---------------------------------------------------------
         * 5. Combat stats
         * ---------------------------------------------------------
         */
        const combatStats = {
            level: character.level,
            str: stats.str,
            agi: stats.agi,
            vit: stats.vit,
            int: stats.int,
            dex: stats.dex,
            luk: stats.luk,
            batk: derived.batk,
            statusAtk: derived.statusAtk,
            /*
             * P.ATK permanece no valor derivado atual.
             *
             * bPAtk e bPAtkRate serão aplicados em uma etapa
             * própria quando fecharmos o modelo de P.ATK.
             */
            patk: calculateEffectivePatk(derived.patk, equipmentModifiers.patk, equipmentModifiers.patkRate),
            def1: derived.def1,
            def2: derived.def2,
            res: 0,
            mdef1: derived.mdef1,
            mdef2: derived.mdef2,
            hit: derived.hit,
            flee: derived.flee,
            crit: derived.crit,
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
        const equipAtk = equipmentModifiers.equipAtk;
        /*
         * Ammo permanece separado.
         *
         * O uso efetivo do ammo será decidido no estágio
         * de ataque que souber se a skill/basic attack usa
         * munição.
         */
        const ammoAtk = equipmentModifiers.ammoAtk;
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
        const atkRate = (statusModifiers.atkRate ?? 0) +
            (equipmentModifiers.atkRate ?? 0);
        const weaponAtkRate = (statusModifiers.weaponAtkRate ?? 0) +
            (equipmentModifiers.weaponAtkRate ?? 0);
        const weaponAtkByType = {
            ...(equipmentModifiers.weaponAtkByType ?? {}),
        };
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
        const weaponDamageRateByType = {
            ...(equipmentModifiers.weaponDamageRateByType ?? {}),
        };
        /*
         * P.ATK já foi materializado em combatStats.patk.
         * O estágio de dano aplica-o depois do elemento e antes
         * de masteryAtk, como no Renewal.
         */
        /*
         * ---------------------------------------------------------
         * 10. Return snapshot
         * ---------------------------------------------------------
         */
        return {
            characterId: character.id,
            name: character.name,
            jobKey: character.jobKey,
            stats,
            combatStats,
            equipAtk,
            ammoAtk,
            atkRate,
            weaponAtkRate,
            ignoreRes: equipmentModifiers.ignoreRes,
            ignoreDefRate: equipmentModifiers.ignoreDefRate,
            ignoreDefByRace: equipmentModifiers.ignoreDefByRace,
            ignoreDefByClass: equipmentModifiers.ignoreDefByClass,
            defPiercingByRace: equipmentModifiers.defPiercingByRace,
            defPiercingByElement: equipmentModifiers.defPiercingByElement,
            defPiercingByClass: equipmentModifiers.defPiercingByClass,
            weaponDamageRateByType,
            weaponAtkByType,
            weapon,
            ammo: null,
        };
    }
    buildMobSnapshot(mob) {
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
        const def2 = Math.floor((mob.level + mob.vit) / 2);
        const mdef2 = Math.floor((mob.int + mob.level) / 4);
        const hit = 150 +
            mob.level +
            mob.dex;
        const flee = 100 +
            mob.level +
            mob.agi;
        const combatStats = {
            level: mob.level,
            str: mob.str,
            agi: mob.agi,
            vit: mob.vit,
            int: mob.int,
            dex: mob.dex,
            luk: mob.luk,
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
            def1: mob.defense,
            def2,
            res: mob.resistance,
            mdef1: mob.magicDefense,
            mdef2,
            hit,
            flee,
            crit: 0,
        };
        return {
            mobDbId: mob.id,
            aegisName: mob.aegisName,
            name: mob.name,
            stats: combatStats,
            attack: mob.attack,
            attack2: mob.attack2,
            attackRange: mob.attackRange,
            size: mob.size,
            race: mob.race,
            class: mob.class,
            element: mob.element,
            elementLevel: mob.elementLevel,
        };
    }
    getEquipmentService() {
        return new EquipmentService();
    }
}
