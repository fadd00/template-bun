import { Scene, GameObjects, Input, Geom, Math as PhaserMath } from 'phaser';
import { LEVELS, LevelDef, BlockDef } from './levels';

const BLOCK_WIDTH = 250;
const BLOCK_HEIGHT = 60;
const BLOCK_SPACING = 15;
const SNAP_DISTANCE = 50;

interface LogicBlock extends GameObjects.Container {
  blockData: BlockDef;
  isDragging: boolean;
  nextBlock: LogicBlock | null;
  prevBlock: LogicBlock | null;
  startWorldX: number;
  startWorldY: number;
}

export class GameScene extends Scene {
  private level!: LevelDef;
  private levelIndex: number = 0;
  
  private palletArea!: Geom.Rectangle;
  private workspaceArea!: Geom.Rectangle;
  
  private availableBlocks: LogicBlock[] = [];
  private workspaceBlocks: LogicBlock[] = []; // top-level blocks in workspace
  
  private draggingBlock: LogicBlock | null = null;
  private lives: number = 3;
  private livesText!: GameObjects.Text;

  constructor() {
    super('GameScene');
  }

  init(data: { level?: number, lives?: number }) {
    this.levelIndex = data?.level ?? 0;
    this.level = LEVELS[this.levelIndex];
    if (this.level.hasLives) {
        this.lives = data?.lives ?? (this.level.maxLives ?? 3);
    }
  }

  create() {
    this.cameras.main.setBackgroundColor('#0D1520');
    
    const { width, height } = this.scale;
    this.palletArea = new Geom.Rectangle(0, 0, width * 0.35, height);
    this.workspaceArea = new Geom.Rectangle(width * 0.35, 0, width * 0.65, height - 80);

    this.drawLayout();
    this.createPallet();
    this.createActionPanel();

    this.input.on('dragstart', (pointer: Input.Pointer, gameObject: LogicBlock) => {
        this.children.bringToTop(gameObject);
        this.draggingBlock = gameObject;
        gameObject.isDragging = true;
        gameObject.startWorldX = gameObject.x;
        gameObject.startWorldY = gameObject.y;

        // Disconnect from parent/child
        if (gameObject.prevBlock) {
             gameObject.prevBlock.nextBlock = null;
             gameObject.prevBlock = null;
        }
        
        let child = gameObject.nextBlock;
        while (child) {
            this.children.bringToTop(child);
            child.startWorldX = child.x;
            child.startWorldY = child.y;
            child = child.nextBlock;
        }
        
        // Remove from workspace roots if it was one
        this.workspaceBlocks = this.workspaceBlocks.filter(b => b !== gameObject);
    });

    this.input.on('drag', (pointer: Input.Pointer, gameObject: LogicBlock, dragX: number, dragY: number) => {
        const dx = dragX - gameObject.startWorldX;
        const dy = dragY - gameObject.startWorldY;
        
        // Move dragging block
        gameObject.x = dragX;
        gameObject.y = dragY;

        // Move children
        let child = gameObject.nextBlock;
        while (child) {
            child.x = child.startWorldX + dx;
            child.y = child.startWorldY + dy;
            child = child.nextBlock;
        }
    });

    this.input.on('dragend', (pointer: Input.Pointer, gameObject: LogicBlock) => {
        this.draggingBlock = null;
        gameObject.isDragging = false;

        // check if in workspace
        if (this.workspaceArea.contains(gameObject.x, gameObject.y)) {
             let snapped = false;
             
             // find top-level blocks or tail blocks to snap
             for (const root of this.workspaceBlocks) {
                 if (root === gameObject) continue;
                 
                 let tail: LogicBlock | null = root;
                 while (tail && tail.nextBlock) {
                     tail = tail.nextBlock;
                 }
                 
                 if (tail && PhaserMath.Distance.Between(gameObject.x, gameObject.y, tail.x, tail.y + BLOCK_HEIGHT) < SNAP_DISTANCE) {
                     // Snap below tail
                     gameObject.x = tail.x;
                     gameObject.y = tail.y + BLOCK_HEIGHT;
                     gameObject.prevBlock = tail;
                     tail.nextBlock = gameObject;
                     snapped = true;
                     break;
                 }
                 
                 if (PhaserMath.Distance.Between(gameObject.x, gameObject.y, root.x, root.y - BLOCK_HEIGHT) < SNAP_DISTANCE) {
                     // Snap above root
                     gameObject.x = root.x;
                     gameObject.y = root.y - BLOCK_HEIGHT;
                     gameObject.nextBlock = root;
                     root.prevBlock = gameObject;
                     
                     // root is no longer a root, gameObject is the new root
                     this.workspaceBlocks = this.workspaceBlocks.filter(b => b !== root);
                     this.workspaceBlocks.push(gameObject);
                     
                     snapped = true;
                     break;
                 }
             }
             
             if (!snapped) {
                 this.workspaceBlocks.push(gameObject);
             }
             
             // Update child positions based on snapping
             let child = gameObject.nextBlock;
             let parent = gameObject;
             while (child) {
                 child.x = parent.x;
                 child.y = parent.y + BLOCK_HEIGHT;
                 parent = child;
                 child = child.nextBlock;
             }

        } else {
            // returned to pallet area - destroy this block chain
            let current: LogicBlock | null = gameObject;
            while(current) {
                let next = current.nextBlock;
                current.destroy();
                current = next;
            }
        }
    });
  }

  private drawLayout() {
      const g = this.add.graphics();
      // Pallet
      g.fillStyle(0x1a242f, 1);
      g.fillRect(this.palletArea.x, this.palletArea.y, this.palletArea.width, this.palletArea.height);
      
      // Workspace
      g.fillStyle(0x0D1520, 1);
      g.fillRect(this.workspaceArea.x, this.workspaceArea.y, this.workspaceArea.width, this.workspaceArea.height);
      g.lineStyle(1, 0x1C2B3A, 0.6);
      g.strokeRect(this.workspaceArea.x, this.workspaceArea.y, this.workspaceArea.width, this.workspaceArea.height);
      
      // Title
      this.add.text(20, 20, "Pallet (Pilihan Blok)", { fontSize: '20px', color: '#fff' });
      this.add.text(this.workspaceArea.x + 20, 20, "Workspace", { fontSize: '20px', color: '#fff' });
      
      this.add.text(this.workspaceArea.x + 20, 50, `${this.level.title}: ${this.level.description}`, { fontSize: '16px', color: '#aaa', wordWrap: { width: this.workspaceArea.width - 40 } });
  }

  private createPallet() {
       let yPos = 80;
       this.level.availableBlocks.forEach((blockDef) => {
             const palletBlock = this.createBlockVisual(20, yPos, blockDef);
             palletBlock.setInteractive();
             
             palletBlock.on('pointerdown', () => {
                  const clone = this.createBlockVisual(this.input.x, this.input.y, blockDef);
                  clone.setInteractive();
                  this.input.setDraggable(clone);
                  this.input.emit('dragstart', this.input.activePointer, clone);
             });
             yPos += BLOCK_HEIGHT + BLOCK_SPACING;
       });
  }
  
  private createBlockVisual(x: number, y: number, blockDef: BlockDef): LogicBlock {
      const container = this.add.container(x, y) as LogicBlock;
      container.blockData = blockDef;
      container.isDragging = false;
      container.nextBlock = null;
      container.prevBlock = null;
      
      const bg = this.add.graphics();
      bg.fillStyle(0x4A90D9, 1);
      bg.fillRoundedRect(0, 0, BLOCK_WIDTH, BLOCK_HEIGHT, 8);
      bg.lineStyle(2, 0xffffff, 0.8);
      bg.strokeRoundedRect(0, 0, BLOCK_WIDTH, BLOCK_HEIGHT, 8);
      
      const txt = this.add.text(15, BLOCK_HEIGHT / 2, blockDef.label, {
          fontSize: '16px',
          color: '#fff',
      }).setOrigin(0, 0.5);
      
      container.add([bg, txt]);
      container.setSize(BLOCK_WIDTH, BLOCK_HEIGHT);
      
      return container;
  }

  private createActionPanel() {
      const { width, height } = this.scale;
      const panelY = height - 80;

      const g = this.add.graphics();
      g.fillStyle(0x111b27, 1);
      g.fillRect(this.workspaceArea.x, panelY, this.workspaceArea.width, 80);
      
      const btnRun = this.add.container(width - 150, panelY + 15);
      const bgRun = this.add.graphics();
      bgRun.fillStyle(0x2ECC71, 1);
      bgRun.fillRoundedRect(0, 0, 120, 50, 8);
      const txtRun = this.add.text(60, 25, "RUN", { fontSize: '24px', fontStyle: 'bold' }).setOrigin(0.5);
      btnRun.add([bgRun, txtRun]);
      btnRun.setSize(120, 50);
      btnRun.setInteractive({ useHandCursor: true });
      btnRun.on('pointerdown', () => this.runLogic());
      
      const btnReset = this.add.container(width - 300, panelY + 15);
      const bgReset = this.add.graphics();
      bgReset.fillStyle(0xE74C3C, 1);
      bgReset.fillRoundedRect(0, 0, 120, 50, 8);
      const txtReset = this.add.text(60, 25, "RESET", { fontSize: '24px', fontStyle: 'bold' }).setOrigin(0.5);
      btnReset.add([bgReset, txtReset]);
      btnReset.setSize(120, 50);
      btnReset.setInteractive({ useHandCursor: true });
      btnReset.on('pointerdown', () => this.resetWorkspace());
      
      if (this.level.hasLives) {
          this.livesText = this.add.text(this.workspaceArea.x + 20, panelY + 25, `❤️ Nyawa: ${this.lives}`, {
              fontSize: '24px',
              fontStyle: 'bold',
              color: '#ff4d4d'
          });
      }
  }
  
  private resetWorkspace() {
      const destroyChain = (block: LogicBlock | null) => {
          while (block) {
              const next = block.nextBlock;
              block.destroy();
              block = next;
          }
      };
      this.workspaceBlocks.forEach(destroyChain);
      this.workspaceBlocks = [];
  }
  
  private runLogic() {
      let longestChain: LogicBlock | null = null;
      let maxLen = 0;
      
      for (const root of this.workspaceBlocks) {
           let len = 0;
           let curr: LogicBlock | null = root;
           while(curr) {
               len++;
               curr = curr.nextBlock;
           }
           if (len > maxLen) {
               maxLen = len;
               longestChain = root;
           }
      }
      
      const userSequence: string[] = [];
      let curr = longestChain;
      while(curr) {
          userSequence.push(curr.blockData.id);
          curr = curr.nextBlock;
      }
      
      const ideal = this.level.idealSequence;
      let matches = 0;
      for (let i = 0; i < Math.max(ideal.length, userSequence.length); i++) {
          if (ideal[i] && userSequence[i] && ideal[i] === userSequence[i]) {
              matches++;
          }
      }
      
      let percent = ideal.length > 0 ? Math.floor((matches / ideal.length) * 100) : 0;
      
      let resultParams = {
          level: this.levelIndex,
          score: percent,
          success: percent >= 80,
          lives: this.lives,
          message: percent === 100 ? "Sempurna!" : (percent >= 80 ? "Cukup Baik!" : "Urutan masih berantakan, coba lagi.")
      };
      
      if (!resultParams.success && this.level.hasLives) {
          resultParams.lives -= 1;
      }
      
      this.scene.start('ResultScene', resultParams);
  }
}
