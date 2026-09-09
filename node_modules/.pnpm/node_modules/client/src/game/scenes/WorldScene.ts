import Phaser from 'phaser';
import { Client } from 'colyseus.js';
import { useAppStore } from '../../store/appStore';
import { useHUDStore } from '../../store/hudStore';
import { getMapConfig } from '../maps/MapRegistry';
import type { MapConfig } from '../maps/MapRegistry';
import { MonsterVisualEntity } from '../entities/MonsterVisualEntity';
import { NpcVisualEntity } from '../entities/NpcVisualEntity';
import { GroundDropVisualEntity } from '../entities/GroundDropVisualEntity';
import { inventoryManager } from '../inventory/InventoryManager';

export class WorldScene extends Phaser.Scene {
  // ─── Debug ───────────────────────────────────────────
  public static DEBUG_WORLD_GRID: boolean = false;

  // ─── Colyseus ────────────────────────────────────────
  private client!: Client;
  private room?: any;
  private mapConfig!: MapConfig;

 // ─── Drops ────────────────────────────────────────
 private drops: Map<string, GroundDropVisualEntity> = new Map();

  // ─── Local Player ────────────────────────────────────
  private localSprite?: Phaser.GameObjects.Sprite;
  private localAura?: Phaser.GameObjects.Graphics;
  private localNameTag?: Phaser.GameObjects.Text;
  private localHpBar?: Phaser.GameObjects.Graphics;
  private localPosX: number = 200;
  private localPosY: number = 200;

  // ─── Other Players ───────────────────────────────────
  private otherPlayerSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private otherPlayerGraphics: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private otherPlayerTexts: Map<string, Phaser.GameObjects.Text> = new Map();

  // ─── Mobs ────────────────────────────────────────────
  private mobs: Map<string, MonsterVisualEntity> = new Map();

  // ─── NPCs ────────────────────────────────────────────
  private npcs: Map<string, NpcVisualEntity> = new Map();

  // ─── Targeting ───────────────────────────────────────
  private selectedMobId: string = '';
  private targetRing?: Phaser.GameObjects.Graphics;

  // ─── Camera ──────────────────────────────────────────
  private currentZoom: number = 1.2;
  private isRightDragging: boolean = false;
  private cameraAngle: number = 0;
  private minZoom: number = 0.5; // será recalculado em create()

  // ─── UI / Debug ──────────────────────────────────────
  private debugGridGfx?: Phaser.GameObjects.Grid;
  private debugText?: Phaser.GameObjects.Text;
  private mapNameTag?: Phaser.GameObjects.Text;


  constructor() {
    super('WorldScene');
  }

  preload() {
    const activeChar = useAppStore.getState().activeCharacter;
    const mapId = activeChar?.mapId || 'plains_of_ash';
    this.mapConfig = getMapConfig(mapId);

    this.load.spritesheet('knight_sprite', '/assets/sprites/knight.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('skeleton_sprite', '/assets/sprites/skeleton.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  create(data?: { forceMapId?: string }) {

    // Reset de estado deixado por uma sessão de mapa anterior (scene.restart)
    this.localSprite = undefined;
    this.localAura = undefined;
    this.localNameTag = undefined;
    this.localHpBar = undefined;
    this.localPosX = 200;
    this.localPosY = 200;
    this.otherPlayerSprites.clear();
    this.otherPlayerGraphics.clear();
    this.otherPlayerTexts.clear();
    this.mobs.clear();
    this.npcs.clear();
    this.drops.clear();
    this.selectedMobId = '';

    const activeChar = useAppStore.getState().activeCharacter;
    const mapId = data?.forceMapId || activeChar?.mapId || 'plains_of_ash';
    this.mapConfig = getMapConfig(mapId);

    console.log(`[WorldScene] Map: ${this.mapConfig.name} | Spawn: ${this.mapConfig.defaultSpawn.x},${this.mapConfig.defaultSpawn.y}`);

    // Block browser context menu (for right-click drag)
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    const mapW = this.mapConfig.width * this.mapConfig.tileWidth;
    const mapH = this.mapConfig.height * this.mapConfig.tileHeight;

    // ── 1. Ground Terrain ──────────────────────────────
    this.buildTerrain(mapW, mapH);

    // ── 2. Debug Grid (hidden by default) ─────────────
    this.debugGridGfx = this.add.grid(
      mapW / 2, mapH / 2,
      mapW, mapH,
      this.mapConfig.tileWidth, this.mapConfig.tileHeight,
      0x000000, 0,
      0x3b82f6, 0.25
    ).setDepth(5).setVisible(WorldScene.DEBUG_WORLD_GRID);

    // ── 3. Target Selection Ring ────────────────────────
    this.targetRing = this.add.graphics().setDepth(19);

    // ── 4. Map Name Tag (top-right fixed HUD) ──────────
    this.mapNameTag = this.add.text(
      this.cameras.main.width - 12,
      12,
      `${this.mapConfig.name}\n${this.mapConfig.id}`,
      {
        fontSize: '13px',
        color: '#c0cfe0',
        align: 'right',
        backgroundColor: '#00000099',
        padding: { x: 8, y: 5 },
      }
    ).setOrigin(1, 0).setDepth(200).setScrollFactor(0);

    // ── 5. Debug Text Overlay ──────────────────────────
    this.debugText = this.add.text(12, 70, '', {
      fontSize: '11px',
      color: '#00ffaa',
      backgroundColor: '#00000099',
      padding: { x: 6, y: 4 },
    }).setScrollFactor(0).setDepth(200).setVisible(WorldScene.DEBUG_WORLD_GRID);

    // ── 6. Static NPCs ─────────────────────────────────
    this.spawnStaticNpcs(mapW, mapH);
    this.spawnPortals(mapW, mapH);

    // ── 7. Input ───────────────────────────────────────
    this.setupInputs();

    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (/^F[1-9]|F1[0-2]$/.test(e.key)) {
        e.preventDefault();
      }
    });

    // ── 8. Camera ─────────────────────────────────────
    this.cameras.main.setBounds(0, 0, mapW, mapH);

    // Zoom mínimo = o quanto precisa pra caber o mapa inteiro na tela, o que for maior (mais restritivo)
    this.minZoom = Math.max(
      this.cameras.main.width / mapW,
      this.cameras.main.height / mapH
    );
    this.currentZoom = Math.max(this.currentZoom, this.minZoom);
    this.cameras.main.setZoom(this.currentZoom);
    this.cameras.main.centerOn(this.mapConfig.defaultSpawn.x, this.mapConfig.defaultSpawn.y);

    // ── 9. Connect to Server ───────────────────────────
    this.connectServer();
  }

  // ── Terrain ─────────────────────────────────────────────
  private buildTerrain(mapW: number, mapH: number) {
    const g = this.add.graphics().setDepth(0);

    // Base meadow
    g.fillStyle(0x2d4a27, 1);
    g.fillRect(0, 0, mapW, mapH);

    // Horizontal road
    g.fillStyle(0x525c6a, 1);
    g.fillRect(0, mapH / 2 - 48, mapW, 96);
    // Vertical road
    g.fillRect(mapW / 2 - 48, 0, 96, mapH);

    // Central Plaza
    g.fillStyle(0x64748b, 1);
    g.fillCircle(mapW / 2, mapH / 2, 110);
    g.lineStyle(4, 0x94a3b8, 1);
    g.strokeCircle(mapW / 2, mapH / 2, 110);

    // Cobblestone pattern on road
    g.lineStyle(1, 0x475569, 0.6);
    for (let x = 0; x < mapW; x += 32) {
      g.lineBetween(x, mapH / 2 - 48, x, mapH / 2 + 48);
    }
    for (let y = 0; y < mapH; y += 32) {
      g.lineBetween(mapW / 2 - 48, y, mapW / 2 + 48, y);
    }

    // Grass patches
    g.fillStyle(0x3a5c30, 0.6);
    for (let i = 0; i < 30; i++) {
      const px = Math.sin(i * 173.5) * mapW * 0.4 + mapW / 2;
      const py = Math.cos(i * 291.7) * mapH * 0.4 + mapH / 2;
      g.fillCircle(px, py, 20 + (i % 4) * 8);
    }

    // World boundary
    g.lineStyle(6, 0x1e293b, 1);
    g.strokeRect(0, 0, mapW, mapH);
  }

  // ── Static NPCs ─────────────────────────────────────────
  private spawnStaticNpcs(mapW: number, mapH: number) {
    const kafra = new NpcVisualEntity(this, 'npc_kafra',
      mapW / 2 - 40, mapH / 2 - 50,
      'Kafra Employee', 'Save & Storage'
    );
    this.npcs.set('npc_kafra', kafra);

    const guide = new NpcVisualEntity(this, 'npc_guide',
      mapW / 2 + 40, mapH / 2 - 50,
      'Novice Instructor', 'Quest & Training'
    );
    this.npcs.set('npc_guide', guide);
  }

  private spawnPortals(_mapW: number, _mapH: number) {
    this.mapConfig.portals.forEach((portal) => {
      const g = this.add.graphics().setDepth(15);
      g.fillStyle(0x22d3ee, 0.35);
      g.fillCircle(portal.x, portal.y, portal.radius);
      g.lineStyle(2, 0x22d3ee, 0.9);
      g.strokeCircle(portal.x, portal.y, portal.radius);

      this.add.text(portal.x, portal.y - portal.radius - 12, `→ ${portal.targetMap}`, {
        fontSize: '10px', color: '#22d3ee',
        backgroundColor: '#000000bb', padding: { x: 4, y: 2 },
      }).setOrigin(0.5).setDepth(15);
    });
  }

  // ── Local Player Visual ─────────────────────────────────
  private createLocalPlayer(x: number, y: number, name: string) {
    if (this.localSprite) return; // Already created

    // Aura glow
    this.localAura = this.add.graphics().setDepth(20);
    this.localAura.fillStyle(0x00ffaa, 0.3);
    this.localAura.fillCircle(0, 0, 20);
    this.localAura.lineStyle(2, 0x00ffaa, 0.9);
    this.localAura.strokeCircle(0, 0, 20);
    this.localAura.setPosition(x, y);

    // Knight Sprite
    this.localSprite = this.add.sprite(x, y, 'knight_sprite', 0)
      .setScale(1.4)
      .setDepth(21);

    // Name Tag
    this.localNameTag = this.add.text(x, y - 30, name, {
      fontSize: '12px',
      color: '#00ffaa',
      backgroundColor: '#000000bb',
      padding: { x: 5, y: 2 },
    }).setOrigin(0.5).setDepth(22);

    // HP Bar
    this.localHpBar = this.add.graphics().setDepth(22);

    // Camera follows local player sprite
    this.cameras.main.startFollow(this.localSprite, true, 0.12, 0.12);
    this.cameras.main.setZoom(this.currentZoom);

    console.log(`[WorldScene] Local player created at (${x}, ${y})`);
  }

  private updateLocalPlayer(x: number, y: number, hp: number, maxHp: number) {
    if (!this.localSprite) return;

    const dx = x - this.localPosX;
    const dy = y - this.localPosY;
    const moving = Math.hypot(dx, dy) > 0.5;

    this.localPosX = x;
    this.localPosY = y;

    this.localSprite.setPosition(x, y);
    this.localAura?.setPosition(x, y);
    if (this.localNameTag) {
      this.localNameTag.setPosition(x, y - 30);
    }

    // Flip direction
    if (dx < -0.1) this.localSprite.setFlipX(true);
    else if (dx > 0.1) this.localSprite.setFlipX(false);

    // Animate walk
    if (moving) {
      this.localSprite.setFrame(Math.floor(Date.now() / 150) % 4);
    } else {
      this.localSprite.setFrame(0);
    }

    // HP Bar
    if (this.localHpBar) {
      this.localHpBar.clear();
      this.localHpBar.fillStyle(0x000000, 0.8);
      this.localHpBar.fillRect(x - 16, y - 22, 32, 5);
      const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 1;
      this.localHpBar.fillStyle(0x10b981, 1);
      this.localHpBar.fillRect(x - 16, y - 22, 32 * ratio, 5);
    }
  }

  // ── Inputs ─────────────────────────────────────────────
  private setupInputs() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.isRightDragging = true;
      } else if (pointer.leftButtonDown()) {
        this.handleClick(pointer);
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.rightButtonDown()) this.isRightDragging = false;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isRightDragging && pointer.isDown) {
        this.cameraAngle += pointer.deltaX * 0.004;
        (this.cameras.main as any).rotation = this.cameraAngle;
      }
    });

    this.input.on('wheel', (_p: any, _g: any, _dx: number, deltaY: number) => {
      this.currentZoom = Phaser.Math.Clamp(
        this.currentZoom + deltaY * -0.0015,
        this.minZoom, 2.5
      );
      this.cameras.main.setZoom(this.currentZoom);
    });

    // G = Toggle debug grid
    this.input.keyboard?.on('keydown-G', () => {
      WorldScene.DEBUG_WORLD_GRID = !WorldScene.DEBUG_WORLD_GRID;
      this.debugGridGfx?.setVisible(WorldScene.DEBUG_WORLD_GRID);
      this.debugText?.setVisible(WorldScene.DEBUG_WORLD_GRID);
    });

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.cameras.main?.setViewport(0, 0, gameSize.width, gameSize.height);
      if (this.mapNameTag) {
        this.mapNameTag.setPosition(gameSize.width - 12, 12);
      }
    });
  }

  private handleClick(pointer: Phaser.Input.Pointer) {
    if (!this.room) return;

    const wx = pointer.worldX;
    const wy = pointer.worldY;

    // Check mob click
    let clickedMobId: string | null = null;
    this.mobs.forEach((mob, id) => {
      if (!mob.isDead && Phaser.Math.Distance.Between(wx, wy, mob.currentX, mob.currentY) < 30) {
        clickedMobId = id;
      }
    });

    if (clickedMobId) {
      this.selectedMobId = clickedMobId;
      this.room.send('attack', { targetId: clickedMobId });

      const mobState = (this.room.state as any)?.mobs?.get(clickedMobId);
      if (mobState) {
        useHUDStore.getState().setTargetInfo({
          id: mobState.id,
          name: mobState.name,
          level: mobState.level,
          hp: mobState.hp,
          maxHp: mobState.maxHp,
        });
      }
    } else {
      // Click-to-move
      this.showClickMarker(wx, wy);
      this.room.send('move', { x: wx, y: wy });
    }
  }

  private showClickMarker(x: number, y: number) {
    const m = this.add.graphics().setDepth(30);
    m.lineStyle(2, 0x00ffaa, 1);
    m.strokeRect(x - 8, y - 8, 16, 16);
    this.tweens.add({
      targets: m, scaleX: 1.8, scaleY: 1.8, alpha: 0, duration: 280,
      onComplete: () => m.destroy(),
    });
  }

  // ── Server Connection ───────────────────────────────────
  private async connectServer(targetMapId?: string) {
    const token = useAppStore.getState().token;
    const activeChar = useAppStore.getState().activeCharacter;
    if (!token || !activeChar) return;

    const mapToJoin = targetMapId || this.mapConfig.id;

    try {
      if (!this.client) {
        this.client = new Client('ws://localhost:2567');
      }
      const room = await this.client.joinOrCreate(mapToJoin, { token, characterId: activeChar.id });
      if (!this.sys?.isActive()) { room.leave(); return; }

        this.room = room;

        // ─────────────────────────────────────────────────────────────
        // INVENTORY
        // ─────────────────────────────────────────────────────────────

        room.onMessage(
            "inventorySnapshot",
            (data: { items?: any[] }) => {
                if (!this.sys?.isActive()) return;

                const items = data?.items ?? [];

                inventoryManager.setInventory(items);

                useHUDStore.getState().setInventoryItems(items);

                console.log(
                    `[WorldScene] Inventory synchronized: ` +
                    `${items.length} entries`,
                );
            },
        );

      useHUDStore.getState().setRoom(room);
      console.log('[Colyseus] Connected to map', mapToJoin, '- session:', room.sessionId);

      room.onMessage('teleportApproved', (data: any) => {
        this.switchMap(data.targetMap);
      });

        room.onMessage(
            "itemUseResult",
            (data: {
                success: boolean;
                reason?: string;
                hpHealed?: number;
                mpHealed?: number;
            }) => {
                if (!this.sys?.isActive()) return;

                if (!data?.success) {
                    console.warn(
                        `[WorldScene] Item use failed: ${data?.reason}`,
                    );

                    return;
                }

                console.log(
                    `[WorldScene] Item used: ` +
                    `HP +${data.hpHealed ?? 0} ` +
                    `MP +${data.mpHealed ?? 0}`,
                );
            },
        );

      // Players
      (room.state as any).players.onAdd((player: any, sessionId: string) => {
        if (!this.sys?.isActive()) return;
        const isLocal = sessionId === room.sessionId || player.name === activeChar.name;

        if (isLocal) {
          this.createLocalPlayer(player.x || 200, player.y || 200, player.name);
        } else {
          // Other player sprite
          const spr = this.add.sprite(player.x, player.y, 'knight_sprite', 0)
            .setScale(1.2).setDepth(20).setTint(0x88aaff);
          this.otherPlayerSprites.set(sessionId, spr);

          const aura = this.add.graphics().setDepth(19);
          this.otherPlayerGraphics.set(sessionId, aura);

          const tag = this.add.text(player.x, player.y - 28, player.name, {
            fontSize: '11px', color: '#aaddff',
            backgroundColor: '#000000bb', padding: { x: 4, y: 2 },
          }).setOrigin(0.5).setDepth(21);
          this.otherPlayerTexts.set(sessionId, tag);
        }
      });

      (room.state as any).players.onRemove((_player: any, sessionId: string) => {
        if (!this.sys?.isActive()) return;
        this.otherPlayerSprites.get(sessionId)?.destroy();
        this.otherPlayerGraphics.get(sessionId)?.destroy();
        this.otherPlayerTexts.get(sessionId)?.destroy();
        this.otherPlayerSprites.delete(sessionId);
        this.otherPlayerGraphics.delete(sessionId);
        this.otherPlayerTexts.delete(sessionId);
      });

      // Mobs
      (room.state as any).mobs.onAdd((mob: any, mobId: string) => {
        if (!this.sys?.isActive()) return;
        const visual = new MonsterVisualEntity(
          this, mobId, mob.mobDbId,
          mob.x || 300, mob.y || 300,
          mob.name, mob.level
        );
        this.mobs.set(mobId, visual);
      });

      (room.state as any).mobs.onRemove((_mob: any, mobId: string) => {
        if (!this.sys?.isActive()) return;
        this.mobs.get(mobId)?.destroy();
        this.mobs.delete(mobId);
        if (this.selectedMobId === mobId) {
          this.selectedMobId = '';
          useHUDStore.getState().setTargetInfo(null);
        }
      });

      // Dops
     (room.state as any).drops.onAdd((drop: any, dropId: string) => {
            if (!this.sys?.isActive()) return;
         console.log(
             "[WorldScene] GroundDrop listeners registered",
         );
            const visual = new GroundDropVisualEntity(
                this,
                dropId,
                drop.itemId,
                drop.itemName,
                drop.quantity,
                drop.x,
                drop.y
            );

            this.drops.set(dropId, visual);

            console.log(
                `[WorldScene] GroundDrop added: ${drop.itemName} (${drop.itemId})`
            );
        });

        (room.state as any).drops.onRemove(
            (drop: any, dropId: string) => {
                console.log(
                    `[WorldScene] GroundDrop onRemove received: ${dropId}`,
                );

                const visual =
                    this.drops.get(dropId);

                console.log(
                    `[WorldScene] GroundDrop visual found: ${!!visual}`,
                );

                if (!visual) {
                    console.warn(
                        `[WorldScene] GroundDrop visual not found: ${dropId}`,
                    );

                    return;
                }

                visual.destroy();

                this.drops.delete(dropId);

                console.log(
                    `[WorldScene] GroundDrop visual destroyed: ${dropId}`,
                );
            },
        );

      // Messages
      room.onMessage('damage', (data: any) => {
        if (!this.sys?.isActive()) return;
        this.showDamage(data.x, data.y, data.damage, data.isCrit);
        if (this.selectedMobId && data.targetId === this.selectedMobId) {
          const m = (this.room?.state as any)?.mobs?.get(this.selectedMobId);
          if (m) useHUDStore.getState().setTargetInfo({ id: m.id, name: m.name, level: m.level, hp: m.hp, maxHp: m.maxHp });
        }
      });

      room.onMessage('combatLog', (data: any) => {
        if (data.text) useHUDStore.getState().addLog(data.text, data.color);
      });

        room.onMessage('statDistributionResult', (data: any) => {
            if (!this.sys?.isActive()) return;

            if (!data.success) {
                console.warn(
                    '[Stats] Distribution failed:',
                    data.error
                );

                useHUDStore.getState().addLog(
                    `Atributo: ${data.error}`,
                    '#ff5555'
                );

                return;
            }

            console.log(
                `[Stats] ${data.stat} +${data.amount} | ` +
                `Cost: ${data.cost} | ` +
                `Remaining: ${data.availablePoints}`
            );

            useHUDStore.getState().setPlayerInfo({
                str: data.stats.str,
                agi: data.stats.agi,
                vit: data.stats.vit,
                int: data.stats.int,
                dex: data.stats.dex,
                luk: data.stats.luk,

                statPoints: data.availablePoints,

                maxHp: data.derived.maxHp,
                maxMp: data.derived.maxMp,

                atk: data.derived.atk,
                matk: data.derived.matk,
                def: data.derived.def,
                magicDefense: data.derived.magicDefense,
                hit: data.derived.hit,
                flee: data.derived.flee,
                crit: data.derived.crit,
            });
        });

    } catch (err) {
      console.error('[Colyseus] Error:', err);
    }
  }

  private showDamage(x: number, y: number, damage: number, isCrit: boolean) {
    if (!this.add || !this.sys?.isActive()) return;
    const t = this.add.text(x, y - 20, String(damage), {
      fontSize: isCrit ? '22px' : '15px',
      color: isCrit ? '#ffcc00' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(50);
    this.tweens.add({
      targets: t, y: y - 55, alpha: 0, duration: 900, ease: 'Power1',
      onComplete: () => t.destroy(),
    });
  }

    private switchMap(targetMapId: string) {
        console.log(
            `[WorldScene] Switching map: ${this.mapConfig.id} -> ${targetMapId}`
        );

        this.room?.leave();

        this.room = undefined;

        useHUDStore.getState().setRoom(undefined);

        this.scene.restart({ forceMapId: targetMapId });
    }

  // ── Update Loop (60 FPS) ────────────────────────────────
  update() {
    if (!this.sys?.isActive() || !this.room) return;

    const activeChar = useAppStore.getState().activeCharacter;

    // Sync all players
    (this.room?.state as any)?.players?.forEach((player: any, sessionId: string) => {
      const isLocal = sessionId === this.room.sessionId || player.name === activeChar?.name;


      if (isLocal) {


        if (this.localSprite) {
          for (const portal of this.mapConfig.portals) {
            const dist = Phaser.Math.Distance.Between(this.localPosX, this.localPosY, portal.x, portal.y);
            if (dist <= portal.radius) {
              this.room?.send('teleport', { targetMap: portal.targetMap });
              break;
            }
          }
        }

        // Create visual if not yet done (race condition fallback)
        if (!this.localSprite) {
          this.createLocalPlayer(player.x, player.y, player.name);
        }
        this.updateLocalPlayer(player.x, player.y, player.hp, player.maxHp);

          useHUDStore.getState().setPlayerInfo({
              name: player.name,
              level: player.level,

              hp: player.hp,
              maxHp: player.maxHp,

              mp: player.mp,
              maxMp: player.maxMp,

              baseExp: player.baseExp,
              maxBaseExp: player.maxBaseExp,

              class: player.class,

              str: player.str,
              agi: player.agi,
              vit: player.vit,
              int: player.int,
              dex: player.dex,
              luk: player.luk,

              statPoints: player.availablePoints,

              atk: player.atk,
              matk: player.matk,
              def: player.def,
              magicDefense: player.magicDefense,
              hit: player.hit,
              flee: player.flee,
              crit: player.crit,
              aspd: player.aspd,
          });
      } else {
        const spr = this.otherPlayerSprites.get(sessionId);
        const aura = this.otherPlayerGraphics.get(sessionId);
        const tag = this.otherPlayerTexts.get(sessionId);
        if (spr) {
          spr.setPosition(player.x, player.y);
          spr.setFrame(Math.floor(Date.now() / 150) % 4);
        }
        if (aura) {
          aura.clear();
          aura.fillStyle(0x3b82f6, 0.25);
          aura.fillCircle(player.x, player.y, 18);
        }
        if (tag) tag.setPosition(player.x, player.y - 28);
      }
    });

    // Sync mobs
    (this.room?.state as any)?.mobs?.forEach((mob: any, mobId: string) => {
      const visual = this.mobs.get(mobId);
      if (visual) {
        visual.updatePosition(mob.x, mob.y, mob.hp, mob.maxHp, mob.isDead);
      }
    });

    // Drops sync
      (this.room?.state as any)?.drops?.forEach(
          (drop: any, dropId: string) => {
              const visual = this.drops.get(dropId);

              if (visual) {
                  visual.updatePosition(drop.x, drop.y);
              }
          }
      );

    // Target Selection Ring
    if (this.targetRing) {
      this.targetRing.clear();
      if (this.selectedMobId) {
        const visual = this.mobs.get(this.selectedMobId);
        if (visual && !visual.isDead) {
          this.targetRing.lineStyle(3, 0xff2222, 1);
          this.targetRing.strokeCircle(visual.currentX, visual.currentY, 26);
        }
      }
    }

    // Debug overlay
    if (this.debugText && WorldScene.DEBUG_WORLD_GRID) {
      const fps = Math.round(this.game.loop.actualFps);
      this.debugText.setText(
        `[DEBUG] FPS: ${fps}\n` +
        `Map: ${this.mapConfig.id}\n` +
        `Player: (${Math.round(this.localPosX)}, ${Math.round(this.localPosY)})\n` +
        `Mobs: ${this.mobs.size} | NPCs: ${this.npcs.size}\n` +
        `Zoom: ${this.currentZoom.toFixed(2)}x\n` +
        `[G] Toggle Grid`
      );
    }
  }
}
