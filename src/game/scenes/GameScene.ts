import { Scene, GameObjects, Math as PhaserMath, Time, Input } from 'phaser';
import { LEVELS, LevelDef, CommandKey, Direction } from './levels';

const TILE_SIZE = 60;
const CARD_W = 110;
const CARD_H = 56;
const SLOT_W = 130;
const SLOT_H = 64;
const SLOT_GAP = 12;
const EXEC_DELAY = 600; // ms per step

const CMD_LABELS: Record<CommandKey, string> = {
  cmd_move: 'MOVE',
  cmd_turn_left: 'TURN\nLEFT',
  cmd_turn_right: 'TURN\nRIGHT',
  cmd_jump: 'JUMP',
  cmd_wait: 'WAIT',
  cmd_repeat: 'REPEAT',
};

const CMD_COLORS: Record<CommandKey, number> = {
  cmd_move: 0x4A90D9,
  cmd_turn_left: 0x7B68EE,
  cmd_turn_right: 0x9B59B6,
  cmd_jump: 0x2ECC71,
  cmd_wait: 0x607D9A,
  cmd_repeat: 0xE67E22,
};

const DIR_ANGLE: Record<Direction, number> = {
  right: 0,
  down: 90,
  left: 180,
  up: 270,
};

const DIR_DELTA: Record<Direction, { dc: number; dr: number }> = {
  right: { dc: 1, dr: 0 },
  left: { dc: -1, dr: 0 },
  up: { dc: 0, dr: -1 },
  down: { dc: 0, dr: 1 },
};

const TURN_LEFT: Record<Direction, Direction> = {
  right: 'up', up: 'left', left: 'down', down: 'right',
};
const TURN_RIGHT: Record<Direction, Direction> = {
  right: 'down', down: 'left', left: 'up', up: 'right',
};

interface SlotState {
  command: CommandKey | null;
  container: GameObjects.Container;
  bg: GameObjects.Graphics;
  label: GameObjects.Text | null;
  index: number;
}

interface DragCard {
  key: CommandKey;
  container: GameObjects.Container;
  originX: number;
  originY: number;
  fromSlot: number | null; // null = from palette
}

export class GameScene extends Scene {
  private level!: LevelDef;
  private levelIndex: number = 0;

  // Grid
  private gridOffsetX: number = 0;
  private gridOffsetY: number = 0;

  // Player
  private playerGfx!: GameObjects.Container;
  private playerCol: number = 0;
  private playerRow: number = 0;
  private playerFacing: Direction = 'right';

  // Slots (1x4 command sequence)
  private slots: SlotState[] = [];
  private slotsContainer!: GameObjects.Container;

  // Palette cards
  private paletteCards: DragCard[] = [];
  private paletteContainer!: GameObjects.Container;

  // Drag state
  private dragging: DragCard | null = null;
  private dragProxy: GameObjects.Container | null = null;

  // Execution
  private isRunning: boolean = false;
  private executionTimer: Time.TimerEvent | null = null;

  // UI
  private runBtn!: GameObjects.Container;
  private resetBtn!: GameObjects.Container;
  private statusText!: GameObjects.Text;
  private stepIndicators: GameObjects.Graphics[] = [];

  constructor() {
    super('GameScene');
  }

  init(data: { level?: number }) {
    this.levelIndex = data?.level ?? 0;
    this.level = LEVELS[this.levelIndex];
  }

  create() {
    this.cameras.main.setBackgroundColor('#0D1520');
    this.isRunning = false;

    this.drawBackground();
    this.drawGrid();
    this.createPlayer();
    this.createSlots();
    this.createPalette();
    this.createButtons();
    this.createStatusBar();
    this.createLevelHeader();

    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
  }

  // ─── Background ──────────────────────────────────────────────────────────────

  private drawBackground() {
    const { width, height } = this.scale;
    const g = this.add.graphics();
    g.lineStyle(1, 0x1C2B3A, 0.6);
    for (let x = 0; x < width; x += 40) g.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 40) g.lineBetween(0, y, width, y);
  }

  // ─── Grid ────────────────────────────────────────────────────────────────────

  private drawGrid() {
    const { width, height } = this.scale;
    const grid = this.level.grid;
    const rows = grid.length;
    const cols = grid[0].length;

    const gridW = cols * TILE_SIZE;
    const gridH = rows * TILE_SIZE;

    // Center grid in the right portion (right of slots panel)
    const slotsAreaW = 200;
    const availW = width - slotsAreaW - 40;
    this.gridOffsetX = slotsAreaW + (availW - gridW) / 2;
    this.gridOffsetY = (height - gridH) / 2 - 20;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = this.gridOffsetX + c * TILE_SIZE;
        const y = this.gridOffsetY + r * TILE_SIZE;
        const cell = grid[r][c];

        const g = this.add.graphics();
        if (cell === 1) {
          // Wall
          g.fillStyle(0x0D1520, 1);
          g.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          g.lineStyle(1, 0x1A2332, 1);
          g.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
          // Hatching
          g.lineStyle(1, 0x151F2D, 1);
          for (let i = -TILE_SIZE; i < TILE_SIZE * 2; i += 12) {
            g.lineBetween(x + i, y, x + i + TILE_SIZE, y + TILE_SIZE);
          }
        } else if (cell === 2) {
          // Hole
          g.fillStyle(0x050B12, 1);
          g.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          g.lineStyle(1.5, 0x1A2332, 1);
          g.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
          // Hole visual
          g.fillStyle(0x000000, 1);
          g.fillCircle(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 18);
          g.lineStyle(1, 0x243447, 1);
          g.strokeCircle(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 18);
        } else {
          // Walkable
          g.fillStyle(0x1C2B3A, 1);
          g.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          g.lineStyle(1, 0x243447, 1);
          g.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // Draw goal
    const goal = this.level.goal;
    const gx = this.gridOffsetX + goal.col * TILE_SIZE + TILE_SIZE / 2;
    const gy = this.gridOffsetY + goal.row * TILE_SIZE + TILE_SIZE / 2;
    const goalGfx = this.add.graphics();
    goalGfx.fillStyle(0xF1C40F, 0.25);
    goalGfx.fillCircle(gx, gy, 22);
    goalGfx.lineStyle(2, 0xF1C40F, 0.8);
    goalGfx.strokeCircle(gx, gy, 22);
    // Star
    goalGfx.fillStyle(0xF1C40F, 1);
    goalGfx.fillCircle(gx, gy, 6);

    const goalText = this.add.text(gx, gy + 28, 'GOAL', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#F1C40F',
    }).setOrigin(0.5);
    goalText.setAlpha(0.7);
  }

  // ─── Player ───────────────────────────────────────────────────────────────────

  private createPlayer() {
    const ps = this.level.playerStart;
    this.playerCol = ps.col;
    this.playerRow = ps.row;
    this.playerFacing = ps.facing;

    const g = this.add.graphics();
    // Body
    g.fillStyle(0xFFFFFF, 1);
    g.fillRoundedRect(-18, -18, 36, 36, 6);
    // Direction arrow
    g.fillStyle(0x0D1520, 1);
    g.fillTriangle(-6, -8, 10, 0, -6, 8);

    this.playerGfx = this.add.container(0, 0, [g]);
    this.snapPlayerToGrid();
    this.playerGfx.setRotation(PhaserMath.DegToRad(DIR_ANGLE[this.playerFacing]));
    this.playerGfx.setDepth(10);
  }

  private snapPlayerToGrid() {
    const x = this.gridOffsetX + this.playerCol * TILE_SIZE + TILE_SIZE / 2;
    const y = this.gridOffsetY + this.playerRow * TILE_SIZE + TILE_SIZE / 2;
    this.playerGfx.setPosition(x, y);
  }

  // ─── Slots (1x4 sequence panel) ──────────────────────────────────────────────

  private createSlots() {
    const { height } = this.scale;
    const count = this.level.slots;
    const totalH = count * (SLOT_H + SLOT_GAP) - SLOT_GAP;
    const startY = (height - totalH) / 2;
    const slotX = 40;

    this.slotsContainer = this.add.container(0, 0);
    this.slots = [];

    // Panel label
    this.add.text(slotX + SLOT_W / 2, startY - 32, 'SEQUENCE', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#607D9A',
      letterSpacing: 3,
    }).setOrigin(0.5);

    for (let i = 0; i < count; i++) {
      const y = startY + i * (SLOT_H + SLOT_GAP);
      const bg = this.add.graphics();
      this.drawSlotBg(bg, slotX, y, false);

      // Step number
      const stepNum = this.add.text(slotX - 18, y + SLOT_H / 2, `${i + 1}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#3A5070',
      }).setOrigin(0.5);

      // Step indicator dot
      const dot = this.add.graphics();
      dot.fillStyle(0x3A5070, 1);
      dot.fillCircle(slotX + SLOT_W + 10, y + SLOT_H / 2, 4);
      this.stepIndicators.push(dot);

      const container = this.add.container(0, 0, [bg, stepNum, dot]);
      this.slotsContainer.add(container);

      this.slots.push({
        command: null,
        container,
        bg,
        label: null,
        index: i,
      });

      // Make slot interactive as drop zone
      const zone = this.add.zone(slotX + SLOT_W / 2, y + SLOT_H / 2, SLOT_W, SLOT_H);
      zone.setInteractive();
      zone.setData('slotIndex', i);
      zone.setData('slotX', slotX);
      zone.setData('slotY', y);
    }
  }

  private drawSlotBg(g: GameObjects.Graphics, x: number, y: number, filled: boolean) {
    g.clear();
    if (filled) {
      g.fillStyle(0x1E3A5F, 1);
      g.lineStyle(1.5, 0x4A90D9, 0.8);
    } else {
      g.fillStyle(0x141E2B, 1);
      g.lineStyle(1.5, 0x2A3D52, 1);
    }
    g.fillRoundedRect(x, y, SLOT_W, SLOT_H, 8);
    g.strokeRoundedRect(x, y, SLOT_W, SLOT_H, 8);
  }

  // ─── Palette ─────────────────────────────────────────────────────────────────

  private createPalette() {
    const { width, height } = this.scale;
    const cmds = this.level.availableCommands;
    const paletteX = width - 160;
    const cardGap = 12;
    const totalH = cmds.length * (CARD_H + cardGap) - cardGap;
    const startY = (height - totalH) / 2;

    this.paletteContainer = this.add.container(0, 0);

    // Palette label
    this.add.text(paletteX + CARD_W / 2, startY - 32, 'COMMANDS', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#607D9A',
      letterSpacing: 3,
    }).setOrigin(0.5);

    cmds.forEach((key: CommandKey, i: number) => {
      const x = paletteX;
      const y = startY + i * (CARD_H + cardGap);
      const card = this.makeCard(key, x, y);
      card.fromSlot = null;
      card.originX = x + CARD_W / 2;
      card.originY = y + CARD_H / 2;
      this.paletteCards.push(card);
      this.paletteContainer.add(card.container);
    });
  }

  private makeCard(key: CommandKey, x: number, y: number): DragCard {
    const color = CMD_COLORS[key];
    const label = CMD_LABELS[key];

    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRoundedRect(0, 0, CARD_W, CARD_H, 8);
    g.fillStyle(0xffffff, 0.08);
    g.fillRoundedRect(0, 0, CARD_W, CARD_H / 2, 8);
    g.fillRect(0, CARD_H / 2 - 4, CARD_W, 4);
    g.lineStyle(1, 0xffffff, 0.2);
    g.strokeRoundedRect(0, 0, CARD_W, CARD_H, 8);

    const txt = this.add.text(CARD_W / 2, CARD_H / 2, label, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#FFFFFF',
      align: 'center',
      lineSpacing: 2,
    }).setOrigin(0.5);

    const container = this.add.container(x, y, [g, txt]);
    container.setSize(CARD_W, CARD_H);
    container.setInteractive({ cursor: 'grab' });
    container.setDepth(5);

    const card: DragCard = {
      key,
      container,
      originX: x + CARD_W / 2,
      originY: y + CARD_H / 2,
      fromSlot: null,
    };

    container.on('pointerdown', (ptr: Input.Pointer) => {
      if (this.isRunning) return;
      this.startDrag(card, ptr);
    });

    container.on('pointerover', () => {
      if (!this.isRunning) {
        g.clear();
        g.fillStyle(color, 1);
        g.fillRoundedRect(0, 0, CARD_W, CARD_H, 8);
        g.fillStyle(0xffffff, 0.18);
        g.fillRoundedRect(0, 0, CARD_W, CARD_H / 2, 8);
        g.fillRect(0, CARD_H / 2 - 4, CARD_W, 4);
        g.lineStyle(1.5, 0xffffff, 0.5);
        g.strokeRoundedRect(0, 0, CARD_W, CARD_H, 8);
      }
    });

    container.on('pointerout', () => {
      g.clear();
      g.fillStyle(color, 1);
      g.fillRoundedRect(0, 0, CARD_W, CARD_H, 8);
      g.fillStyle(0xffffff, 0.08);
      g.fillRoundedRect(0, 0, CARD_W, CARD_H / 2, 8);
      g.fillRect(0, CARD_H / 2 - 4, CARD_W, 4);
      g.lineStyle(1, 0xffffff, 0.2);
      g.strokeRoundedRect(0, 0, CARD_W, CARD_H, 8);
    });

    return card;
  }

  // ─── Drag ────────────────────────────────────────────────────────────────────

  private startDrag(card: DragCard, ptr: Input.Pointer) {
    // If dragging from slot, clear that slot
    if (card.fromSlot !== null) {
      const slot = this.slots[card.fromSlot];
      slot.command = null;
      slot.label?.destroy();
      slot.label = null;
      this.drawSlotBg(slot.bg, 40, this.getSlotY(card.fromSlot), false);
    }

    // Create ghost proxy
    this.dragging = card;
    card.container.setAlpha(0.4);
    card.container.setDepth(1);

    this.dragProxy = this.makeCard(card.key, ptr.x - CARD_W / 2, ptr.y - CARD_H / 2).container;
    this.dragProxy.setDepth(20);
    this.dragProxy.setAlpha(0.95);
  }

  private onPointerMove(ptr: Input.Pointer) {
    if (!this.dragging || !this.dragProxy) return;
    this.dragProxy.setPosition(ptr.x - CARD_W / 2, ptr.y - CARD_H / 2);
  }

  private onPointerUp(ptr: Input.Pointer) {
    if (!this.dragging || !this.dragProxy) return;

    const dropped = this.getSlotAtPointer(ptr.x, ptr.y);

    if (dropped !== -1) {
      this.dropIntoSlot(this.dragging, dropped);
    } else {
      // Return to origin
      this.dragging.container.setAlpha(1);
      this.dragging.container.setDepth(5);
      this.dragging.container.setPosition(
        this.dragging.originX - CARD_W / 2,
        this.dragging.originY - CARD_H / 2
      );
    }

    this.dragProxy.destroy();
    this.dragProxy = null;
    this.dragging = null;
  }

  private getSlotAtPointer(px: number, py: number): number {
    const slotX = 40;
    for (let i = 0; i < this.slots.length; i++) {
      const sy = this.getSlotY(i);
      if (px >= slotX && px <= slotX + SLOT_W && py >= sy && py <= sy + SLOT_H) {
        return i;
      }
    }
    return -1;
  }

  private getSlotY(index: number): number {
    const { height } = this.scale;
    const count = this.level.slots;
    const totalH = count * (SLOT_H + SLOT_GAP) - SLOT_GAP;
    const startY = (height - totalH) / 2;
    return startY + index * (SLOT_H + SLOT_GAP);
  }

  private dropIntoSlot(card: DragCard, slotIdx: number) {
    const slot = this.slots[slotIdx];
    const slotX = 40;
    const slotY = this.getSlotY(slotIdx);

    // Clear previous command in slot
    if (slot.command !== null) {
      slot.label?.destroy();
      slot.label = null;
    }

    // Place command
    slot.command = card.key;
    this.drawSlotBg(slot.bg, slotX, slotY, true);

    // Add label inside slot
    const color = CMD_COLORS[card.key];
    const lbl = CMD_LABELS[card.key];

    const slotG = this.add.graphics();
    slotG.fillStyle(color, 1);
    slotG.fillRoundedRect(slotX + 8, slotY + 8, SLOT_W - 16, SLOT_H - 16, 6);
    slotG.fillStyle(0xffffff, 0.08);
    slotG.fillRoundedRect(slotX + 8, slotY + 8, SLOT_W - 16, (SLOT_H - 16) / 2, 6);
    slotG.lineStyle(1, 0xffffff, 0.2);
    slotG.strokeRoundedRect(slotX + 8, slotY + 8, SLOT_W - 16, SLOT_H - 16, 6);

    const slotLbl = this.add.text(slotX + SLOT_W / 2, slotY + SLOT_H / 2, lbl, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#FFFFFF',
      align: 'center',
      lineSpacing: 2,
    }).setOrigin(0.5);

    const slotContainer = this.add.container(0, 0, [slotG, slotLbl]);
    slotContainer.setSize(SLOT_W - 16, SLOT_H - 16);
    slotContainer.setInteractive({ cursor: 'grab' });
    slotContainer.setDepth(5);

    // Store ref to destroy later
    slot.label = slotLbl; // reuse field for cleanup

    // Allow dragging from slot
    const slotCard: DragCard = {
      key: card.key,
      container: slotContainer,
      originX: slotX + SLOT_W / 2,
      originY: slotY + SLOT_H / 2,
      fromSlot: slotIdx,
    };

    slotContainer.on('pointerdown', (ptr: Input.Pointer) => {
      if (this.isRunning) return;
      // Destroy the inline graphics before dragging
      slotG.destroy();
      slotLbl.destroy();
      slot.label = null;
      this.startDrag(slotCard, ptr);
    });

    // Reset source card
    card.container.setAlpha(1);
    card.container.setDepth(5);
    card.container.setPosition(card.originX - CARD_W / 2, card.originY - CARD_H / 2);

    this.slotsContainer.add(slotContainer);
  }

  // ─── Buttons ──────────────────────────────────────────────────────────────────

  private createButtons() {
    const { height } = this.scale;
    const btnY = height - 50;
    const cx = (40 + SLOT_W) / 2 + 20;

    // RUN
    const runG = this.add.graphics();
    runG.fillStyle(0x27AE60, 1);
    runG.fillRoundedRect(-60, -22, 120, 44, 8);

    const runTxt = this.add.text(0, 0, '▶  RUN', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#FFFFFF',
      letterSpacing: 2,
    }).setOrigin(0.5);

    this.runBtn = this.add.container(cx - 30, btnY, [runG, runTxt]);
    this.runBtn.setSize(120, 44);
    this.runBtn.setInteractive({ cursor: 'pointer' });
    this.runBtn.on('pointerdown', () => this.runSequence());
    this.runBtn.on('pointerover', () => {
      runG.clear();
      runG.fillStyle(0x2ECC71, 1);
      runG.fillRoundedRect(-60, -22, 120, 44, 8);
    });
    this.runBtn.on('pointerout', () => {
      runG.clear();
      runG.fillStyle(0x27AE60, 1);
      runG.fillRoundedRect(-60, -22, 120, 44, 8);
    });

    // RESET
    const resetG = this.add.graphics();
    resetG.fillStyle(0xC0392B, 1);
    resetG.fillRoundedRect(-55, -20, 110, 40, 8);

    const resetTxt = this.add.text(0, 0, '↺  RESET', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#FFFFFF',
      letterSpacing: 2,
    }).setOrigin(0.5);

    this.resetBtn = this.add.container(cx + 95, btnY, [resetG, resetTxt]);
    this.resetBtn.setSize(110, 40);
    this.resetBtn.setInteractive({ cursor: 'pointer' });
    this.resetBtn.on('pointerdown', () => this.resetLevel());
    this.resetBtn.on('pointerover', () => {
      resetG.clear();
      resetG.fillStyle(0xE74C3C, 1);
      resetG.fillRoundedRect(-55, -20, 110, 40, 8);
    });
    this.resetBtn.on('pointerout', () => {
      resetG.clear();
      resetG.fillStyle(0xC0392B, 1);
      resetG.fillRoundedRect(-55, -20, 110, 40, 8);
    });
  }

  private createStatusBar() {
    const { width, height } = this.scale;
    this.statusText = this.add.text(width / 2, height - 20, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#607D9A',
    }).setOrigin(0.5).setDepth(20);
  }

  private createLevelHeader() {
    const { width } = this.scale;
    const cx = width / 2;

    this.add.text(cx, 22, `LEVEL ${this.levelIndex + 1}  —  ${this.level.title.toUpperCase()}`, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#4A90D9',
      letterSpacing: 3,
    }).setOrigin(0.5);

    this.add.text(cx, 42, this.level.hint, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#3A5070',
    }).setOrigin(0.5);
  }

  // ─── Execution Engine ────────────────────────────────────────────────────────

  private runSequence() {
    if (this.isRunning) return;

    const commands = this.slots.map(s => s.command).filter(Boolean) as CommandKey[];
    if (commands.length === 0) {
      this.setStatus('Add commands to the sequence first!', '#E74C3C');
      return;
    }

    this.isRunning = true;
    this.runBtn.setAlpha(0.4);

    // Reset player to start
    this.playerCol = this.level.playerStart.col;
    this.playerRow = this.level.playerStart.row;
    this.playerFacing = this.level.playerStart.facing;
    this.snapPlayerToGrid();
    this.playerGfx.setRotation(PhaserMath.DegToRad(DIR_ANGLE[this.playerFacing]));

    this.executeStep(commands, 0);
  }

  private executeStep(commands: CommandKey[], idx: number) {
    if (idx >= commands.length) {
      this.checkWin();
      return;
    }

    // Highlight step
    this.highlightStep(idx);
    const cmd = commands[idx];
    this.setStatus(`Executing: ${CMD_LABELS[cmd].replace('\n', ' ')}`, '#4A90D9');

    this.executionTimer = this.time.delayedCall(EXEC_DELAY, () => {
      this.applyCommand(cmd);
      this.executeStep(commands, idx + 1);
    });
  }

  private highlightStep(idx: number) {
    this.stepIndicators.forEach((dot, i) => {
      dot.clear();
      if (i === idx) {
        dot.fillStyle(0x4A90D9, 1);
        dot.fillCircle(40 + SLOT_W + 10, this.getSlotY(i) + SLOT_H / 2, 6);
      } else if (i < idx) {
        dot.fillStyle(0x27AE60, 1);
        dot.fillCircle(40 + SLOT_W + 10, this.getSlotY(i) + SLOT_H / 2, 4);
      } else {
        dot.fillStyle(0x3A5070, 1);
        dot.fillCircle(40 + SLOT_W + 10, this.getSlotY(i) + SLOT_H / 2, 4);
      }
    });
  }

  private applyCommand(cmd: CommandKey) {
    const grid = this.level.grid;

    switch (cmd) {
      case 'cmd_move': {
        const d = DIR_DELTA[this.playerFacing];
        const nc = this.playerCol + d.dc;
        const nr = this.playerRow + d.dr;
        if (this.isWalkable(grid, nr, nc)) {
          this.playerCol = nc;
          this.playerRow = nr;
          this.tweens.add({
            targets: this.playerGfx,
            x: this.gridOffsetX + nc * TILE_SIZE + TILE_SIZE / 2,
            y: this.gridOffsetY + nr * TILE_SIZE + TILE_SIZE / 2,
            duration: EXEC_DELAY * 0.7,
            ease: 'Power2',
          });
        } else {
          // Bump animation
          const tx = this.gridOffsetX + nc * TILE_SIZE + TILE_SIZE / 2;
          const ty = this.gridOffsetY + nr * TILE_SIZE + TILE_SIZE / 2;
          const ox = this.playerGfx.x;
          const oy = this.playerGfx.y;
          this.tweens.add({
            targets: this.playerGfx,
            x: ox + (tx - ox) * 0.3,
            y: oy + (ty - oy) * 0.3,
            duration: EXEC_DELAY * 0.25,
            ease: 'Power2',
            yoyo: true,
          });
        }
        break;
      }
      case 'cmd_turn_left': {
        this.playerFacing = TURN_LEFT[this.playerFacing];
        this.tweens.add({
          targets: this.playerGfx,
          rotation: PhaserMath.DegToRad(DIR_ANGLE[this.playerFacing]),
          duration: EXEC_DELAY * 0.5,
          ease: 'Power2',
        });
        break;
      }
      case 'cmd_turn_right': {
        this.playerFacing = TURN_RIGHT[this.playerFacing];
        this.tweens.add({
          targets: this.playerGfx,
          rotation: PhaserMath.DegToRad(DIR_ANGLE[this.playerFacing]),
          duration: EXEC_DELAY * 0.5,
          ease: 'Power2',
        });
        break;
      }
      case 'cmd_jump': {
        const d = DIR_DELTA[this.playerFacing];
        const nc = this.playerCol + d.dc * 2;
        const nr = this.playerRow + d.dr * 2;
        if (this.isWalkable(grid, nr, nc)) {
          this.playerCol = nc;
          this.playerRow = nr;
          this.tweens.add({
            targets: this.playerGfx,
            x: this.gridOffsetX + nc * TILE_SIZE + TILE_SIZE / 2,
            y: this.gridOffsetY + nr * TILE_SIZE + TILE_SIZE / 2,
            duration: EXEC_DELAY * 0.7,
            ease: 'Power2',
          });
          // Scale bounce
          this.tweens.add({
            targets: this.playerGfx,
            scaleX: 1.3,
            scaleY: 0.7,
            duration: EXEC_DELAY * 0.35,
            ease: 'Power2',
            yoyo: true,
          });
        }
        break;
      }
      case 'cmd_wait':
        // Do nothing
        break;
      case 'cmd_repeat':
        // TODO: implement repeat logic
        break;
    }
  }

  private isWalkable(grid: number[][], row: number, col: number): boolean {
    if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length) return false;
    return grid[row][col] !== 1; // 0 = walkable, 2 = hole (can be jumped over)
  }

  private checkWin() {
    const goal = this.level.goal;
    const won = this.playerCol === goal.col && this.playerRow === goal.row;

    this.isRunning = false;
    this.runBtn.setAlpha(1);
    this.stepIndicators.forEach((dot, i) => {
      dot.clear();
      dot.fillStyle(0x3A5070, 1);
      dot.fillCircle(40 + SLOT_W + 10, this.getSlotY(i) + SLOT_H / 2, 4);
    });

    if (won) {
      this.setStatus('✓  ALGORITHM CORRECT!', '#27AE60');
      this.showWinOverlay();
    } else {
      this.setStatus('✗  Goal not reached. Try again!', '#E74C3C');
      // Shake player
      this.tweens.add({
        targets: this.playerGfx,
        x: this.playerGfx.x + 8,
        duration: 60,
        ease: 'Linear',
        yoyo: true,
        repeat: 4,
        onComplete: () => this.snapPlayerToGrid(),
      });
    }
  }

  private showWinOverlay() {
    const { width, height } = this.scale;
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(30).setAlpha(0);

    this.tweens.add({ targets: overlay, alpha: 1, duration: 300 });

    const panel = this.add.graphics();
    panel.fillStyle(0x0D1520, 1);
    panel.fillRoundedRect(width / 2 - 200, height / 2 - 120, 400, 240, 12);
    panel.lineStyle(1.5, 0x27AE60, 1);
    panel.strokeRoundedRect(width / 2 - 200, height / 2 - 120, 400, 240, 12);
    panel.setDepth(31).setAlpha(0);
    this.tweens.add({ targets: panel, alpha: 1, duration: 300, delay: 100 });

    this.add.text(width / 2, height / 2 - 70, 'ALGORITHM CORRECT', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#27AE60',
      letterSpacing: 4,
    }).setOrigin(0.5).setDepth(32).setAlpha(0);

    this.add.text(width / 2, height / 2 - 30, `Level ${this.levelIndex + 1} Complete`, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#607D9A',
    }).setOrigin(0.5).setDepth(32).setAlpha(0);

    const hasNext = this.levelIndex + 1 < LEVELS.length;

    if (hasNext) {
      const nextG = this.add.graphics();
      nextG.fillStyle(0x4A90D9, 1);
      nextG.fillRoundedRect(width / 2 - 90, height / 2 + 30, 180, 44, 8);

      const nextTxt = this.add.text(width / 2, height / 2 + 52, 'NEXT LEVEL  →', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#FFFFFF',
        letterSpacing: 2,
      }).setOrigin(0.5);

      const nextZone = this.add.zone(width / 2, height / 2 + 52, 180, 44).setInteractive({ cursor: 'pointer' });
      nextZone.on('pointerdown', () => {
        this.scene.start('GameScene', { level: this.levelIndex + 1 });
      });

      [nextG, nextTxt, nextZone].forEach(o => (o as any).setDepth?.(32));
    }

    const menuG = this.add.graphics();
    menuG.fillStyle(0x1C2B3A, 1);
    menuG.fillRoundedRect(width / 2 - 70, height / 2 + (hasNext ? 84 : 30), 140, 38, 8);

    this.add.text(width / 2, height / 2 + (hasNext ? 103 : 49), 'MAIN MENU', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#607D9A',
      letterSpacing: 2,
    }).setOrigin(0.5);

    const menuZone = this.add.zone(width / 2, height / 2 + (hasNext ? 103 : 49), 140, 38).setInteractive({ cursor: 'pointer' });
    menuZone.on('pointerdown', () => this.scene.start('MainMenu'));

    [overlay, panel].forEach(o => o.setDepth(30));
  }

  private setStatus(msg: string, color: string = '#607D9A') {
    this.statusText.setText(msg).setColor(color);
  }

  private resetLevel() {
    if (this.executionTimer) this.executionTimer.remove();
    this.scene.restart({ level: this.levelIndex });
  }
}