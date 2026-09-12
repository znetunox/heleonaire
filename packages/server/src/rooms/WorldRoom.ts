import { Room, Client } from "colyseus";
import { WorldState, Player, Mob, GroundDrop,} from "./schema/WorldState";
import { gameDataService } from "../services/GameDataService";
import { dropService } from "../game/drops/DropService";
import CharacterSkillService from "../game/skills/CharacterSkillService";
import JobProgressionService from "../game/progression/JobProgressionService";
import { inventoryService } from "../game/inventory/InventoryService";
import { itemUseService } from "../game/items/ItemUseService";
import { statusService } from "../game/status/StatusService";
import { equipmentService } from "../game/equipment/EquipmentService";
import type {
    RathenaElement,
} from "../data/rathena/parsers/attrFixParser";
import {
    calcDef,
} from "@heleonaire/shared";
import {
    CombatStateBuilder,
    type CombatCharacterInput,
} from "../game/combat/CombatStateBuilder";

import { resolveBasicAttackComponents } from "../game/combat/basicAttackResolver";
import { resolveEffectiveAttackElement } from "../game/combat/effectiveAttackElementResolver";

import { combatSystem } from "../game/combat/CombatSystem";
import prisma from "../db/prisma";
import { MAP_DEFS } from "../maps/mapDefs";
import {
    StatSystem,
    type StatKey,
} from "../game/stats/StatSystem";

export class WorldRoom extends Room<WorldState> {
    maxClients = 100;

    private mobCounter = 0;
    private dropCounter = 0;

    private playerAttackTimers: Map<string, number> = new Map();
    private mobAttackTimers: Map<string, number> = new Map();

    private processingDropPickups: Set<string> = new Set();

    private statSystem = new StatSystem(prisma);

    private combatStateBuilder =
        new CombatStateBuilder(
            prisma,
            statusService,
        );

    private characterSkillService =
        new CharacterSkillService();

    private jobProgressionService =
        new JobProgressionService();

    private spawnGroundDrop(
        itemId: number,
        itemName: string,
        quantity: number,
        x: number,
        y: number,
        ownerId: string,
    ) {
        const drop = new GroundDrop();

        drop.id = `drop_${++this.dropCounter}`;

        drop.itemId = itemId;
        drop.itemName = itemName;
        drop.quantity = quantity;

        drop.x = x;
        drop.y = y;

        drop.ownerId = ownerId;
        drop.ownershipExpiresAt = Date.now() + 10_000;
        drop.expiresAt = Date.now() + 60_000;

        this.state.drops.set(drop.id, drop);

        console.log(
            `[WorldRoom] GroundDrop spawned: ` +
            `${itemName} (${itemId}) ` +
            `at (${Math.round(x)}, ${Math.round(y)}) ` +
            `owner=${ownerId || "none"} ` +
            `id=${drop.id}`,
        );
    }

    private cleanupExpiredDrops() {
        const now = Date.now();

        this.state.drops.forEach((drop, dropId) => {
            if (drop.expiresAt <= now) {
                console.log(
                    `[WorldRoom] GroundDrop expired: ` +
                    `${drop.itemName} (${drop.itemId}) ` +
                    `id=${dropId}`,
                );

                this.state.drops.delete(dropId);
            }
        });
    }

    // ─────────────────────────────────────────────────────────────
    // GROUND DROP PICKUP
    // ─────────────────────────────────────────────────────────────

    private async handlePickupDrop(
        client: Client,
        message: { dropId?: string },
    ) {
        // ─────────────────────────────────────────────────────────
        // PLAYER
        // ─────────────────────────────────────────────────────────

        const player =
            this.state.players.get(
                client.sessionId,
            );

        if (!player) {
            console.warn(
                `[WorldRoom] pickupDrop rejected: player not found ` +
                `session=${client.sessionId}`,
            );

            return;
        }

        // ─────────────────────────────────────────────────────────
        // DROP ID
        // ─────────────────────────────────────────────────────────

        const dropId =
            message?.dropId;

        if (
            !dropId ||
            typeof dropId !== "string"
        ) {
            console.warn(
                `[WorldRoom] pickupDrop rejected: invalid dropId ` +
                `session=${client.sessionId}`,
            );

            return;
        }

        // ─────────────────────────────────────────────────────────
        // DROP EXISTS
        // ─────────────────────────────────────────────────────────

        const drop =
            this.state.drops.get(
                dropId,
            );

        if (!drop) {
            console.warn(
                `[WorldRoom] pickupDrop rejected: drop not found ` +
                `drop=${dropId} ` +
                `player=${player.name}`,
            );

            return;
        }

        const now =
            Date.now();

        // ─────────────────────────────────────────────────────────
        // EXPIRATION
        // ─────────────────────────────────────────────────────────
        //
        // O cleanup roda a cada segundo, mas fazemos a validação
        // também aqui para impedir coleta de um drop que expirou
        // entre dois ticks de cleanup.
        // ─────────────────────────────────────────────────────────

        if (
            drop.expiresAt <= now
        ) {
            this.state.drops.delete(
                dropId,
            );

            console.log(
                `[WorldRoom] pickupDrop rejected: drop expired ` +
                `drop=${dropId} ` +
                `item=${drop.itemName} (${drop.itemId})`,
            );

            return;
        }

        // ─────────────────────────────────────────────────────────
        // DISTANCE
        // ─────────────────────────────────────────────────────────
        //
        // O cliente só informa qual drop deseja coletar.
        // A posição do jogador e do drop são determinadas pelo servidor.
        // ─────────────────────────────────────────────────────────

        const pickupRange =
            64;

        const dx =
            player.x -
            drop.x;

        const dy =
            player.y -
            drop.y;

        const distanceSquared =
            dx * dx +
            dy * dy;

        if (
            distanceSquared >
            pickupRange * pickupRange
        ) {
            console.warn(
                `[WorldRoom] pickupDrop rejected: too far ` +
                `player=${player.name} ` +
                `drop=${dropId} ` +
                `distance=${Math.sqrt(distanceSquared).toFixed(1)} ` +
                `range=${pickupRange}`,
            );

            return;
        }

        // ─────────────────────────────────────────────────────────────
        // OWNERSHIP
        // ─────────────────────────────────────────────────────────────

        if (
            drop.ownershipExpiresAt > now &&
            drop.ownerId !== player.id
        ) {
            console.warn(
                `[WorldRoom] pickupDrop rejected: not owner ` +
                `player=${player.name} ` +
                `drop=${dropId}`,
            );

            return;
        }

        // ─────────────────────────────────────────────────────────────
        // PICKUP LOCK
        // ─────────────────────────────────────────────────────────────

        if (this.processingDropPickups.has(dropId)) {
            console.warn(
                `[WorldRoom] pickupDrop rejected: ` +
                `already processing ` +
                `drop=${dropId} ` +
                `player=${player.name}`,
            );

            return;
        }

        this.processingDropPickups.add(dropId);

        try {
            const added =
                await inventoryService.addItem(
                    player.characterId,
                    drop.itemId,
                    drop.quantity,
                );

            if (!added) {
                console.warn(
                    `[WorldRoom] pickupDrop failed: ` +
                    `inventory rejected item ` +
                    `${drop.itemName} (${drop.itemId}) ` +
                    `player=${player.name} ` +
                    `drop=${dropId}`,
                );

                return;
            }

            // ─────────────────────────────────────────────────────────────
            // SYNC INVENTORY
            // ─────────────────────────────────────────────────────────────

            const inventory =
                await inventoryService.getInventory(
                    player.characterId,
                );

            client.send("inventorySnapshot", {
                items: inventory,
            });

            console.log(
                `[WorldRoom] Inventory synchronized after pickup: ` +
                `player=${player.name} ` +
                `entries=${inventory.length}`,
            );

            // ─────────────────────────────────────────────────────────
            // REMOVE GROUND DROP
            // ─────────────────────────────────────────────────────────

            this.state.drops.delete(
                dropId,
            );

            console.log(
                `[WorldRoom] GroundDrop picked up: ` +
                `${drop.itemName} (${drop.itemId}) ` +
                `quantity=${drop.quantity} ` +
                `player=${player.name} ` +
                `drop=${dropId}`,
            );

            console.log(
                `[WorldRoom] GroundDrop deleted from state: ` +
                `drop=${dropId} ` +
                `exists=${this.state.drops.has(dropId)}`,
            );
        } finally {
            this.processingDropPickups.delete(
                dropId,
            );
        }
    }

    // ─────────────────────────────────────────────────────────────
    // ROOM CREATE
    // ─────────────────────────────────────────────────────────────

    async onCreate(_options: any) {
        this.setState(new WorldState());

        await gameDataService.initialize();

        const mapDef = MAP_DEFS[this.roomName];

        if (!mapDef) {
            console.error(
                `[WorldRoom] No MAP_DEFS found for map "${this.roomName}"`,
            );
        }

        // Spawn inicial dos mobs usando os dados importados do rAthena.
        this.spawnInitialMobs(mapDef);

        // ───────────────────────────────────────────────────────────
        // CLIENT -> SERVER: MOVEMENT
        // ───────────────────────────────────────────────────────────

        this.onMessage("move", (client, data) => {
            const player = this.state.players.get(client.sessionId);

            if (
                player &&
                typeof data?.x === "number" &&
                typeof data?.y === "number"
            ) {
                player.targetX = data.x;
                player.targetY = data.y;
            }
        });

        // ───────────────────────────────────────────────────────────
        // LEARN SKILL
        // ───────────────────────────────────────────────────────────

        this.onMessage("learnSkill", async (client, data) => {
            try {
                const player = this.state.players.get(client.sessionId);

                if (!player) {
                    client.send("skillLearnResult", {
                        success: false,
                        reason: "PLAYER_NOT_FOUND",
                    });
                    return;
                }

                const skillId = Number(data?.skillId);

                if (!Number.isInteger(skillId) || skillId <= 0) {
                    client.send("skillLearnResult", {
                        success: false,
                        reason: "INVALID_SKILL_ID",
                    });
                    return;
                }

                const result = await this.characterSkillService.learnSkill(
                    player.characterId,
                    skillId
                );

                // Mantém o estado Colyseus sincronizado com o banco.
                player.availableSkillPoints = result.availableSkillPoints;

                client.send("skillLearnResult", {
                    success: true,
                    skillId: result.skill.skillId,
                    level: result.skill.level,
                    availableSkillPoints: result.availableSkillPoints,
                });

                console.log(
                    `[WorldRoom] Skill learned: ` +
                    `character=${player.characterId} ` +
                    `name=${player.name} ` +
                    `skill=${result.skill.skillId} ` +
                    `level=${result.skill.level} ` +
                    `remainingPoints=${result.availableSkillPoints}`
                );
            } catch (error) {
                const reason =
                    error instanceof Error
                        ? error.message
                        : "UNKNOWN_ERROR";

                console.warn(
                    `[WorldRoom] Failed to learn skill: ` +
                    `session=${client.sessionId} ` +
                    `reason=${reason}`
                );

                client.send("skillLearnResult", {
                    success: false,
                    reason,
                });
            }
        });

        // ───────────────────────────────────────────────────────────
        // CLIENT -> SERVER: ATTACK
        // ───────────────────────────────────────────────────────────

        this.onMessage("attack", (client, data) => {
            const player = this.state.players.get(client.sessionId);

            if (
                player &&
                typeof data?.targetId === "string"
            ) {
                player.targetId = data.targetId;
            }
        });


        // ───────────────────────────────────────────────────────────
        // CLIENT -> SERVER: CLEAR TARGET
        // ───────────────────────────────────────────────────────────

        this.onMessage("clearTarget", (client) => {
            const player = this.state.players.get(client.sessionId);

            if (player) {
                player.targetId = "";
            }
        });

        // ───────────────────────────────────────────────────────────
        // CLIENT -> SERVER: PICKUP GROUND DROP
        // ───────────────────────────────────────────────────────────

        this.onMessage("pickupDrop", (client, data) => {
            this.handlePickupDrop(client, data);
        });

        // ───────────────────────────────────────────────────────────
        // CLIENT -> SERVER: TELEPORT
        // ───────────────────────────────────────────────────────────

        this.onMessage("teleport", (client, data) => {
            const player = this.state.players.get(client.sessionId);

            if (
                !player ||
                typeof data?.targetMap !== "string"
            ) {
                return;
            }

            const validPortal = mapDef?.portals.find(
                (portal) =>
                    portal.targetMap === data.targetMap,
            );

            if (!validPortal) {
                console.warn(
                    `[WorldRoom] Rejected teleport to "${data.targetMap}" from "${this.roomName}"`,
                );

                return;
            }

            // O client será responsável por sair desta room
            // e entrar na room do mapa de destino.
            client.send("teleportApproved", {
                targetMap: data.targetMap,
            });
        });

        this.onMessage(
            "useItem",
            async (
                client,
                data,
            ) => {
                try {
                    const player =
                        this.state.players.get(
                            client.sessionId,
                        );

                    if (!player) {
                        client.send(
                            "itemUseResult",
                            {
                                success: false,
                                reason: "PLAYER_NOT_FOUND",
                            },
                        );

                        return;
                    }

                    const inventoryId =
                        data?.inventoryId;

                    if (
                        typeof inventoryId !== "string" ||
                        !inventoryId
                    ) {
                        client.send(
                            "itemUseResult",
                            {
                                success: false,
                                reason: "INVALID_INVENTORY_ID",
                            },
                        );

                        return;
                    }

                    const result =
                        await itemUseService.useItem(
                            player,
                            inventoryId,
                            () => this.recalculatePlayerStats(player),
                        );

                    if (!result.success) {
                        client.send(
                            "itemUseResult",
                            result,
                        );

                        return;
                    }

                    const inventory =
                        await inventoryService.getInventory(
                            player.characterId,
                        );

                    client.send(
                        "inventorySnapshot",
                        {
                            items: inventory,
                        },
                    );

                    client.send(
                        "itemUseResult",
                        result,
                    );
                } catch (error) {
                    console.error(
                        "[WorldRoom] useItem error:",
                        error,
                    );

                    client.send(
                        "itemUseResult",
                        {
                            success: false,
                            reason: "INTERNAL_ERROR",
                        },
                    );
                }
            });

                // ───────────────────────────────────────────────────────────
                // CLIENT -> SERVER: EQUIP ITEM
                // ───────────────────────────────────────────────────────────

                this.onMessage(
                    "equipItem",
                    async (client, data) => {
                        try {
                            const player =
                                this.state.players.get(
                                    client.sessionId,
                                );

                            if (!player) {
                                client.send(
                                    "equipmentResult",
                                    {
                                        success: false,
                                        reason: "PLAYER_NOT_FOUND",
                                    },
                                );

                                return;
                            }

                            const inventoryId =
                                data?.inventoryId;

                            if (
                                typeof inventoryId !== "string" ||
                                !inventoryId
                            ) {
                                client.send(
                                    "equipmentResult",
                                    {
                                        success: false,
                                        reason: "INVALID_INVENTORY_ID",
                                    },
                                );

                                return;
                            }

                            const equipment =
                                await equipmentService.equipItem(
                                    player.characterId,
                                    inventoryId,
                                );

                            // Equipamento altera stats derivados e ASPD.
                            await this.recalculatePlayerStats(
                                player,
                            );

                            client.send(
                                "equipmentSnapshot",
                                {
                                    items: equipment,
                                },
                            );

                            const inventory =
                                await inventoryService.getInventory(
                                    player.characterId,
                                );

                            client.send(
                                "inventorySnapshot",
                                {
                                    items: inventory,
                                },
                            );

                            client.send(
                                "equipmentResult",
                                {
                                    success: true,
                                },
                            );

                            console.log(
                                `[WorldRoom] Item equipped: ` +
                                `player=${player.name} ` +
                                `inventoryId=${inventoryId}`,
                            );
                        } catch (error) {
                            const reason =
                                error instanceof Error
                                    ? error.message
                                    : "UNKNOWN_ERROR";

                            console.warn(
                                `[WorldRoom] Failed to equip item: ` +
                                `session=${client.sessionId} ` +
                                `reason=${reason}`,
                            );

                            client.send(
                                "equipmentResult",
                                {
                                    success: false,
                                    reason,
                                },
                            );
                        }
                    },
                );


                // ───────────────────────────────────────────────────────────
                // CLIENT -> SERVER: UNEQUIP ITEM
                // ───────────────────────────────────────────────────────────

                this.onMessage(
                    "unequipItem",
                    async (client, data) => {
                        try {
                            const player =
                                this.state.players.get(
                                    client.sessionId,
                                );

                            if (!player) {
                                client.send(
                                    "equipmentResult",
                                    {
                                        success: false,
                                        reason: "PLAYER_NOT_FOUND",
                                    },
                                );

                                return;
                            }

                            const slot =
                                data?.slot;

                            if (
                                typeof slot !== "string" ||
                                !slot
                            ) {
                                client.send(
                                    "equipmentResult",
                                    {
                                        success: false,
                                        reason: "INVALID_EQUIPMENT_SLOT",
                                    },
                                );

                                return;
                            }

                            const equipment =
                                await equipmentService.unequipItem(
                                    player.characterId,
                                    slot,
                                );

                            // Remover equipamento também altera stats/ASPD.
                            await this.recalculatePlayerStats(
                                player,
                            );

                            client.send(
                                "equipmentSnapshot",
                                {
                                    items: equipment,
                                },
                            );

                            client.send(
                                "equipmentResult",
                                {
                                    success: true,
                                },
                            );

                            console.log(
                                `[WorldRoom] Item unequipped: ` +
                                `player=${player.name} ` +
                                `slot=${slot}`,
                            );
                        } catch (error) {
                            const reason =
                                error instanceof Error
                                    ? error.message
                                    : "UNKNOWN_ERROR";

                            console.warn(
                                `[WorldRoom] Failed to unequip item: ` +
                                `session=${client.sessionId} ` +
                                `reason=${reason}`,
                            );

                            client.send(
                                "equipmentResult",
                                {
                                    success: false,
                                    reason,
                                },
                            );
                        }
                    },
                );

        // ───────────────────────────────────────────────────────────
        // CLIENT -> SERVER: DISTRIBUTE STAT
        // ───────────────────────────────────────────────────────────

        this.onMessage("distributeStat", async (client, data) => {
            const player =
                this.state.players.get(
                    client.sessionId,
                );

            if (!player) {
                return;
            }

            // ─────────────────────────────────────────────────────
            // VALIDATION
            // ─────────────────────────────────────────────────────

            const validStats: StatKey[] = [
                "str",
                "agi",
                "vit",
                "int",
                "dex",
                "luk",
            ];

            if (
                typeof data?.stat !== "string" ||
                !validStats.includes(
                    data.stat as StatKey,
                )
            ) {
                client.send("statDistributionResult", {
                    success: false,
                    error: "Atributo inválido.",
                });

                return;
            }

            const amount =
                data?.amount ?? 1;

            if (
                !Number.isInteger(amount) ||
                amount <= 0 ||
                amount > 100
            ) {
                client.send("statDistributionResult", {
                    success: false,
                    error: "Quantidade inválida.",
                });

                return;
            }

            const stat =
                data.stat as StatKey;

            try {
                // ─────────────────────────────────────────────────
                // CURRENT STATS
                // ─────────────────────────────────────────────────

                const currentStats = {
                    str: player.str,
                    agi: player.agi,
                    vit: player.vit,
                    int: player.int,
                    dex: player.dex,
                    luk: player.luk,
                };

                // ─────────────────────────────────────────────────
                // CALCULATE / VALIDATE COST
                // ─────────────────────────────────────────────────

                const result =
                    this.statSystem.increaseStat(
                        currentStats,
                        player.availablePoints,
                        stat,
                        amount,
                    );

                // ─────────────────────────────────────────────────
                // UPDATE RUNTIME PLAYER
                // ─────────────────────────────────────────────────

                player.str =
                    result.stats.str;

                player.agi =
                    result.stats.agi;

                player.vit =
                    result.stats.vit;

                player.int =
                    result.stats.int;

                player.dex =
                    result.stats.dex;

                player.luk =
                    result.stats.luk;

                player.availablePoints =
                    result.availablePoints;

                // ─────────────────────────────────────────────────
                // RECALCULATE DERIVED STATS
                // ─────────────────────────────────────────────────

                await this.recalculatePlayerStats(
                    player,
                );

                // ─────────────────────────────────────────────────
                // PERSIST DATABASE
                // ─────────────────────────────────────────────────

                await prisma.character.update({
                    where: {
                        id: player.characterId,
                    },

                    data: {
                        str: player.str,
                        agi: player.agi,
                        vit: player.vit,
                        int: player.int,
                        dex: player.dex,
                        luk: player.luk,

                        availablePoints:
                            player.availablePoints,

                        hp:
                            player.hp,

                        maxHp:
                            player.maxHp,

                        mp:
                            player.mp,

                        maxMp:
                            player.maxMp,
                    },
                });

                // ─────────────────────────────────────────────────
                // RESULT
                // ─────────────────────────────────────────────────

                client.send(
                    "statDistributionResult",
                    {
                        success: true,

                        stat,

                        amount,

                        cost:
                            result.cost,

                        availablePoints:
                            player.availablePoints,

                        stats: {
                            str:
                                player.str,

                            agi:
                                player.agi,

                            vit:
                                player.vit,

                            int:
                                player.int,

                            dex:
                                player.dex,

                            luk:
                                player.luk,
                        },

                        derived: {
                            maxHp:
                                player.maxHp,

                            maxMp:
                                player.maxMp,

                            atk:
                                player.atk,

                            matk:
                                player.matk,

                            def:
                                player.def,

                            magicDefense:
                                player.magicDefense,

                            hit:
                                player.hit,

                            flee:
                                player.flee,

                            crit:
                                player.crit,
                        },
                    },
                );

                console.log(
                    `[WorldRoom] ${player.name} distributed ` +
                    `${amount} point(s) into ${stat}. ` +
                    `Cost: ${result.cost} | ` +
                    `Remaining: ${player.availablePoints}`,
                );
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Failed to distribute stat.";

                client.send(
                    "statDistributionResult",
                    {
                        success: false,
                        error: message,
                    },
                );
            }
        });

        // ───────────────────────────────────────────────────────────
        // GROUND DROP CLEANUP
        // ───────────────────────────────────────────────────────────

        this.clock.setInterval(() => {
            this.cleanupExpiredDrops();
        }, 1000);

        

        // ───────────────────────────────────────────────────────────
        // GAME LOOP
        // ───────────────────────────────────────────────────────────

        this.setSimulationInterval(
            (deltaTime) =>
                this.updateLoop(deltaTime),
            50,
        );

        console.log(
            "[WorldRoom] Created and running simulation tick.",
        );
    }

    // ─────────────────────────────────────────────────────────────
    // STAT SYSTEM
    // ─────────────────────────────────────────────────────────────

    /**
     * Recalcula todos os atributos derivados do jogador.
     *
     * Os atributos base são:
     *
     * STR
     * AGI
     * VIT
     * INT
     * DEX
     * LUK
     *
     * O StatSystem transforma esses valores em:
     *
     * HP
     * MP
     * ATK
     * MATK
     * DEF
     * MDEF
     * HIT
     * FLEE
     * CRIT
     *
     * As fórmulas atuais do StatSystem ainda são provisórias.
     * Posteriormente serão substituídas pelas fórmulas definitivas
     * baseadas no rAthena.
     */
    private async recalculatePlayerStats(
        player: Player,
    ): Promise<void> {
        if (!player.characterId) {
            return;
        }

        const statusModifiers =
            statusService.getStatModifiers(
                player.characterId,
            );

        const equipmentModifiers =
            await equipmentService.getStatModifiers(
                player.characterId,
            );

        const modifiers = {
            ...statusModifiers,

            defense:
                (statusModifiers.defense ?? 0) +
                equipmentModifiers.armorDef,
        };

        const derived =
            this.statSystem.calculateDerivedStats(
                {
                    str: player.str,
                    agi: player.agi,
                    vit: player.vit,
                    int: player.int,
                    dex: player.dex,
                    luk: player.luk,
                },
                player.level,
                modifiers,
            );

        const oldMaxHp =
            player.maxHp;

        const oldMaxMp =
            player.maxMp;

        // ─────────────────────────────────────────────────────────
        // DERIVED COMBAT STATS
        // ─────────────────────────────────────────────────────────

        player.maxHp =
            derived.maxHp;

        player.maxMp =
            derived.maxMp;

        player.atk =
            derived.atk;

        player.matk =
            derived.matk;

        player.def =
            derived.def1 + derived.def2;

        player.magicDefense =
            derived.mdef1 + derived.mdef2;

        player.hit =
            derived.hit;

        player.flee =
            derived.flee;

        player.crit =
            derived.crit;

        // ─────────────────────────────────────────────────────────
        // ASPD
        // ─────────────────────────────────────────────────────────
        //
        // Temporariamente usamos Fist porque o sistema de
        // CharacterEquipment ainda não participa do cálculo.
        //
        // Posteriormente:
        //
        // equipamento → WeaponType → ClassAspd
        //
        // será utilizado aqui.

        const combatModifiers =
            statusService.getCombatModifiers(player.characterId);

        const equipment =
            await equipmentService.getEquipment(player.characterId);

        const weapon =
            equipment.find(
                (e) =>
                    e.item.type === "Weapon" &&
                    e.slot === "Right_Hand",
            ) ??
            equipment.find(
                (e) =>
                    e.item.type === "Weapon" &&
                    e.slot === "Both_Hand",
            ) ??
            equipment.find(
                (e) =>
                    e.item.type === "Weapon" &&
                    e.slot === "Left_Hand",
            );

        const weaponType =
            weapon?.item.subType ?? "Fist";

        const baseASPD =
            await this.statSystem.getBaseASPD(
                player.jobKey,
                weaponType,
            );

        player.aspd =
            this.statSystem.calculateASPD(
                baseASPD,
                player.agi,
                player.dex,
                combatModifiers.aspdFixedBonus,
            );

        // ─────────────────────────────────────────────────────────
        // CURRENT HP
        // ─────────────────────────────────────────────────────────
        //
        // Se estava com HP cheio antes do recálculo,
        // acompanha o novo máximo.
        //
        // Caso contrário, mantém o HP atual,
        // limitado ao novo máximo.

        if (player.hp >= oldMaxHp) {
            player.hp =
                player.maxHp;
        } else {
            player.hp =
                Math.min(
                    player.hp,
                    player.maxHp,
                );
        }

        // ─────────────────────────────────────────────────────────
        // CURRENT MP
        // ─────────────────────────────────────────────────────────

        if (player.mp >= oldMaxMp) {
            player.mp =
                player.maxMp;
        } else {
            player.mp =
                Math.min(
                    player.mp,
                    player.maxMp,
                );
        }

        console.log(
            `[WorldRoom] Stats recalculated: ${player.characterId}`,
            {
                str: player.str,
                agi: player.agi,
                vit: player.vit,
                int: player.int,
                dex: player.dex,
                luk: player.luk,

                atk: player.atk,
                matk: player.matk,

                def1: derived.def1,
                def2: derived.def2,
                mdef1: derived.mdef1,
                mdef2: derived.mdef2,

                maxHp: player.maxHp,
                maxMp: player.maxMp,

                hit: player.hit,
                flee: player.flee,
                crit: player.crit,

                baseASPD,
                aspdFixedBonus:
                    combatModifiers.aspdFixedBonus,
                aspd: player.aspd,
            },
        );
    }

    // ─────────────────────────────────────────────────────────────
    // EXP CURVE
    // ─────────────────────────────────────────────────────────────

    /**
     * Temporário.
     *
     * Atualmente a curva de EXP do protótipo é:
     *
     * Lv 1 -> 100
     * Lv 2 -> 150
     * Lv 3 -> 225
     * Lv 4 -> 337
     * ...
     *
     * Posteriormente devemos substituir isso por uma tabela
     * importada do rAthena, assim como fizemos com statpoint.yml.
     */
    private calculateBaseExpRequired(
        level: number,
    ): number {
        if (level <= 1) {
            return 100;
        }

        let exp = 100;

        for (
            let i = 1;
            i < level;
            i++
        ) {
            exp =
                Math.floor(
                    exp * 1.5,
                );
        }

        return exp;
    }

    // ─────────────────────────────────────────────────────────────
    // MOB SPAWN
    // ─────────────────────────────────────────────────────────────

    private spawnInitialMobs(
        mapDef?: {
            mobDbIds: number[];
            mobCount: number;
        },
    ) {
        const mobDbIds =
            mapDef?.mobDbIds ??
            [
                1001,
                1002,
                1004,
                1005,
            ];

        const count =
            mapDef?.mobCount ?? 15;

        for (
            let i = 0;
            i < count;
            i++
        ) {
            const dbId =
                mobDbIds[
                    i % mobDbIds.length
                ];

            const rMob =
                gameDataService.getMob(dbId);

            const mob =
                new Mob();

            mob.id =
                `mob_${ ++this.mobCounter }`;

            mob.mobDbId =
                dbId;

            mob.name =
                rMob
                    ? rMob.name
                    : "Skeleton Grunt";

            mob.level =
                rMob
                    ? rMob.level
                    : 5;

            mob.hp =
                rMob
                    ? rMob.hp
                    : 80;

            mob.maxHp =
                rMob
                    ? rMob.hp
                    : 80;

            mob.atk =
                rMob
                    ? rMob.attack
                    : 15;

            mob.atk2 =
                rMob
                    ? rMob.attack2
                    : 15;

            mob.def =
                rMob
                    ? rMob.defense
                    : 5;

            mob.magicDefense =
                rMob
                    ? rMob.magicDefense
                    : 0;

            mob.str =
                rMob
                    ? rMob.str
                    : 1;

            mob.agi =
                rMob
                    ? rMob.agi
                    : 1;

            mob.vit =
                rMob
                    ? rMob.vit
                    : 1;

            mob.int =
                rMob
                    ? rMob.int
                    : 1;

            mob.dex =
                rMob
                    ? rMob.dex
                    : 1;

            mob.luk =
                rMob
                    ? rMob.luk
                    : 1;

            mob.exp =
                rMob
                    ? rMob.baseExp || 40
                    : 40;

            mob.jobExp =
                rMob
                    ? rMob.jobExp || 0
                    : 0;

            mob.x =
                Math.floor(
                    Math.random() *
                        800 +
                        100,
                );

            mob.y =
                Math.floor(
                    Math.random() *
                        800 +
                        100,
                );

            mob.targetX =
                mob.x;

            mob.targetY =
                mob.y;

            mob.spriteKey =
                "skeleton";

            this.state.mobs.set(
                mob.id,
                mob,
            );
        }

        console.log(
            `[WorldRoom] Spawned ${ count } mobs in "${this.roomName}".`,
        );
    }

    // ─────────────────────────────────────────────────────────────
    // GAME LOOP
    // ─────────────────────────────────────────────────────────────

    private updateLoop(
        _deltaTime: number,
    ) {
        const now =
            Date.now();

        const expiredStatuses =
            statusService.update(now);

        if (expiredStatuses.length > 0) {
            for (const player of this.state.players.values()) {
                if (!player.characterId) {
                    continue;
                }

                const hasExpiredStatus =
                    expiredStatuses.some(
                        (entry) =>
                            entry.startsWith(
                                `${player.characterId}:`,
                            ),
                    );

                if (!hasExpiredStatus) {
                    continue;
                }

                void this.recalculatePlayerStats(player);
            }
        }

        // ───────────────────────────────────────────────────────────
        // 1. PLAYERS
        // ───────────────────────────────────────────────────────────

        this.state.players.forEach(
            (player, sessionId) => {
                // ───────────────────────────────────────────────────────
                // Movement
                // ───────────────────────────────────────────────────────

                const pdx =
                    player.targetX -
                    player.x;

                const pdy =
                    player.targetY -
                    player.y;

                const dist =
                    Math.hypot(
                        pdx,
                        pdy,
                    );

                if (dist > 4) {
                    const combatModifiers =
                        statusService.getCombatModifiers(
                            player.characterId,
                        );

                    const moveSpeed =
                        3.5 *
                        (
                            1 +
                            combatModifiers.moveSpeedRate / 100
                        );

                    player.x +=
                        (pdx / dist) *
                        Math.min(
                            dist,
                            moveSpeed,
                        );

                    player.y +=
                        (pdy / dist) *
                        Math.min(
                            dist,
                            moveSpeed,
                        );
                }

                // ───────────────────────────────────────────────────────
                // Auto Attack
                // ───────────────────────────────────────────────────────

                if (!player.targetId) {
                    return;
                }

                const targetMob =
                    this.state.mobs.get(
                        player.targetId,
                    );

                if (
                    !targetMob ||
                    targetMob.isDead
                ) {
                    player.targetId =
                        "";

                    return;
                }

                const mDist =
                    Math.hypot(
                        targetMob.x -
                            player.x,
                        targetMob.y -
                            player.y,
                    );

                const attackRange =
                    40;

                if (
                    mDist >
                    attackRange
                ) {
                    // Move toward target.
                    player.targetX =
                        targetMob.x;

                    player.targetY =
                        targetMob.y;

                    return;
                }

                // ───────────────────────────────────────────────────────
                // ASPD
                // ───────────────────────────────────────────────────────

                const lastAttack =
                    this.playerAttackTimers.get(
                        sessionId,
                    ) ?? 0;

                if (
                    now -
                        lastAttack >=
                    player.aspd
                ) {
                    this.playerAttackTimers.set(
                        sessionId,
                        now,
                    );

                    void this.processPlayerAttack(
                        player,
                        targetMob,
                        sessionId,
                    );
                }
            },
        );

        // ───────────────────────────────────────────────────────────
        // 2. MOBS
        // ───────────────────────────────────────────────────────────

        this.state.mobs.forEach(
            (mob) => {
                if (mob.isDead) {
                    return;
                }

                // ───────────────────────────────────────────────────────
                // Random Wander
                // ───────────────────────────────────────────────────────

                if (
                    Math.random() <
                        0.02 &&
                    !mob.targetId
                ) {
                    mob.targetX =
                        Math.max(
                            60,
                            Math.min(
                                1200,
                                mob.x +
                                    (Math.random() *
                                        200 -
                                        100),
                            ),
                        );

                    mob.targetY =
                        Math.max(
                            60,
                            Math.min(
                                1200,
                                mob.y +
                                    (Math.random() *
                                        200 -
                                        100),
                            ),
                        );
                }

                // ───────────────────────────────────────────────────────
                // Movement
                // ───────────────────────────────────────────────────────

                const mdx =
                    mob.targetX -
                    mob.x;

                const mdy =
                    mob.targetY -
                    mob.y;

                const mDist =
                    Math.hypot(
                        mdx,
                        mdy,
                    );

                if (mDist > 4) {
                    mob.x +=
                        (mdx / mDist) *
                        Math.min(
                            mDist,
                            1.5,
                        );

                    mob.y +=
                        (mdy / mDist) *
                        Math.min(
                            mDist,
                            1.5,
                        );
                }

                // ───────────────────────────────────────────────────────
                // Aggro
                // ───────────────────────────────────────────────────────

                if (!mob.targetId) {
                    let nearestPlayer:
                        Player | undefined;

                    let nearestDistance =
                        Infinity;

                    this.state.players.forEach(
                        (player) => {
                            const distance =
                                Math.hypot(
                                    player.x -
                                        mob.x,
                                    player.y -
                                        mob.y,
                                );

                            if (
                                distance <
                                    150 &&
                                distance <
                                    nearestDistance
                            ) {
                                nearestDistance =
                                    distance;

                                nearestPlayer =
                                    player;
                            }
                        },
                    );

                    if (nearestPlayer) {
                        // Encontramos o sessionId
                        // correspondente ao player.
                        this.state.players.forEach(
                            (
                                player,
                                sessionId,
                            ) => {
                                if (
                                    player ===
                                    nearestPlayer
                                ) {
                                    mob.targetId =
                                        sessionId;
                                }
                            },
                        );
                    }
                } else {
                    const targetPlayer =
                        this.state.players.get(
                            mob.targetId,
                        );

                    if (!targetPlayer) {
                        mob.targetId =
                            "";

                        return;
                    }

                    const pDist =
                        Math.hypot(
                            targetPlayer.x -
                                mob.x,
                            targetPlayer.y -
                                mob.y,
                        );

                    // Target perdeu aggro.
                    if (pDist > 250) {
                        mob.targetId =
                            "";

                        return;
                    }

                    // ─────────────────────────────────────────────────────
                    // Mob Attack
                    // ─────────────────────────────────────────────────────

                    if (
                        pDist <=
                        40
                    ) {
                        const lastMobAttack =
                            this.mobAttackTimers.get(
                                mob.id,
                            ) ?? 0;

                        if (
                            now -
                                lastMobAttack >=
                            1500
                        ) {
                            this.mobAttackTimers.set(
                                mob.id,
                                now,
                            );

                            this.processMobAttack(
                                mob,
                                targetPlayer,
                            );
                        }
                    } else {
                        mob.targetX =
                            targetPlayer.x;

                        mob.targetY =
                            targetPlayer.y;
                    }
                }
            },
        );
    }

    // ─────────────────────────────────────────────────────────────
    // PLAYER ATTACK
    // ─────────────────────────────────────────────────────────────

    private async processPlayerAttack(
        player: Player,
        mob: Mob,
        _sessionId: string,
    ) {
        // ───────────────────────────────────────────────────────────
        // COMBAT SNAPSHOTS
        // ───────────────────────────────────────────────────────────

        const playerSnapshot =
            await this.combatStateBuilder.buildPlayerSnapshot({
                id:
                    player.characterId,

                name:
                    player.name,

                jobKey:
                    player.jobKey,

                level:
                    player.level,

                str:
                    player.str,

                agi:
                    player.agi,

                vit:
                    player.vit,

                int:
                    player.int,

                dex:
                    player.dex,

                luk:
                    player.luk,
            });

        const mobData =
            gameDataService.getMob(
                mob.mobDbId,
            );

        if (!mobData) {
            console.warn(
                `[WorldRoom] Player attack rejected: ` +
                `mob data not found ` +
                `mobDbId=${mob.mobDbId} ` +
                `mob=${mob.name}`,
            );

            return;
        }

        const mobSnapshot =
            this.combatStateBuilder.buildMobSnapshot(
                mobData,
            );

        // ───────────────────────────────────────────────────────────
        // CRITICAL
        // ───────────────────────────────────────────────────────────

        const isCrit =
            Math.random() *
            100 <
            playerSnapshot.combatStats.crit;

        // ───────────────────────────────────────────────────────────
        // HIT / FLEE
        // ───────────────────────────────────────────────────────────

        const hitRate =
            playerSnapshot.combatStats.hit;

        const fleeRate =
            mobSnapshot.stats.flee;

        const finalHitRate =
            Math.min(
                95,
                Math.max(
                    5,
                    hitRate -
                    fleeRate +
                    80,
                ),
            );

        // ───────────────────────────────────────────────────────────
        // HIT ROLL
        // ───────────────────────────────────────────────────────────

        if (
            Math.random() *
            100 >
            finalHitRate &&
            !isCrit
        ) {
            this.broadcast(
                "combatLog",
                {
                    attacker:
                        player.name,

                    target:
                        mob.name,

                    type:
                        "miss",

                    damage:
                        0,

                    x:
                        mob.x,

                    y:
                        mob.y,
                },
            );

            return;
        }

        // ───────────────────────────────────────────────────────────
        // ATTACK COMPONENTS
        // ───────────────────────────────────────────────────────────
        //
        // Os valores aleatórios são gerados pelo servidor.
        // O cliente não participa do cálculo.
        //

        const components =
            resolveBasicAttackComponents(
                playerSnapshot,
                {
                    targetSize:
                        mobSnapshot.size,

                    randomValue:
                        Math.random(),

                    overRefineRandomValue:
                        Math.random(),
                },
            );

        // ───────────────────────────────────────────────────────────
        // DAMAGE
        // ───────────────────────────────────────────────────────────
        //
        // Ataque básico:
        //
        // skillRatio = 100
        // skillConstant = 0
        // skillId = 0
        // usesAmmo = false
        //

        const damageResult =
            combatSystem.performWeaponAttack({
                attacker:
                    playerSnapshot,
                target:
                    mobSnapshot,
                components,
                attackElement:
                    resolveEffectiveAttackElement(
                        playerSnapshot.weapon?.element ?? "Neutral",
                        {},
                    ),
                targetElement:
                    mobSnapshot.element as RathenaElement,
                targetElementLevel:
                    mobSnapshot.elementLevel,
                skillRatio:
                    100,
                skillConstant:
                    0,
                skillId:
                    0,
                isCritical:
                    isCrit,
                usesAmmo:
                    false,
            });

        const finalDamage =
            damageResult.damage;

        // ───────────────────────────────────────────────────────────
        // APPLY DAMAGE
        // ───────────────────────────────────────────────────────────

        mob.hp =
            Math.max(
                0,
                mob.hp -
                finalDamage,
            );

        this.broadcast(
            "damage",
            {
                targetId:
                    mob.id,

                damage:
                    finalDamage,

                isCrit,

                x:
                    mob.x,

                y:
                    mob.y,

                targetType:
                    "mob",
            },
        );

        this.broadcast(
            "combatLog",
            {
                text:
                    `${player.name} causou ${finalDamage} ` +
                    `${isCrit ? "CRÍTICO " : ""} ` +
                    `de dano em ${mob.name} !`,

                color:
                    isCrit
                        ? "#ffcc00"
                        : "#ffffff",
            },
        );

        // ─────────────────────────────────────────────────────────────
        // MOB DEATH
        // ─────────────────────────────────────────────────────────────

        if (
            mob.hp <= 0
        ) {
            mob.isDead =
                true;

            mob.targetId =
                "";

            player.targetId =
                "";

            // ─────────────────────────────────────────────────────────
            // DROPS
            // ─────────────────────────────────────────────────────────

            const rolledDrops =
                dropService.rollDrops(
                    mob.mobDbId,
                );

            for (const drop of rolledDrops) {
                const item =
                    gameDataService.getItem(
                        drop.itemId,
                    );

                if (!item) {
                    console.warn(
                        `[WorldRoom] Drop item not found: ` +
                        `mob=${mob.mobDbId} ` +
                        `item=${drop.itemId} ` +
                        `source=${drop.sourceKey ?? "unknown"}`,
                    );

                    continue;
                }

                console.log(
                    `[WorldRoom] Drop rolled: ` +
                    `mob=${mob.name} (${mob.mobDbId}) ` +
                    `item=${item.name} (${item.id}) ` +
                    `rate=${drop.rate} ` +
                    `source=${drop.sourceKey ?? "unknown"}`,
                );

                this.spawnGroundDrop(
                    item.id,
                    item.name,
                    1,
                    mob.x,
                    mob.y,
                    player.id,
                );

                this.broadcast(
                    "combatLog",
                    {
                        text:
                            `${mob.name} dropou ${item.name}!`,

                        color:
                            "#ffcc00",
                    },
                );
            }

            // ─────────────────────────────────────────────────────────
            // EXP
            // ─────────────────────────────────────────────────────────

            const expGained =
                mob.exp;

            player.baseExp +=
                expGained;

            this.broadcast(
                "combatLog",
                {
                    text:
                        `Derrotou ${mob.name} ! ` +
                        `Ganhou ${expGained} Base EXP.`,

                    color:
                        "#00ffaa",
                },
            );

            const jobExpGained =
                mob.jobExp;

            if (
                jobExpGained > 0
            ) {
                const jobResult =
                    await this.jobProgressionService.gainJobExp(
                        player.characterId,
                        BigInt(jobExpGained),
                    );

                player.jobLevel =
                    jobResult.jobLevel;

                player.jobExp =
                    Number(
                        jobResult.jobExp,
                    );

                player.availableSkillPoints =
                    jobResult.availableSkillPoints;

                this.broadcast(
                    "combatLog",
                    {
                        text:
                            `Ganhou ${jobExpGained} Job EXP.`,

                        color:
                            "#66ccff",
                    },
                );

                if (
                    jobResult.jobLevelUps > 0
                ) {
                    this.broadcast(
                        "combatLog",
                        {
                            text:
                                `${player.name} SUBIU ` +
                                `PARA O JOB LEVEL ` +
                                `${player.jobLevel} ! ` +
                                `+${jobResult.jobLevelUps} ` +
                                `ponto de skill.`,

                            color:
                                "#ffbb00",
                        },
                    );
                }
            }

            // ─────────────────────────────────────────────────────────
            // LEVEL UP
            // ─────────────────────────────────────────────────────────

            while (
                player.baseExp >=
                player.maxBaseExp
            ) {
                const previousLevel =
                    player.level;

                player.baseExp -=
                    player.maxBaseExp;

                player.level +=
                    1;

                const pointsGained =
                    await this.statSystem.getLevelUpPoints(
                        previousLevel,
                    );

                player.availablePoints +=
                    pointsGained;

                player.maxBaseExp =
                    this.calculateBaseExpRequired(
                        player.level,
                    );

                this.broadcast(
                    "combatLog",
                    {
                        text:
                            `${player.name} SUBIU PARA ` +
                            `O NÍVEL ${player.level} ! ` +
                            `+ ${pointsGained} pontos de atributo.`,

                        color:
                            "#ffbb00",
                    },
                );

                this.broadcast(
                    "levelUp",
                    {
                        level:
                            player.level,

                        availablePoints:
                            player.availablePoints,

                        stats: {
                            str:
                                player.str,

                            agi:
                                player.agi,

                            vit:
                                player.vit,

                            int:
                                player.int,

                            dex:
                                player.dex,

                            luk:
                                player.luk,
                        },
                    },
                );
            }

            // ─────────────────────────────────────────────────────────
            // MOB RESPAWN
            // ─────────────────────────────────────────────────────────

            setTimeout(
                () => {
                    if (
                        this.state.mobs.has(
                            mob.id,
                        )
                    ) {
                        mob.hp =
                            mob.maxHp;

                        mob.isDead =
                            false;

                        mob.targetId =
                            "";

                        mob.x =
                            Math.floor(
                                Math.random() *
                                800 +
                                100,
                            );

                        mob.y =
                            Math.floor(
                                Math.random() *
                                800 +
                                100,
                            );

                        mob.targetX =
                            mob.x;

                        mob.targetY =
                            mob.y;
                    }
                },
                10000,
            );
        }
    }

    // ─────────────────────────────────────────────────────────────
    // MOB ATTACK
    // ─────────────────────────────────────────────────────────────

    private processMobAttack(
        mob: Mob,
        player: Player,
    ) {
        const rawAtk =
            mob.atk;

        const playerDef =
            calcDef(
                player.vit,
                player.def,
            );

        const damage =
            Math.max(
                1,
                rawAtk -
                    playerDef,
            );

        player.hp =
            Math.max(
                0,
                player.hp -
                    damage,
            );

        this.broadcast(
            "damage",
            {
                targetId:
                    player.id,

                damage,

                isCrit:
                    false,

                x:
                    player.x,

                y:
                    player.y,

                targetType:
                    "player",
            },
        );

        this.broadcast(
            "combatLog",
            {
                text:
                    `${ mob.name } causou ${ damage } ` +
                    `de dano em ${ player.name } !`,

                color:
                    "#ff4444",
            },
        );

        // ───────────────────────────────────────────────────────────
        // PLAYER DEATH
        // ───────────────────────────────────────────────────────────

        if (
            player.hp <= 0
        ) {
            this.broadcast(
                "combatLog",
                {
                    text:
                        `${ player.name } foi derrotado ` +
                        `por ${ mob.name } !`,

                    color:
                        "#ff0000",
                },
            );

            // Temporário:
            // posteriormente teremos DeathSystem,
            // respawn, perda de EXP, estado morto etc.

            player.hp =
                player.maxHp;

            player.x =
                200;

            player.y =
                200;

            player.targetX =
                200;

            player.targetY =
                200;

            player.targetId =
                "";
        }
    }

    // ─────────────────────────────────────────────────────────────
    // PLAYER JOIN
    // ─────────────────────────────────────────────────────────────

    async onJoin(
        client: Client,
        options: any,
    ) {
        // IMPORTANTE:
        // Não imprimir `options` inteiro porque ele contém
        // o JWT de autenticação.
        console.log(
            client.sessionId,
            "joining world with characterId:",
            options?.characterId,
        );

        if (
            !options?.characterId
        ) {
            client.leave();
            return;
        }

        try {
            // ─────────────────────────────────────────────────────────
            // LOAD CHARACTER
            // ─────────────────────────────────────────────────────────

            const char =
                await prisma.character.findUnique(
                    {
                        where:
                        {
                            id:
                                options.characterId,
                        },
                    },
                );

            if (!char) {
                console.warn(
                    `[WorldRoom] Character not found: ${ options.characterId } `,
                );

                client.leave();
                return;
            }

            // ─────────────────────────────────────────────────────────
            // SPAWN
            // ─────────────────────────────────────────────────────────

            const mapDef =
                MAP_DEFS[
                    this.roomName
                ];

            const cameFromSameMap =
                char.mapId ===
                this.roomName;

            const spawn =
                cameFromSameMap &&
                mapDef
                    ? {
                        x:
                            char.posX,

                        y:
                            char.posY,
                    }
                    : (
                        mapDef?.defaultSpawn ??
                        {
                            x:
                                200,

                            y:
                                200,
                        }
                    );

            // ─────────────────────────────────────────────────────────
            // CREATE RUNTIME PLAYER
            // ─────────────────────────────────────────────────────────

            const player =
                new Player();

            player.id = client.sessionId;
            player.characterId = char.id;
            player.name = char.name;
            player.class = char.classKey;
            player.jobKey = char.jobKey;
            player.faction = char.faction;

            // ─────────────────────────────────────────────────────────
            // LEVEL / JOB / EXP
            // ─────────────────────────────────────────────────────────

            player.level =
                char.level;

            player.jobLevel =
                char.jobLevel;

            player.baseExp =
                Number(
                    char.baseExp,
                );

            player.jobExp =
                Number(
                    char.jobExp,
                );

            player.maxBaseExp =
                this.calculateBaseExpRequired(
                    player.level,
                );

            // ─────────────────────────────────────────────────────────
            // BASE ATTRIBUTES
            // ─────────────────────────────────────────────────────────

            player.str =
                char.str;

            player.agi =
                char.agi;

            player.vit =
                char.vit;

            player.int =
                char.int;

            player.dex =
                char.dex;

            player.luk =
                char.luk;

            // ─────────────────────────────────────────────────────────
            // AVAILABLE POINTS
            // ─────────────────────────────────────────────────────────

            player.availablePoints =
                char.availablePoints;

            player.availableSkillPoints =
                char.availableSkillPoints;

            // ─────────────────────────────────────────────────────────
            // DERIVED STATS
            // ─────────────────────────────────────────────────────────
            //
            // Os valores abaixo são calculados pelo StatSystem.
            //
            // Não carregamos maxHp/maxMp/ATK/DEF do banco como fonte
            // de verdade porque são atributos derivados.

            await this.recalculatePlayerStats(
                player,
            );

            // ─────────────────────────────────────────────────────────
            // CURRENT HP / MP
            // ─────────────────────────────────────────────────────────
            //
            // O banco guarda o estado atual.
            // O StatSystem determina os valores máximos.

            player.hp =
                Math.min(
                    char.hp,
                    player.maxHp,
                );

            player.mp =
                Math.min(
                    char.mp,
                    player.maxMp,
                );

            // ─────────────────────────────────────────────────────────
            // POSITION
            // ─────────────────────────────────────────────────────────

            player.x =
                spawn.x;

            player.y =
                spawn.y;

            player.targetX =
                spawn.x;

            player.targetY =
                spawn.y;

            // ─────────────────────────────────────────────────────────
            // ADD TO ROOM
            // ─────────────────────────────────────────────────────────

            this.state.players.set(
                client.sessionId,
                player,
            );

            // ─────────────────────────────────────────────────────────────
            // INVENTORY
            // ─────────────────────────────────────────────────────────────

            const inventory =
                await inventoryService.getInventory(
                    player.characterId,
                );

            client.send("inventorySnapshot", {
                items: inventory,
            });

            console.log(
                `[WorldRoom] Inventory sent: ` +
                `player=${player.name} ` +
                `entries=${inventory.length}`,
            );

            const equipment =
                await equipmentService.getEquipment(
                    player.characterId,
                );

            client.send("equipmentSnapshot", {
                items: equipment,
            });

            console.log(
                `[WorldRoom] Equipment sent: ` +
                `player=${player.name} ` +
                `entries=${equipment.length}`,
            );

            console.log(
                `[WorldRoom] Player ${ char.name } joined. ` +
                `Lv ${ player.level } | ` +
                `JobLv ${ player.jobLevel } | ` +
                `STR ${ player.str } ` +
                `AGI ${ player.agi } ` +
                `VIT ${ player.vit } ` +
                `INT ${ player.int } ` +
                `DEX ${ player.dex } ` +
                `LUK ${ player.luk } | ` +
                `StatPoints ${ player.availablePoints } | ` +
                `SkillPoints ${ player.availableSkillPoints } | ` +
                `ATK ${ player.atk } | ` +
                `DEF ${ player.def } | ` +
                `MATK ${ player.matk } | ` +
                `MDEF ${ player.magicDefense } | ` +
                `HIT ${ player.hit } | ` +
                `FLEE ${ player.flee } | ` +
                `CRIT ${player.crit} ` +
                `ASPD ${player.aspd}ms `,
            );
        } catch (error) {
            console.error(
                "[WorldRoom] onJoin error:",
                error,
            );

            client.leave();
        }
    }

    // ─────────────────────────────────────────────────────────────
    // PLAYER LEAVE / PERSISTENCE
    // ─────────────────────────────────────────────────────────────

    async onLeave(
        client: Client,
        _consented: boolean,
    ) {
        const player =
            this.state.players.get(
                client.sessionId,
            );

        if (
            player &&
            player.characterId
        ) {
            statusService.clear(
                player.characterId,
            );
            try {
                await prisma.character.update(
                    {
                        where:
                        {
                            id:
                                player.characterId,
                        },

                        data:
                        {
                            // ─────────────────────────────────────────────
                            // POSITION
                            // ─────────────────────────────────────────────

                            posX:
                                player.x,

                            posY:
                                player.y,

                            mapId:
                                this.roomName,

                            // ─────────────────────────────────────────────
                            // LEVEL / JOB
                            // ─────────────────────────────────────────────

                            level:
                                player.level,

                            jobLevel:
                                player.jobLevel,

                            // ─────────────────────────────────────────────
                            // EXPERIENCE
                            // ─────────────────────────────────────────────

                            baseExp:
                                BigInt(
                                    player.baseExp,
                                ),

                            jobExp:
                                BigInt(
                                    player.jobExp,
                                ),

                            // ─────────────────────────────────────────────
                            // BASE ATTRIBUTES
                            // ─────────────────────────────────────────────

                            str:
                                player.str,

                            agi:
                                player.agi,

                            vit:
                                player.vit,

                            int:
                                player.int,

                            dex:
                                player.dex,

                            luk:
                                player.luk,

                            // ─────────────────────────────────────────────
                            // AVAILABLE POINTS
                            // ─────────────────────────────────────────────

                            availablePoints:
                                player.availablePoints,

                            availableSkillPoints:
                                player.availableSkillPoints,

                            // ─────────────────────────────────────────────
                            // HP / MP
                            // ─────────────────────────────────────────────

                            hp:
                                player.hp,

                            mp:
                                player.mp,
                        },
                    },
                );
                
                console.log(
                    `[WorldRoom] Saved ${ player.name }: ` +
                    `Lv ${ player.level } | ` +
                    `BaseEXP ${ player.baseExp } | ` +
                    `StatPoints ${ player.availablePoints } `,
                );
            } catch (error) {
                console.error(
                    `[WorldRoom] Failed to save character ${ player.characterId }: `,
                    error,
                );
            }
        }

        // Remove timers associated with this player.
        this.playerAttackTimers.delete(
            client.sessionId,
        );

        this.state.players.delete(
            client.sessionId,
        );
    }

    // ─────────────────────────────────────────────────────────────
    // ROOM DISPOSE
    // ─────────────────────────────────────────────────────────────

    onDispose() {
        console.log(
            "room",
            this.roomId,
            "disposing...",
        );
    }
}



