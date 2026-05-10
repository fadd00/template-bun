import { Scene } from 'phaser';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;
        const cx = width / 2;

        // Background
        this.add.rectangle(0, 0, width, height, 0x0f0f0f).setOrigin(0);

        // Subtle grid lines
        const grid = this.add.graphics();
        grid.lineStyle(1, 0x1a1a1a, 1);
        for (let x = 0; x < width; x += 40) grid.lineBetween(x, 0, x, height);
        for (let y = 0; y < height; y += 40) grid.lineBetween(0, y, width, y);

        // Title
        this.add.text(cx, 180, 'ALGO.SORT', {
            fontFamily: 'monospace',
            fontSize: '52px',
            color: '#f0f0f0',
            letterSpacing: 12,
        }).setOrigin(0.5);

        this.add.text(cx, 240, 'drag commands. build the algorithm. run it.', {
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#555555',
            letterSpacing: 3,
        }).setOrigin(0.5);

        // Start button
        const btnBg = this.add.rectangle(cx, 340, 180, 48, 0x1a1a1a)
            .setInteractive({ useHandCursor: true })
            .setStrokeStyle(1, 0x444444);

        const btnText = this.add.text(cx, 340, '[ START ]', {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#f0f0f0',
            letterSpacing: 4,
        }).setOrigin(0.5);

        btnBg.on('pointerover', () => {
            btnBg.setFillStyle(0xf0f0f0);
            btnText.setColor('#0f0f0f');
        });
        btnBg.on('pointerout', () => {
            btnBg.setFillStyle(0x1a1a1a);
            btnText.setColor('#f0f0f0');
        });
        btnBg.on('pointerdown', () => {
            this.scene.start('GameScene', { level: 0 });
        });

        // Level indicator
        this.add.text(cx, 420, 'LEVEL 01 / MOVE THE DOT', {
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#333333',
            letterSpacing: 3,
        }).setOrigin(0.5);
    }
}