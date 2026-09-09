import Phaser from 'phaser';

export class GroundDropVisualEntity {
    public id: string;
    public itemId: number;
    public currentX: number;
    public currentY: number;

    public container: Phaser.GameObjects.Container;
    public icon: Phaser.GameObjects.Graphics;
    public nameText: Phaser.GameObjects.Text;

    private scene: Phaser.Scene;
    private pickupRequested = false;

    constructor(
        scene: Phaser.Scene,
        id: string,
        itemId: number,
        itemName: string,
        quantity: number,
        x: number,
        y: number,
    ) {
        this.scene = scene;

        this.id = id;
        this.itemId = itemId;
        this.currentX = x;
        this.currentY = y;

        this.container = scene.add.container(x, y);
        this.container.setDepth(10);

        // ─────────────────────────────────────────────────────────
        // ICON
        // ─────────────────────────────────────────────────────────

        this.icon = scene.add.graphics();

        this.icon.fillStyle(
            0xd4a017,
            1,
        );

        this.icon.fillRect(
            -7,
            -7,
            14,
            14,
        );

        this.icon.lineStyle(
            2,
            0x000000,
            1,
        );

        this.icon.strokeRect(
            -7,
            -7,
            14,
            14,
        );

        // ─────────────────────────────────────────────────────────
        // NAME
        // ─────────────────────────────────────────────────────────

        this.nameText = scene.add.text(
            0,
            -18,
            quantity > 1
                ? `${itemName} x${quantity}`
                : itemName,
            {
                fontSize: '10px',
                color: '#ffe082',
                backgroundColor: '#000000aa',
                padding: {
                    x: 3,
                    y: 2,
                },
            },
        ).setOrigin(0.5);

        this.container.add([
            this.icon,
            this.nameText,
        ]);

        // ─────────────────────────────────────────────────────────
        // INTERACTION
        // ─────────────────────────────────────────────────────────

        this.container.setSize(
            28,
            28,
        );

        this.container.setInteractive({
            useHandCursor: true,
        });

        this.container.on(
            'pointerdown',
            () => {
                this.pickup();
            },
        );
    }

    // ─────────────────────────────────────────────────────────────
    // PICKUP
    // ─────────────────────────────────────────────────────────────

    private pickup() {
        console.log(
            `[GroundDropVisualEntity] pickupRequested BEFORE: ${this.pickupRequested}`,
        );
        if (this.pickupRequested) {
            return;
        }

        this.pickupRequested = true;

        const room =
            (this.scene as any).room;

        if (!room) {
            console.warn(
                `[GroundDropVisualEntity] Cannot pickup ${this.id}: room unavailable.`,
            );

            this.pickupRequested = false;

            return;
        }

        console.log(
            `[GroundDropVisualEntity] Pickup requested: ${this.id}`,
        );

        room.send(
            "pickupDrop",
            {
                dropId: this.id,
            },
        );
        this.pickupRequested = true;

        console.log(
            `[GroundDropVisualEntity] pickupRequested AFTER: ${this.pickupRequested}`,
        );
    }

    // ─────────────────────────────────────────────────────────────
    // POSITION
    // ─────────────────────────────────────────────────────────────

    public updatePosition(
        x: number,
        y: number,
    ) {
        this.currentX = x;
        this.currentY = y;

        this.container.setPosition(
            x,
            y,
        );
    }

    // ─────────────────────────────────────────────────────────────
    // DESTROY
    // ─────────────────────────────────────────────────────────────

    public destroy() {
        this.container.destroy();
    }
}