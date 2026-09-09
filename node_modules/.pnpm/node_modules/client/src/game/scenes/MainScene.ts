import Phaser from 'phaser';
import { Client, Room } from 'colyseus.js';

export class MainScene extends Phaser.Scene {
  private client!: Client;
  private room?: Room;
  private players: Map<string, Phaser.GameObjects.Container> = new Map();
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super('MainScene');
  }

  preload() { }

  create() {
    console.log('[MainScene] Initializing...');

    // 1. Grid Background
    const grid = this.add.grid(400, 300, 800, 600, 32, 32, 0x1a1a24, 1, 0x2e303a, 1);
    grid.setDepth(0);

    // 2. Status UI
    this.statusText = this.add.text(16, 560, 'Conectando ao servidor...', {
      fontSize: '14px',
      color: '#00ffaa',
      backgroundColor: '#000000cc',
      padding: { x: 8, y: 4 }
    }).setDepth(100);

    // 3. Connect to Colyseus Server
    this.connectServer();
  }

  private async connectServer() {
    try {
      this.client = new Client('ws://localhost:2567');
      this.room = await this.client.joinOrCreate('world');
      console.log('[Colyseus] Connected! SessionId:', this.room.sessionId);

      this.statusText.setText(`ONLINE | Sala: ${this.room.name} | Session: ${this.room.sessionId}`);

      // Handle additions (fires for initial players + new joins)
      this.room.state.players.onAdd((player: any, sessionId: string) => {
        console.log('[Colyseus] Player added:', sessionId, player.x, player.y);

        if (this.players.has(sessionId)) return;

        const isMe = sessionId === this.room?.sessionId;
        const color = isMe ? 0x00ff00 : 0xff3333; // Green = Me, Red = Others
        const label = isMe ? 'Voce' : `Player ${sessionId.substring(0, 4)}`;

        const initialX = typeof player.x === 'number' ? player.x : 400;
        const initialY = typeof player.y === 'number' ? player.y : 300;

        const container = this.createPlayerGraphic(initialX, initialY, color, label);
        this.players.set(sessionId, container);

        // Update position when server sends new x/y
        const updatePosition = () => {
          if (typeof player.x === 'number') container.x = player.x;
          if (typeof player.y === 'number') container.y = player.y;
        };

        if (player.onChange) player.onChange(updatePosition);
        if (player.listen) {
          player.listen('x', (val: number) => container.x = val);
          player.listen('y', (val: number) => container.y = val);
        }
      });

      // Handle removals
      this.room.state.players.onRemove((_player: any, sessionId: string) => {
        console.log('[Colyseus] Player removed:', sessionId);
        const container = this.players.get(sessionId);
        if (container) {
          container.destroy();
          this.players.delete(sessionId);
        }
      });

    } catch (err: any) {
      console.error('[Colyseus] Connection failed:', err);
      this.statusText.setText(`OFFLINE (Servidor indisponivel)`);

      // Spawn local offline player if server completely offline
      if (!this.players.has('local')) {
        const localContainer = this.createPlayerGraphic(400, 300, 0x00ff00, 'Voce (Offline)');
        this.players.set('local', localContainer);
      }
    }
  }

  private createPlayerGraphic(x: number, y: number, color: number, name: string): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Outer glow
    const circle = this.add.circle(0, 0, 20, color, 0.3);

    // Inner filled square
    const rect = this.add.rectangle(0, 0, 32, 32, color, 1);
    rect.setStrokeStyle(2, 0xffffff);

    // Label
    const text = this.add.text(0, -28, name, {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);

    container.add([circle, rect, text]);
    container.setDepth(20);

    return container;
  }

  update(_time: number, _delta: number) {
    const cursors = this.input.keyboard?.createCursorKeys();
    if (!cursors) return;

    const speed = 5;
    let dx = 0;
    let dy = 0;

    if (cursors.left.isDown) dx -= speed;
    if (cursors.right.isDown) dx += speed;
    if (cursors.up.isDown) dy -= speed;
    if (cursors.down.isDown) dy += speed;

    if (dx !== 0 || dy !== 0) {
      if (this.room) {
        const myContainer = this.players.get(this.room.sessionId);
        if (myContainer) {
          const nextX = myContainer.x + dx;
          const nextY = myContainer.y + dy;
          myContainer.x = nextX;
          myContainer.y = nextY;
          this.room.send('move', { x: nextX, y: nextY });
        }
      } else {
        const localContainer = this.players.get('local');
        if (localContainer) {
          localContainer.x += dx;
          localContainer.y += dy;
        }
      }
    }
  }
}
