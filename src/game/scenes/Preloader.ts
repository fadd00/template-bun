import { Scene } from 'phaser';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  preload() {
    // Generate semua assets pakai Graphics (no external files needed)
    this.createItemTextures();
    this.createUITextures();
  }

  private createItemTextures() {
    const items = [
      { key: 'cmd_move',       color: 0x4A90D9, label: 'MOVE' },
      { key: 'cmd_turn_left',  color: 0x7B68EE, label: 'TURN\nLEFT' },
      { key: 'cmd_turn_right', color: 0x9B59B6, label: 'TURN\nRIGHT' },
      { key: 'cmd_jump',       color: 0x2ECC71, label: 'JUMP' },
      { key: 'cmd_wait',       color: 0x95A5A6, label: 'WAIT' },
      { key: 'cmd_repeat',     color: 0xE67E22, label: 'REPEAT' },
    ];

    items.forEach(({ key, color }) => {
      const g = this.make.graphics({ x: 0, y: 0 }, false);

      // Card background
      g.fillStyle(color, 1);
      g.fillRoundedRect(0, 0, 100, 52, 8);

      // Subtle top highlight
      g.fillStyle(0xffffff, 0.15);
      g.fillRoundedRect(0, 0, 100, 26, 8);
      g.fillStyle(0xffffff, 0.15);
      g.fillRect(0, 18, 100, 8);

      // Border
      g.lineStyle(1.5, 0xffffff, 0.3);
      g.strokeRoundedRect(0, 0, 100, 52, 8);

      g.generateTexture(key, 100, 52);
      g.destroy();

      // Text label on texture via BitmapText workaround — we'll draw in scene
    });

    // Generate goal/flag texture
    const gGoal = this.make.graphics({ x: 0, y: 0 }, false);
    gGoal.fillStyle(0xF1C40F, 1);
    gGoal.fillCircle(24, 24, 24);
    gGoal.lineStyle(2, 0xE6AC00, 1);
    gGoal.strokeCircle(24, 24, 24);
    gGoal.generateTexture('goal', 48, 48);
    gGoal.destroy();

    // Player texture
    const gPlayer = this.make.graphics({ x: 0, y: 0 }, false);
    gPlayer.fillStyle(0xFFFFFF, 1);
    gPlayer.fillRoundedRect(0, 0, 36, 36, 6);
    gPlayer.fillStyle(0x2C3E50, 1);
    // Arrow pointing right (default facing)
    gPlayer.fillTriangle(10, 18, 26, 10, 26, 26);
    gPlayer.generateTexture('player', 36, 36);
    gPlayer.destroy();

    // Slot texture
    const gSlot = this.make.graphics({ x: 0, y: 0 }, false);
    gSlot.fillStyle(0x1A2332, 1);
    gSlot.fillRoundedRect(0, 0, 120, 60, 8);
    gSlot.lineStyle(1.5, 0x3A5070, 1);
    gSlot.strokeRoundedRect(0, 0, 120, 60, 8);
    gSlot.generateTexture('slot_empty', 120, 60);
    gSlot.destroy();

    const gSlotFilled = this.make.graphics({ x: 0, y: 0 }, false);
    gSlotFilled.fillStyle(0x1E3A5F, 1);
    gSlotFilled.fillRoundedRect(0, 0, 120, 60, 8);
    gSlotFilled.lineStyle(1.5, 0x4A90D9, 1);
    gSlotFilled.strokeRoundedRect(0, 0, 120, 60, 8);
    gSlotFilled.generateTexture('slot_filled', 120, 60);
    gSlotFilled.destroy();

    // Grid tile
    const gTile = this.make.graphics({ x: 0, y: 0 }, false);
    gTile.fillStyle(0x1C2B3A, 1);
    gTile.fillRect(0, 0, 60, 60);
    gTile.lineStyle(1, 0x243447, 1);
    gTile.strokeRect(0, 0, 60, 60);
    gTile.generateTexture('tile', 60, 60);
    gTile.destroy();

    // Wall tile
    const gWall = this.make.graphics({ x: 0, y: 0 }, false);
    gWall.fillStyle(0x0D1520, 1);
    gWall.fillRect(0, 0, 60, 60);
    gWall.lineStyle(1, 0x1A2332, 1);
    gWall.strokeRect(0, 0, 60, 60);
    gWall.generateTexture('wall', 60, 60);
    gWall.destroy();
  }

  private createUITextures() {
    // Run button
    const gRun = this.make.graphics({ x: 0, y: 0 }, false);
    gRun.fillStyle(0x27AE60, 1);
    gRun.fillRoundedRect(0, 0, 140, 44, 8);
    gRun.fillStyle(0xffffff, 0.1);
    gRun.fillRoundedRect(0, 0, 140, 22, 8);
    gRun.fillRect(0, 14, 140, 8);
    gRun.generateTexture('btn_run', 140, 44);
    gRun.destroy();

    const gReset = this.make.graphics({ x: 0, y: 0 }, false);
    gReset.fillStyle(0xE74C3C, 1);
    gReset.fillRoundedRect(0, 0, 140, 44, 8);
    gReset.generateTexture('btn_reset', 140, 44);
    gReset.destroy();
  }

  create() {
    this.scene.start('MainMenu');
  }
}