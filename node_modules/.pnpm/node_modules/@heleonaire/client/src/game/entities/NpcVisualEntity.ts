import Phaser from 'phaser';

export class NpcVisualEntity {
  public id: string;
  public container: Phaser.GameObjects.Container;
  public sprite: Phaser.GameObjects.Sprite;
  public nameText: Phaser.GameObjects.Text;
  public markerGfx: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, id: string, x: number, y: number, name: string, title: string) {
    this.id = id;
    this.container = scene.add.container(x, y);
    this.container.setDepth(17);

    // NPC base ring (Gold/Yellow)
    this.markerGfx = scene.add.graphics();
    this.markerGfx.fillStyle(0xf59e0b, 0.25);
    this.markerGfx.fillCircle(0, 4, 16);
    this.markerGfx.lineStyle(2, 0xf59e0b, 0.9);
    this.markerGfx.strokeCircle(0, 4, 16);

    // NPC Sprite
    this.sprite = scene.add.sprite(0, 0, 'knight_sprite', 0);
    this.sprite.setTint(0xffe082);
    this.sprite.setScale(1.2);

    // Name & Title
    this.nameText = scene.add.text(0, -28, `${name}\n<${title}>`, {
      fontSize: '11px',
      color: '#fde047',
      align: 'center',
      backgroundColor: '#000000bb',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5);

    this.container.add([this.markerGfx, this.sprite, this.nameText]);
  }

  public destroy() {
    this.container.destroy();
  }
}
