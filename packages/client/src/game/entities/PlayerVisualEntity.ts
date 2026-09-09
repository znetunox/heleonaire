import Phaser from 'phaser';

export class PlayerVisualEntity {
  public container: Phaser.GameObjects.Container;
  public sprite: Phaser.GameObjects.Sprite;
  public auraGfx: Phaser.GameObjects.Graphics;
  public nameText: Phaser.GameObjects.Text;
  public hpBarGfx: Phaser.GameObjects.Graphics;

  public isLocal: boolean;
  public currentX: number = 0;
  public currentY: number = 0;
  public isMoving: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, name: string, isLocal: boolean) {
    this.isLocal = isLocal;
    this.currentX = x;
    this.currentY = y;

    this.container = scene.add.container(x, y);
    this.container.setDepth(20);

    // Aura ring
    this.auraGfx = scene.add.graphics();
    const auraColor = isLocal ? 0x00ffaa : 0x3182ce;
    this.auraGfx.fillStyle(auraColor, 0.25);
    this.auraGfx.fillCircle(0, 4, 18);
    this.auraGfx.lineStyle(2, auraColor, 0.8);
    this.auraGfx.strokeCircle(0, 4, 18);

    // Character Sprite (Knight 32x32)
    this.sprite = scene.add.sprite(0, 0, 'knight_sprite', 0);
    this.sprite.setScale(1.2);

    // Name Tag
    this.nameText = scene.add.text(0, -28, name, {
      fontSize: '12px',
      color: isLocal ? '#00ffaa' : '#ffffff',
      backgroundColor: '#000000bb',
      padding: { x: 5, y: 2 },
    }).setOrigin(0.5);

    // HP Bar
    this.hpBarGfx = scene.add.graphics();

    this.container.add([this.auraGfx, this.sprite, this.nameText, this.hpBarGfx]);
  }

  public updatePosition(x: number, y: number, hp: number, maxHp: number) {
    const dx = x - this.currentX;
    const dy = y - this.currentY;
    this.isMoving = Math.hypot(dx, dy) > 0.5;

    this.currentX = x;
    this.currentY = y;
    this.container.setPosition(x, y);

    // Direction flip
    if (dx < -0.1) {
      this.sprite.setFlipX(true);
    } else if (dx > 0.1) {
      this.sprite.setFlipX(false);
    }

    // Walking animation toggle
    if (this.isMoving) {
      this.sprite.setFrame(Math.floor((Date.now() / 150) % 4));
    } else {
      this.sprite.setFrame(0);
    }

    // Update HP bar
    this.hpBarGfx.clear();
    this.hpBarGfx.fillStyle(0x000000, 0.8);
    this.hpBarGfx.fillRect(-16, -18, 32, 4);

    const ratio = Math.max(0, Math.min(1, maxHp > 0 ? hp / maxHp : 1));
    this.hpBarGfx.fillStyle(this.isLocal ? 0x10b981 : 0x3b82f6, 1);
    this.hpBarGfx.fillRect(-16, -18, 32 * ratio, 4);
  }

  public destroy() {
    this.container.destroy();
  }
}
