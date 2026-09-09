import Phaser from 'phaser';
import { WorldScene } from './scenes/WorldScene';

export function createGame(parent: HTMLElement | string) {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: parent,
    backgroundColor: '#2d4a27',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: '100%',
      height: '100%',
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false
      }
    },
    scene: [WorldScene]
  };

  return new Phaser.Game(config);
}
