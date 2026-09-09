import { Room } from "colyseus";
import { WorldState, Player, Mob } from "./schema/WorldState";
import { rathenaDb } from "../parsers/rathenaParser";
import { calcAtk, calcDef, calcPhysicalDamage, calcHit, calcFlee, calcCritRate, } from "@heleonaire/shared";
import prisma from "../db/prisma";
import { MAP_DEFS } from "../maps/mapDefs";
import { StatSystem } from "../game/stats/StatSystem";
export class WorldRoom extends Room {
    constructor() {
        super(...arguments);
        this.maxClients = 100;
        this.mobCounter = 0;
        this.playerAttackTimers = new Map();
        this.mobAttackTimers = new Map();
        this.statSystem = new StatSystem(prisma);
    }
    // ─────────────────────────────────────────────────────────────
    // ROOM CREATE
    // ─────────────────────────────────────────────────────────────
    onCreate(_options) {
        this.setState(new WorldState());
        const mapDef = MAP_DEFS[this.roomName];
        if (!mapDef) {
            console.error(`[WorldRoom] No MAP_DEFS found for map "${this.roomName}"`);
        }
        // Spawn inicial dos mobs usando os dados importados do rAthena.
        this.spawnInitialMobs(mapDef);
        // ───────────────────────────────────────────────────────────
        // CLIENT -> SERVER: MOVEMENT
        // ───────────────────────────────────────────────────────────
        this.onMessage("move", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player &&
                typeof data?.x === "number" &&
                typeof data?.y === "number") {
                player.targetX = data.x;
                player.targetY = data.y;
            }
        });
        // ───────────────────────────────────────────────────────────
        // CLIENT -> SERVER: ATTACK
        // ───────────────────────────────────────────────────────────
        this.onMessage("attack", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player && typeof data?.targetId === "string") {
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
        // CLIENT -> SERVER: TELEPORT
        // ───────────────────────────────────────────────────────────
        this.onMessage("teleport", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (!player || typeof data?.targetMap !== "string") {
                return;
            }
            const validPortal = mapDef?.portals.find((portal) => portal.targetMap === data.targetMap);
            if (!validPortal) {
                console.warn(`[WorldRoom] Rejected teleport to "${data.targetMap}" from "${this.roomName}"`);
                return;
            }
            // O client será responsável por sair desta room
            // e entrar na room do mapa de destino.
            client.send("teleportApproved", {
                targetMap: data.targetMap,
            });
        });
        // ───────────────────────────────────────────────────────────
        // GAME LOOP
        // ───────────────────────────────────────────────────────────
        this.setSimulationInterval((deltaTime) => this.updateLoop(deltaTime), 50);
        console.log("[WorldRoom] Created and running simulation tick.");
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
    calculateBaseExpRequired(level) {
        if (level <= 1) {
            return 100;
        }
        let exp = 100;
        for (let i = 1; i < level; i++) {
            exp = Math.floor(exp * 1.5);
        }
        return exp;
    }
    // ─────────────────────────────────────────────────────────────
    // MOB SPAWN
    // ─────────────────────────────────────────────────────────────
    spawnInitialMobs(mapDef) {
        const mobDbIds = mapDef?.mobDbIds ?? [
            1001,
            1002,
            1004,
            1005,
        ];
        const count = mapDef?.mobCount ?? 15;
        for (let i = 0; i < count; i++) {
            const dbId = mobDbIds[i % mobDbIds.length];
            const rMob = rathenaDb.getMob(dbId);
            const mob = new Mob();
            mob.id = `mob_${++this.mobCounter}`;
            mob.mobDbId = dbId;
            mob.name = rMob
                ? rMob.name
                : "Skeleton Grunt";
            mob.level = rMob
                ? rMob.level
                : 5;
            mob.hp = rMob
                ? rMob.hp
                : 80;
            mob.maxHp = rMob
                ? rMob.hp
                : 80;
            mob.atk = rMob
                ? rMob.attack
                : 15;
            mob.def = rMob
                ? rMob.defense
                : 5;
            mob.exp = rMob
                ? rMob.baseExp || 40
                : 40;
            mob.x = Math.floor(Math.random() * 800 + 100);
            mob.y = Math.floor(Math.random() * 800 + 100);
            mob.targetX = mob.x;
            mob.targetY = mob.y;
            mob.spriteKey = "skeleton";
            this.state.mobs.set(mob.id, mob);
        }
        console.log(`[WorldRoom] Spawned ${count} mobs in "${this.roomName}".`);
    }
    // ─────────────────────────────────────────────────────────────
    // GAME LOOP
    // ─────────────────────────────────────────────────────────────
    updateLoop(_deltaTime) {
        const now = Date.now();
        // ───────────────────────────────────────────────────────────
        // 1. PLAYERS
        // ───────────────────────────────────────────────────────────
        this.state.players.forEach((player, sessionId) => {
            // ───────────────────────────────────────────────────────
            // Movement
            // ───────────────────────────────────────────────────────
            const pdx = player.targetX -
                player.x;
            const pdy = player.targetY -
                player.y;
            const dist = Math.hypot(pdx, pdy);
            if (dist > 4) {
                const moveSpeed = 3.5;
                player.x +=
                    (pdx / dist) *
                        Math.min(dist, moveSpeed);
                player.y +=
                    (pdy / dist) *
                        Math.min(dist, moveSpeed);
            }
            // ───────────────────────────────────────────────────────
            // Auto Attack
            // ───────────────────────────────────────────────────────
            if (!player.targetId) {
                return;
            }
            const targetMob = this.state.mobs.get(player.targetId);
            if (!targetMob ||
                targetMob.isDead) {
                player.targetId = "";
                return;
            }
            const mDist = Math.hypot(targetMob.x -
                player.x, targetMob.y -
                player.y);
            const attackRange = 40;
            if (mDist > attackRange) {
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
            const lastAttack = this.playerAttackTimers.get(sessionId) ?? 0;
            if (now - lastAttack >=
                player.aspd) {
                this.playerAttackTimers.set(sessionId, now);
                void this.processPlayerAttack(player, targetMob, sessionId);
            }
        });
        // ───────────────────────────────────────────────────────────
        // 2. MOBS
        // ───────────────────────────────────────────────────────────
        this.state.mobs.forEach((mob) => {
            if (mob.isDead) {
                return;
            }
            // ───────────────────────────────────────────────────────
            // Random Wander
            // ───────────────────────────────────────────────────────
            if (Math.random() < 0.02 &&
                !mob.targetId) {
                mob.targetX = Math.max(60, Math.min(1200, mob.x +
                    (Math.random() *
                        200 -
                        100)));
                mob.targetY = Math.max(60, Math.min(1200, mob.y +
                    (Math.random() *
                        200 -
                        100)));
            }
            // ───────────────────────────────────────────────────────
            // Movement
            // ───────────────────────────────────────────────────────
            const mdx = mob.targetX -
                mob.x;
            const mdy = mob.targetY -
                mob.y;
            const mDist = Math.hypot(mdx, mdy);
            if (mDist > 4) {
                mob.x +=
                    (mdx / mDist) *
                        Math.min(mDist, 1.5);
                mob.y +=
                    (mdy / mDist) *
                        Math.min(mDist, 1.5);
            }
            // ───────────────────────────────────────────────────────
            // Aggro
            // ───────────────────────────────────────────────────────
            if (!mob.targetId) {
                let nearestPlayer;
                let nearestDistance = Infinity;
                this.state.players.forEach((player) => {
                    const distance = Math.hypot(player.x -
                        mob.x, player.y -
                        mob.y);
                    if (distance < 150 &&
                        distance <
                            nearestDistance) {
                        nearestDistance =
                            distance;
                        nearestPlayer =
                            player;
                    }
                });
                if (nearestPlayer) {
                    // Encontramos o sessionId
                    // correspondente ao player.
                    this.state.players.forEach((player, sessionId) => {
                        if (player ===
                            nearestPlayer) {
                            mob.targetId =
                                sessionId;
                        }
                    });
                }
            }
            else {
                const targetPlayer = this.state.players.get(mob.targetId);
                if (!targetPlayer) {
                    mob.targetId = "";
                    return;
                }
                const pDist = Math.hypot(targetPlayer.x -
                    mob.x, targetPlayer.y -
                    mob.y);
                // Target perdeu aggro.
                if (pDist > 250) {
                    mob.targetId = "";
                    return;
                }
                // ─────────────────────────────────────────────────────
                // Mob Attack
                // ─────────────────────────────────────────────────────
                if (pDist <= 40) {
                    const lastMobAttack = this.mobAttackTimers.get(mob.id) ?? 0;
                    if (now -
                        lastMobAttack >=
                        1500) {
                        this.mobAttackTimers.set(mob.id, now);
                        this.processMobAttack(mob, targetPlayer);
                    }
                }
                else {
                    mob.targetX =
                        targetPlayer.x;
                    mob.targetY =
                        targetPlayer.y;
                }
            }
        });
    }
    // ─────────────────────────────────────────────────────────────
    // PLAYER ATTACK
    // ─────────────────────────────────────────────────────────────
    async processPlayerAttack(player, mob, _sessionId) {
        // ───────────────────────────────────────────────────────────
        // Critical
        // ───────────────────────────────────────────────────────────
        const isCrit = Math.random() * 100 <
            calcCritRate(player.luk);
        // ───────────────────────────────────────────────────────────
        // Hit / Flee
        // ───────────────────────────────────────────────────────────
        const hitRate = calcHit(player.level, player.dex, player.luk);
        const fleeRate = calcFlee(mob.level, 10, 5);
        const finalHitRate = Math.min(95, Math.max(5, hitRate -
            fleeRate +
            80));
        // ───────────────────────────────────────────────────────────
        // Hit Roll
        // ───────────────────────────────────────────────────────────
        if (Math.random() * 100 >
            finalHitRate &&
            !isCrit) {
            this.broadcast("combatLog", {
                attacker: player.name,
                target: mob.name,
                type: "miss",
                damage: 0,
                x: mob.x,
                y: mob.y,
            });
            return;
        }
        // ───────────────────────────────────────────────────────────
        // Damage
        // ───────────────────────────────────────────────────────────
        const rawAtk = calcAtk(player.str, player.atk);
        const softDef = calcDef(player.vit, mob.def);
        const finalDamage = calcPhysicalDamage(rawAtk, softDef, isCrit);
        mob.hp =
            Math.max(0, mob.hp -
                finalDamage);
        this.broadcast("damage", {
            targetId: mob.id,
            damage: finalDamage,
            isCrit,
            x: mob.x,
            y: mob.y,
            targetType: "mob",
        });
        this.broadcast("combatLog", {
            text: `${player.name} causou ${finalDamage} ` +
                `${isCrit ? "CRÍTICO " : ""}` +
                `de dano em ${mob.name}!`,
            color: isCrit
                ? "#ffcc00"
                : "#ffffff",
        });
        // ───────────────────────────────────────────────────────────
        // MOB DEATH
        // ───────────────────────────────────────────────────────────
        if (mob.hp <= 0) {
            mob.isDead = true;
            mob.targetId = "";
            player.targetId = "";
            // ─────────────────────────────────────────────────────────
            // EXP
            // ─────────────────────────────────────────────────────────
            const expGained = mob.exp;
            player.baseExp +=
                expGained;
            this.broadcast("combatLog", {
                text: `Derrotou ${mob.name}! ` +
                    `Ganhou ${expGained} Base EXP.`,
                color: "#00ffaa",
            });
            // ─────────────────────────────────────────────────────────
            // LEVEL UP
            // ─────────────────────────────────────────────────────────
            while (player.baseExp >=
                player.maxBaseExp) {
                const previousLevel = player.level;
                player.baseExp -=
                    player.maxBaseExp;
                player.level += 1;
                // statpoint.yml possui pontos cumulativos.
                // getLevelUpPoints calcula:
                //
                // pontos do nível atual
                // -
                // pontos do nível anterior
                //
                // Ex:
                // Lv1 = 48
                // Lv2 = 51
                // ganho = 3
                const pointsGained = await this.statSystem.getLevelUpPoints(previousLevel);
                player.availablePoints +=
                    pointsGained;
                // Curva temporária de EXP.
                // Será substituída posteriormente
                // pela tabela oficial.
                player.maxBaseExp = 1000;
                // IMPORTANTE:
                //
                // Nenhum atributo é aumentado
                // automaticamente.
                //
                // STR / AGI / VIT / INT / DEX / LUK
                // permanecem exatamente como estavam.
                this.broadcast("combatLog", {
                    text: `${player.name} SUBIU PARA ` +
                        `O NÍVEL ${player.level}! ` +
                        `+${pointsGained} pontos de atributo.`,
                    color: "#ffbb00",
                });
                this.broadcast("levelUp", {
                    level: player.level,
                    availablePoints: player.availablePoints,
                    stats: {
                        str: player.str,
                        agi: player.agi,
                        vit: player.vit,
                        int: player.int,
                        dex: player.dex,
                        luk: player.luk,
                    },
                });
            }
            // ─────────────────────────────────────────────────────────
            // MOB RESPAWN
            // ─────────────────────────────────────────────────────────
            setTimeout(() => {
                if (this.state.mobs.has(mob.id)) {
                    mob.hp =
                        mob.maxHp;
                    mob.isDead =
                        false;
                    mob.targetId =
                        "";
                    mob.x =
                        Math.floor(Math.random() *
                            800 +
                            100);
                    mob.y =
                        Math.floor(Math.random() *
                            800 +
                            100);
                    mob.targetX =
                        mob.x;
                    mob.targetY =
                        mob.y;
                }
            }, 10000);
        }
    }
    // ─────────────────────────────────────────────────────────────
    // MOB ATTACK
    // ─────────────────────────────────────────────────────────────
    processMobAttack(mob, player) {
        const rawAtk = mob.atk;
        const playerDef = calcDef(player.vit, player.def);
        const damage = Math.max(1, rawAtk -
            playerDef);
        player.hp =
            Math.max(0, player.hp -
                damage);
        this.broadcast("damage", {
            targetId: player.id,
            damage,
            isCrit: false,
            x: player.x,
            y: player.y,
            targetType: "player",
        });
        this.broadcast("combatLog", {
            text: `${mob.name} causou ${damage} ` +
                `de dano em ${player.name}!`,
            color: "#ff4444",
        });
        // ───────────────────────────────────────────────────────────
        // PLAYER DEATH
        // ───────────────────────────────────────────────────────────
        if (player.hp <= 0) {
            this.broadcast("combatLog", {
                text: `${player.name} foi derrotado ` +
                    `por ${mob.name}!`,
                color: "#ff0000",
            });
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
    async onJoin(client, options) {
        console.log(client.sessionId, "joining with options:", options);
        if (!options?.characterId) {
            client.leave();
            return;
        }
        try {
            // ─────────────────────────────────────────────────────────
            // LOAD CHARACTER
            // ─────────────────────────────────────────────────────────
            const char = await prisma.character.findUnique({
                where: {
                    id: options.characterId,
                },
            });
            if (!char) {
                console.warn(`[WorldRoom] Character not found: ${options.characterId}`);
                client.leave();
                return;
            }
            // ─────────────────────────────────────────────────────────
            // SPAWN
            // ─────────────────────────────────────────────────────────
            const mapDef = MAP_DEFS[this.roomName];
            const cameFromSameMap = char.mapId ===
                this.roomName;
            const spawn = cameFromSameMap &&
                mapDef
                ? {
                    x: char.posX,
                    y: char.posY,
                }
                : (mapDef?.defaultSpawn ??
                    {
                        x: 200,
                        y: 200,
                    });
            // ─────────────────────────────────────────────────────────
            // CREATE RUNTIME PLAYER
            // ─────────────────────────────────────────────────────────
            const player = new Player();
            player.id =
                client.sessionId;
            player.characterId =
                char.id;
            player.name =
                char.name;
            player.class =
                char.class;
            player.faction =
                char.faction;
            // ─────────────────────────────────────────────────────────
            // LEVEL / JOB / EXP
            // ─────────────────────────────────────────────────────────
            player.level =
                char.level;
            player.jobLevel =
                char.jobLevel;
            player.baseExp =
                Number(char.baseExp);
            player.jobExp =
                Number(char.jobExp);
            player.maxBaseExp =
                this.calculateBaseExpRequired(player.level);
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
            // HP / MP
            // ─────────────────────────────────────────────────────────
            player.hp =
                char.hp;
            player.maxHp =
                char.maxHp;
            player.mp =
                char.mp;
            player.maxMp =
                char.maxMp;
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
            // TEMPORARY DERIVED STATS
            // ─────────────────────────────────────────────────────────
            //
            // ATK/DEF ainda serão refatorados para o StatSystem
            // definitivo, incluindo:
            //
            // Base Stats
            // + Equipment
            // + Class
            // + Buffs
            // + Weapon
            //
            // Por enquanto preservamos o comportamento do protótipo.
            player.atk =
                calcAtk(char.str, 15);
            player.def =
                calcDef(char.vit, 5);
            // ─────────────────────────────────────────────────────────
            // ADD TO ROOM
            // ─────────────────────────────────────────────────────────
            this.state.players.set(client.sessionId, player);
            console.log(`[WorldRoom] Player ${char.name} joined. ` +
                `Lv ${player.level} | ` +
                `JobLv ${player.jobLevel} | ` +
                `STR ${player.str} ` +
                `AGI ${player.agi} ` +
                `VIT ${player.vit} ` +
                `INT ${player.int} ` +
                `DEX ${player.dex} ` +
                `LUK ${player.luk} | ` +
                `StatPoints ${player.availablePoints} | ` +
                `SkillPoints ${player.availableSkillPoints}`);
        }
        catch (error) {
            console.error("[WorldRoom] onJoin error:", error);
            client.leave();
        }
    }
    // ─────────────────────────────────────────────────────────────
    // PLAYER LEAVE / PERSISTENCE
    // ─────────────────────────────────────────────────────────────
    async onLeave(client, _consented) {
        const player = this.state.players.get(client.sessionId);
        if (player &&
            player.characterId) {
            try {
                await prisma.character.update({
                    where: {
                        id: player.characterId,
                    },
                    data: {
                        // ─────────────────────────────────────────────
                        // POSITION
                        // ─────────────────────────────────────────────
                        posX: player.x,
                        posY: player.y,
                        mapId: this.roomName,
                        // ─────────────────────────────────────────────
                        // LEVEL / JOB
                        // ─────────────────────────────────────────────
                        level: player.level,
                        jobLevel: player.jobLevel,
                        // ─────────────────────────────────────────────
                        // EXPERIENCE
                        // ─────────────────────────────────────────────
                        baseExp: BigInt(player.baseExp),
                        jobExp: BigInt(player.jobExp),
                        // ─────────────────────────────────────────────
                        // BASE ATTRIBUTES
                        // ─────────────────────────────────────────────
                        str: player.str,
                        agi: player.agi,
                        vit: player.vit,
                        int: player.int,
                        dex: player.dex,
                        luk: player.luk,
                        // ─────────────────────────────────────────────
                        // AVAILABLE POINTS
                        // ─────────────────────────────────────────────
                        availablePoints: player.availablePoints,
                        availableSkillPoints: player.availableSkillPoints,
                        // ─────────────────────────────────────────────
                        // HP / MP
                        // ─────────────────────────────────────────────
                        hp: player.hp,
                        mp: player.mp,
                    },
                });
                console.log(`[WorldRoom] Saved ${player.name}: ` +
                    `Lv ${player.level} | ` +
                    `BaseEXP ${player.baseExp} | ` +
                    `StatPoints ${player.availablePoints}`);
            }
            catch (error) {
                console.error(`[WorldRoom] Failed to save character ${player.characterId}:`, error);
            }
        }
        // Remove timers associated with this player.
        this.playerAttackTimers.delete(client.sessionId);
        this.state.players.delete(client.sessionId);
    }
    // ─────────────────────────────────────────────────────────────
    // ROOM DISPOSE
    // ─────────────────────────────────────────────────────────────
    onDispose() {
        console.log("room", this.roomId, "disposing...");
    }
}
