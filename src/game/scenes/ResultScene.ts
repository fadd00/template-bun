import { Scene } from 'phaser';
import { LEVELS } from './levels';

export class ResultScene extends Scene {
    constructor() {
        super('ResultScene');
    }

    init(data: { level: number; score: number; success: boolean; lives: number; message: string }) {
        this.data.set('payload', data);
    }

    create() {
        const { width, height } = this.scale;
        const cx = width / 2;
        const cy = height / 2;
        const payload = this.data.get('payload') as {
            level: number;
            score: number;
            success: boolean;
            lives: number;
            message: string;
        };

        const currentLevel = LEVELS[payload.level];

        this.cameras.main.setBackgroundColor('#0D1520');

        // Score Text
        this.add.text(cx, 100, payload.success ? "BERHASIL!" : "GAGAL", {
            fontSize: '48px',
            fontStyle: 'bold',
            color: payload.success ? '#2ECC71' : '#E74C3C'
        }).setOrigin(0.5);

        this.add.text(cx, 160, `Skor: ${payload.score}%`, {
            fontSize: '32px',
            color: '#fff'
        }).setOrigin(0.5);

        this.add.text(cx, 210, payload.message, {
            fontSize: '24px',
            color: '#aaa',
            align: 'center',
            wordWrap: { width: width - 100 }
        }).setOrigin(0.5);

        // Optional logic for Lives
        if (currentLevel.hasLives && payload.lives <= 0 && !payload.success) {
             this.add.text(cx, 260, "GAME OVER! Nyawa Habis.", {
                 fontSize: '32px',
                 fontStyle: 'bold',
                 color: '#E74C3C'
             }).setOrigin(0.5);
             
             this.makeButton(cx, 400, "KEMBALI KE MENU", () => this.scene.start('MainMenu'), 0x3498DB);
             return;
        }

        if (currentLevel.hasLives && !payload.success) {
             this.add.text(cx, 260, `Sisa Nyawa: ${payload.lives}`, {
                 fontSize: '24px',
                 color: '#ff4d4d'
             }).setOrigin(0.5);
        }

        // Buttons
        if (payload.success) {
            const nextIdx = payload.level + 1;
            if (nextIdx < LEVELS.length) {
                this.makeButton(cx, 360, "LEVEL SELANJUTNYA", () => this.scene.start('GameScene', { level: nextIdx }), 0x2ECC71);
            } else {
                this.add.text(cx, 360, "Selamat! Semua Level Selesai.", { fontSize: '24px', color: '#F1C40F' }).setOrigin(0.5);
            }
        } else {
            this.makeButton(cx, 360, "COBA LAGI", () => this.scene.start('GameScene', { level: payload.level, lives: payload.lives }), 0xE67E22);
        }

        this.makeButton(cx, 440, "MAIN MENU", () => this.scene.start('MainMenu'), 0x95A5A6);
    }

    private makeButton(x: number, y: number, label: string, cb: () => void, color: number) {
        const btn = this.add.container(x, y);
        const bg = this.add.graphics();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-150, -25, 300, 50, 8);
        
        const txt = this.add.text(0, 0, label, {
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#fff'
        }).setOrigin(0.5);

        btn.add([bg, txt]);
        btn.setSize(300, 50);
        btn.setInteractive({ useHandCursor: true });
        
        bg.on('pointerover', () => { bg.setAlpha(0.8); });
        bg.on('pointerout', () => { bg.setAlpha(1); });
        btn.on('pointerdown', cb);
    }
}
