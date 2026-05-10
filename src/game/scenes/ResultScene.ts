import { Scene } from 'phaser';

export class ResultScene extends Scene {
    constructor() {
        super('ResultScene');
    }

    init(data: { success: boolean; nextLevel: number | null; levelTitle: string }) {
        this.data.set('payload', data);
    }

    create() {
        const { width, height } = this.scale;
        const cx = width / 2;
        const payload = this.data.get('payload') as {
            success: boolean;
            nextLevel: number | null;
            levelTitle: string;
        };

        this.add.rectangle(0, 0, width, height, 0x0f0f0f).setOrigin(0);

        // Subtle grid
        const bg = this.add.graphics();
        bg.lineStyle(1, 0x1a1a1a, 1);
        for (let x = 0; x < width; x += 40) bg.lineBetween(x, 0, x, height);
        for (let y = 0; y < height; y += 40) bg.lineBetween(0, y, width, y);

        if (payload.success) {
            this.add.text(cx, 160, '✓', {
                fontFamily: 'monospace', fontSize: '64px', color: '#3a7a3a',
            }).setOrigin(0.5);

            this.add.text(cx, 250, 'ALGORITHM CORRECT', {
                fontFamily: 'monospace', fontSize: '24px', color: '#f0f0f0', letterSpacing: 8,
            }).setOrigin(0.5);

            this.add.text(cx, 295, payload.levelTitle + ' complete.', {
                fontFamily: 'monospace', fontSize: '12px', color: '#444444', letterSpacing: 3,
            }).setOrigin(0.5);

            if (payload.nextLevel !== null) {
                this.makeButton(cx, 380, '[ NEXT LEVEL ]', () => {
                    this.scene.start('GameScene', { level: payload.nextLevel });
                });
            } else {
                this.add.text(cx, 370, 'all levels complete.', {
                    fontFamily: 'monospace', fontSize: '14px', color: '#555555', letterSpacing: 3,
                }).setOrigin(0.5);
            }
        } else {
            this.add.text(cx, 220, '×', {
                fontFamily: 'monospace', fontSize: '64px', color: '#7a3a3a',
            }).setOrigin(0.5);

            this.add.text(cx, 300, 'INCORRECT', {
                fontFamily: 'monospace', fontSize: '24px', color: '#f0f0f0', letterSpacing: 8,
            }).setOrigin(0.5);
        }

        this.makeButton(cx, 450, '[ MAIN MENU ]', () => {
            this.scene.start('MainMenu');
        }, true);
    }

    private makeButton(x: number, y: number, label: string, cb: () => void, ghost = false) {
        const bg = this.add.rectangle(x, y, 200, 44, ghost ? 0x1a1a1a : 0xf0f0f0)
            .setStrokeStyle(1, ghost ? 0x333333 : 0x000000)
            .setInteractive({ useHandCursor: true });

        this.add.text(x, y, label, {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: ghost ? '#555555' : '#0f0f0f',
            letterSpacing: 4,
        }).setOrigin(0.5);

        bg.on('pointerover', () => {
            bg.setFillStyle(ghost ? 0x2a2a2a : 0xcccccc);
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(ghost ? 0x1a1a1a : 0xf0f0f0);
        });
        bg.on('pointerdown', cb);
    }
}