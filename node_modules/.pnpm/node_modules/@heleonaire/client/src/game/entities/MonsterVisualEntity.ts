import Phaser from 'phaser';

export class MonsterVisualEntity {
  public id: string;
  public mobDbId: number;
  public container: Phaser.GameObjects.Container;
  public sprite: Phaser.GameObjects.Sprite;
  public auraGfx: Phaser.GameObjects.Graphics;
  public nameText: Phaser.GameObjects.Text;
  public hpBarGfx: Phaser.GameObjects.Graphics;

  public currentX: number = 0;
  public currentY: number = 0;
  public isDead: boolean = false;

  constructor(scene: Phaser.Scene, id: string, mobDbId: number, x: number, y: number, name: string, level: number) {
    this.id = id;
    this.mobDbId = mobDbId;
    this.currentX = x;
    this.currentY = y;

    this.container = scene.add.container(x, y);
    this.container.setDepth(18);

    // Hostile aura
    this.auraGfx = scene.add.graphics();
    this.auraGfx.fillStyle(0xef4444, 0.2);
    this.auraGfx.fillCircle(0, 4, 16);
    this.auraGfx.lineStyle(2, 0xef4444, 0.7);
    this.auraGfx.strokeCircle(0, 4, 16);

    // Skeleton Sprite (32x32)
    this.sprite = scene.add.sprite(0, 0, 'skeleton_sprite', 0);
    this.sprite.setScale(1.2);

    // Name Tag
    this.nameText = scene.add.text(0, -28, `${name} Lv.${level}`, {
      fontSize: '11px',
      color: '#ffaaaa',
      backgroundColor: '#000000bb',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5);

    // HP Bar
    this.hpBarGfx = scene.add.graphics();

    this.container.add([this.auraGfx, this.sprite, this.nameText, this.hpBarGfx]);
  }

  public updatePosition(x: number, y: number, hp: number, maxHp: number, isDead: boolean) {
    this.isDead = isDead;

    if (isDead) {
      this.container.setVisible(false);
      return;
    }

    this.container.setVisible(true);
    const dx = x - this.currentX;
    const dy = y - this.currentY;
    const isMoving = Math.hypot(dx, dy) > 0.5;

    this.currentX = x;
    this.currentY = y;
    this.container.setPosition(x, y);

    // Direction flip
    if (dx < -0.1) {
      this.sprite.setFlipX(true);
    } else if (dx > 0.1) {
      this.sprite.setFlipX(false);
    }

    if (isMoving) {
      this.sprite.setFrame(Math.floor((Date.now() / 150) % 4));
    } else {
      this.sprite.setFrame(0);
    }

    // HP Bar
    this.hpBarGfx.clear();
    this.hpBarGfx.fillStyle(0x000000, 0.8);
    this.hpBarGfx.fillRect(-16, -18, 32, 4);

    const ratio = Math.max(0, Math.min(1, maxHp > 0 ? hp / maxHp : 1));
    this.hpBarGfx.fillStyle(0xef4444, 1);
    this.hpBarGfx.fillRect(-16, -18, 32 * ratio, 4);
  }

  public destroy() {
    this.container.destroy();
  }
}
