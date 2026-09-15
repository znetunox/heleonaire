/**
 * Teste end-to-end do cardfix: E.1
 * 
 * Prova o caminho completo:
 * Item rAthena (com script bAddRace)
 *   ↓
 * ItemScriptInterpreter
 *   ↓
 * ItemEffect
 *   ↓
 * EquipmentService.getStatModifiers()
 *   ↓
 * CardfixModifiers (com addRace preenchido)
 *   ↓
 * CombatStateBuilder.buildPlayerSnapshot()
 *   ↓
 * PlayerCombatSnapshot.cardfix
 *   ↓
 * AttackContext.attacker.cardfix
 *   ↓
 * CombatSystem.performWeaponAttack()
 *   ↓
 * calculateAttackerCardfix()
 *   ↓
 * dano modificado
 */

import prisma from "../../db/prisma";
import { EquipmentService } from "../equipment/EquipmentService";
import { CombatStateBuilder } from "./CombatStateBuilder";
import { combatSystem } from "./CombatSystem";
import { resolveBasicAttackComponents } from "./basicAttackResolver";
import type {
    CombatClassification,
    AttackFlags,
    AttackContext,
} from "./combatTypes";

// -----------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------

function assertEqual(
    actual: number,
    expected: number,
    message: string,
): void {
    if (actual !== expected) {
        throw new Error(
            `${message}: esperado ${expected}, recebido ${actual}`,
        );
    }
}

async function createTestCharacter() {
    const character = await prisma.character.create({
        data: {
            id: `test-char-${Date.now()}`,
            accountId: `test-account-${Date.now()}`,
            name: `TestChar_${Date.now()}`,
            classKey: "knight",
            jobKey: "KNIGHT",
            faction: "test",
            level: 50,
            jobLevel: 1,
            str: 100,
            agi: 50,
            vit: 50,
            int: 30,
            dex: 80,
            luk: 10,
        },
    });
    return character;
}

let testItemId: number = -1;

async function createTestItemWithCardfix() {
    const item = await prisma.item.create({
        data: {
            id: testItemId,
            aegisName: `TEST_CARDFIX_ITEM_${Date.now()}`,
            name: "Test Cardfix Item",
            type: "Armor",
            attack: 0,
            defense: 10,
            weight: 100,
            script: `bAddRace,RC_DemiHuman,20;`,
        },
    });
    return item;
}

async function equipItem(characterId: string) {
    await prisma.characterEquipment.create({
        data: {
            characterId,
            itemId: testItemId,
            slot: "Head_Top",
            inventoryId: `inv-${Date.now()}`,
        },
    });
}

// -----------------------------------------------------------------
// TESTE E.1 — Cardfix do equipamento chega ao dano
// -----------------------------------------------------------------
console.log("\n=== TESTE E.1 — Equipment → Attacker Cardfix → Damage ===");

async function testEndToEnd() {
    let characterId: string;

    try {
        // 1. Cria personagem
        const character = await createTestCharacter();
        characterId = character.id;
        console.log(`✓ Personagem criado: ${character.name}`);

        // 2. Cria item com bAddRace,RC_DemiHuman,20
        const item = await createTestItemWithCardfix();
        console.log(`✓ Item criado: ${item.aegisName} (script: ${item.script})`);

        // 3. Equipa o item no personagem
        await equipItem(characterId);
        console.log(`✓ Item equipado no personagem`);

        // 4. Obtém os modifiers do EquipmentService
        const equipmentService = new EquipmentService();
        const equipmentModifiers = await equipmentService.getStatModifiers(characterId);
        console.log(`✓ EquipmentService.getStatModifiers() chamado`);

        // 5. Verifica que o cardfix tem addRace.RC_DemiHuman = 20
        if (equipmentModifiers.cardfix.addRace["RC_DemiHuman"] !== 20) {
            throw new Error(
                `Cardfix addRace.RC_DemiHuman não é 20: ${equipmentModifiers.cardfix.addRace["RC_DemiHuman"]}`,
            );
        }
        console.log(`✓ CardfixModifiers.addRace.RC_DemiHuman = 20`);

        // 6. Cria CombatStateBuilder e obtém PlayerCombatSnapshot
        const combatStateBuilder = new CombatStateBuilder(prisma);
        const playerSnapshot = await combatStateBuilder.buildPlayerSnapshot({
            id: character.id,
            name: character.name,
            jobKey: character.jobKey,
            race: "Human",
            class: character.classKey,
            element: "Neutral",
            race2: [],
            level: character.level,
            str: character.str,
            agi: character.agi,
            vit: character.vit,
            int: character.int,
            dex: character.dex,
            luk: character.luk,
            pow: 1,
            sta: 1,
            wis: 1,
            spl: 1,
            con: 1,
            crt: 1,
        });
        console.log(`✓ CombatStateBuilder.buildPlayerSnapshot() criado`);

        // 7. Verifica que o cardfix chegou ao snapshot
        if (playerSnapshot.cardfix.addRace["RC_DemiHuman"] !== 20) {
            throw new Error(
                `PlayerCombatSnapshot.cardfix.addRace.RC_DemiHuman não é 20: ${playerSnapshot.cardfix.addRace["RC_DemiHuman"]}`,
            );
        }
        console.log(`✓ PlayerCombatSnapshot.cardfix.addRace.RC_DemiHuman = 20`);

        // 8. Cria MobCombatSnapshot (alvo)
        const mobSnapshot: any = {
            mobDbId: 1,
            aegisName: "TEST_DEMIHUMAN",
            name: "DemiHuman Mob",
            stats: {
                level: 10,
                str: 1,
                agi: 1,
                vit: 0,
                int: 1,
                dex: 1,
                luk: 1,
                batk: 10,
                statusAtk: 20,
                patk: 0,
                def1: 0,
                def2: 0,
                res: 0,
                mdef1: 0,
                mdef2: 0,
                hit: 0,
                flee: 0,
                crit: 0,
            },
            attack: 0,
            attack2: 0,
            attackRange: 1,
            size: "Medium",
            race: "RC_DemiHuman",
            race2: [] as const,
            class: "Normal",
            element: "Neutral",
            elementLevel: 1,
            cardfix: {
                addRace: {},
                addElement: {},
                addSize: {},
                addRace2: {},
                addClass: {},
                subElement: {},
                subDefElement: {},
                subSize: {},
                weaponSubSize: {},
                subRace2: {},
                subRace: {},
                subClass: {},
                defenseAgainstAttackerClass: {},
            },
        };
        console.log(`✓ MobCombatSnapshot criado (race: RC_DemiHuman)`);

        // 9. Cria AttackContext
        const classification: CombatClassification = {
            attacker: {
                race: playerSnapshot.race,
                class: playerSnapshot.class,
                element: playerSnapshot.element,
                race2: playerSnapshot.race2,
            },
            target: {
                race: mobSnapshot.race,
                race2: mobSnapshot.race2,
                class: mobSnapshot.class,
                element: mobSnapshot.element,
                elementLevel: mobSnapshot.elementLevel,
                size: mobSnapshot.size,
            },
            attack: {
                element: "Neutral",
                rangeType: "short",
                type: "weapon",
                hand: "right",
            },
        };

        const flags: AttackFlags = {
            ignoreAttackerCardfix: false,
            ignoreDefenderCardfix: false,
            ignoreElementCardfix: false,
        };

        // Obtém components
        const components = resolveBasicAttackComponents(playerSnapshot);

        // O danobase antes do cardfix é calculado a partir dos components
        // O player tem weaponAtk a partir do equipamento
        const baseDamageBeforeCardfix = components.weaponAtk + components.equipAtk;

        const context: AttackContext = {
            attacker: playerSnapshot,
            target: mobSnapshot,
            components,
            attackElement: "Neutral",
            targetElement: "Neutral",
            targetElementLevel: 1,
            skillRatio: 100,
            skillConstant: 0,
            skillId: 0,
            isCritical: false,
            usesAmmo: false,
            classification,
            flags,
        };
        console.log(`✓ AttackContext criado`);

        // 10. Executa o ataque
        const result = combatSystem.performWeaponAttack(context);
        console.log(`✓ CombatSystem.performWeaponAttack() executado`);

        // 11. Verifica que o cardfix foi aplicado
        // O cardfix addRace.RC_DemiHuman = 20 significa +20% de dano contra RC_DemiHuman
        // Se weaponAtk original era W e equipAtk era E:
        //   weaponAtk' = W + trunc(W * 20 / 100)
        //   equipAtk' = E + trunc(E * 20 / 100)
        //   damage = (statusAtk + weaponAtk' + equipAtk') * skillRatio / 100

        // Verifica que o resultado.components.weaponAtk é maior que o original
        // (se o equipamento não tinha weaponAtk, ele deve ter vindo do item)
        console.log(`✓ Dano final: ${result.damage}`);
        console.log(`✓ Components weaponAtk: ${result.components.weaponAtk}`);
        console.log(`✓ Components equipAtk: ${result.components.equipAtk}`);

        // 12. Verificação final: o cardfix do equipamento influenciou o dano
        // O importante é que o valor foi modificado pelo cardfix
        // Se o cardfix não estivesse funcionando, o dano seria menor

        if (result.components.weaponAtk === components.weaponAtk &&
            result.components.equipAtk === components.equipAtk) {
            throw new Error(
                "Cardfix não foi aplicado: components.weaponAtk e equipAtk são iguais aos originais"
            );
        }

        console.log("✓ Cardfix foi aplicado (components modificados)");

        // Limpa o banco
        await prisma.characterEquipment.deleteMany({
            where: { characterId },
        });
        await prisma.character.delete({
            where: { id: characterId },
        });
        await prisma.item.delete({
            where: { id: testItemId },
        });

        console.log("\n=======================================================");
        console.log("E.1 — EQUIPMENT → ATTACKER CARDFIX → DAMAGE: TESTE PASSOU");
        console.log("=======================================================\n");

    } catch (error) {
        console.error("✗ Teste E.1 falhou:", error);
        throw error;
    }
}

// -----------------------------------------------------------------
// EXECUÇÃO
// -----------------------------------------------------------------

testEndToEnd()
    .catch((error) => {
        console.error("ERRO:", error);
        process.exit(1);
    });
