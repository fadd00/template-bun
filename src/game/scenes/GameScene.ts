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
  basePalletX: number;
  basePalletY: number;
  inWorkspace: boolean;
}

export class GameScene extends Scene {
  private level!: LevelDef;
  private levelIndex: number = 0;
  
  private palletArea!: Geom.Rectangle;
  private workspaceArea!: Geom.Rectangle;
  
  private palletContainer!: GameObjects.Container;
  private workspaceContainer!: GameObjects.Container;
  
  private palletScrollY: number = 0;
  private workspaceScrollY: number = 0;
  private maxPalletScroll: number = 0;
  private maxWorkspaceScroll: number = 0;
  
  private workspaceBlocks: LogicBlock[] = []; // top-level blocks in workspace
  private draggingBlock: LogicBlock | null = null;
  private lives: number = 3;

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
    
    // Containers
    this.palletContainer = this.add.container(0, 0);
    this.workspaceContainer = this.add.container(0, 0);
    
    // Masks for scrolling
    const palletMask = this.make.graphics();
    palletMask.fillStyle(0xffffff);
    palletMask.fillRect(this.palletArea.x, this.palletArea.y, this.palletArea.width, this.palletArea.height);
    this.palletContainer.setMask(palletMask.createGeometryMask());
    
    const wsMask = this.make.graphics();
    wsMask.fillStyle(0xffffff);
    wsMask.fillRect(this.workspaceArea.x, this.workspaceArea.y, this.workspaceArea.width, this.workspaceArea.height);
    this.workspaceContainer.setMask(wsMask.createGeometryMask());

    this.createPallet();
    this.createActionPanel();

    // Scroll Handler
    this.input.on('wheel', (pointer: Input.Pointer, gameObjects: any[], deltaX: number, deltaY: number) => {
        if (this.palletArea.contains(pointer.x, pointer.y)) {
            this.palletScrollY += deltaY;
            this.palletScrollY = PhaserMath.Clamp(this.palletScrollY, 0, this.maxPalletScroll);
            this.palletContainer.y = -this.palletScrollY;
        } else if (this.workspaceArea.contains(pointer.x, pointer.y)) {
            this.workspaceScrollY += deltaY;
            this.workspaceScrollY = PhaserMath.Clamp(this.workspaceScrollY, 0, this.maxWorkspaceScroll);
            this.workspaceContainer.y = -this.workspaceScrollY;
        }
    });

    // Drag Core Handlers
    this.input.on('dragstart', (pointer: Input.Pointer, gameObject: LogicBlock) => {
        this.draggingBlock = gameObject;
        gameObject.isDragging = true;
        
        let child: LogicBlock | null = gameObject;
        while(child) {
            const p = child.parentContainer;
            if (p) {
                const matrix = child.getWorldTransformMatrix();
                child.x = matrix.tx;
                child.y = matrix.ty;
                p.remove(child);
                this.add.existing(child);
            }
            this.children.bringToTop(child);
            child.startWorldX = child.x;
            child.startWorldY = child.y;
            child = child.nextBlock;
        }

        if (gameObject.prevBlock) {
             gameObject.prevBlock.nextBlock = null;
             gameObject.prevBlock = null;
        }
        
        this.workspaceBlocks = this.workspaceBlocks.filter(b => b !== gameObject);
        this.updateWorkspaceScrollBounds();
    });

    this.input.on('drag', (pointer: Input.Pointer, gameObject: LogicBlock, dragX: number, dragY: number) => {
        const dx = dragX - gameObject.startWorldX;
        const dy = dragY - gameObject.startWorldY;
        
        let child: LogicBlock | null = gameObject;
        while (child) {
            child.x = child.startWorldX + dx;
            child.y = child.startWorldY + dy;
            child = child.nextBlock;
        }
    });

    this.input.on('dragend', (pointer: Input.Pointer, gameObject: LogicBlock) => {
        this.draggingBlock = null;
        gameObject.isDragging = false;

        // Ensure rendering context
        if (this.workspaceArea.contains(gameObject.x, gameObject.y)) {
             let localX = gameObject.x - this.workspaceContainer.x;
             let localY = gameObject.y - this.workspaceContainer.y;
             let snapped = false;
             
             for (const root of this.workspaceBlocks) {
                 if (root === gameObject) continue;
                 
                 let tail: LogicBlock | null = root;
                 while (tail && tail.nextBlock) { tail = tail.nextBlock; }
                 
                 if (tail && PhaserMath.Distance.Between(localX, localY, tail.x, tail.y + BLOCK_HEIGHT) < SNAP_DISTANCE) {
                     localX = tail.x;
                     localY = tail.y + BLOCK_HEIGHT;
                     gameObject.prevBlock = tail;
                     tail.nextBlock = gameObject;
                     snapped = true; break;
                 }
                 
                 if (PhaserMath.Distance.Between(localX, localY, root.x, root.y - BLOCK_HEIGHT) < SNAP_DISTANCE) {
                     localX = root.x;
                     localY = root.y - BLOCK_HEIGHT;
                     gameObject.nextBlock = root;
                     root.prevBlock = gameObject;
                     
                     this.workspaceBlocks = this.workspaceBlocks.filter(b => b !== root);
                     this.workspaceBlocks.push(gameObject);
                     
                     snapped = true; break;
                 }
             }
             
             if (!snapped) {
                 this.workspaceBlocks.push(gameObject);
             }
             
             let child: LogicBlock | null = gameObject;
             let currLocalY = localY;
             while (child) {
                 this.workspaceContainer.add(child);
                 child.x = localX;
                 child.y = currLocalY;
                 child.inWorkspace = true;
                 currLocalY += BLOCK_HEIGHT;
                 child = child.nextBlock;
             }
        } else {
            // Revert back to Pallet if dropped outside Workspace area
            let child: LogicBlock | null = gameObject;
            while(child) {
                let next = child.nextBlock;
                this.palletContainer.add(child);
                child.x = child.basePalletX;
                child.y = child.basePalletY;
                child.nextBlock = null;
                child.prevBlock = null;
                child.inWorkspace = false;
                child = next;
            }
        }
        this.updateWorkspaceScrollBounds();
    });
  }

  private drawLayout() {
      const g = this.add.graphics();
      // Pallet
      g.fillStyle(0x1a242f, 1);
      g.fillRect(this.palletArea.x, this.palletArea.y, this.palletArea.width, this.palletArea.height);
      
      // Workspace (Base layer)
      g.fillStyle(0x0D1520, 1);
      g.fillRect(this.workspaceArea.x, this.workspaceArea.y, this.workspaceArea.width, this.workspaceArea.height);
      g.lineStyle(1, 0x1C2B3A, 0.6);
      g.strokeRect(this.workspaceArea.x, this.workspaceArea.y, this.workspaceArea.width, this.workspaceArea.height);
      
      // Title overlay (depth ensure)
      const titles = this.add.container(0, 0);
      const titleBg = this.add.graphics();
      titleBg.fillStyle(0x0D1520, 0.8);
      titleBg.fillRect(0, 0, this.scale.width, 70);
      
      const t1 = this.add.text(20, 20, "Pallet Blok (Scroll)", { fontSize: '20px', color: '#fff' });
      const t2 = this.add.text(this.workspaceArea.x + 20, 20, "Area Kerja (Scroll)", { fontSize: '20px', color: '#fff' });
      const t3 = this.add.text(this.workspaceArea.x + 20, 50, `${this.level.title}: ${this.level.description}`, { fontSize: '16px', color: '#aaa' });
      
      titles.add([titleBg, t1, t2, t3]);
      titles.setDepth(15);
  }

  private createPallet() {
       let yPos = 90;
       this.level.availableBlocks.forEach((blockDef) => {
             const block = this.createBlockVisual(20, yPos, blockDef);
             block.basePalletX = 20;
             block.basePalletY = yPos;
             block.inWorkspace = false;
             
             block.setInteractive();
             this.input.setDraggable(block);
             
             this.palletContainer.add(block);
             yPos += BLOCK_HEIGHT + BLOCK_SPACING;
       });
       
       this.maxPalletScroll = Math.max(0, yPos - this.palletArea.height + 40);
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

  private updateWorkspaceScrollBounds() {
      let maxY = 0;
      this.workspaceBlocks.forEach(root => {
          let tail: LogicBlock | null = root;
          while(tail.nextBlock) { tail = tail.nextBlock; }
          if (tail.y + BLOCK_HEIGHT > maxY) maxY = tail.y + BLOCK_HEIGHT;
      });
      
      this.maxWorkspaceScroll = Math.max(0, maxY - this.workspaceArea.height + 140);
      this.workspaceScrollY = PhaserMath.Clamp(this.workspaceScrollY, 0, this.maxWorkspaceScroll);
      this.workspaceContainer.y = -this.workspaceScrollY;
  }

  private createActionPanel() {
      const { width, height } = this.scale;
      const panelY = height - 80;

      const panel = this.add.container(0, panelY);
      panel.setDepth(20);

      const g = this.add.graphics();
      g.fillStyle(0x111b27, 1);
      g.fillRect(this.workspaceArea.x, 0, this.workspaceArea.width, 80);
      
      const btnRun = this.add.container(width - 150, 15);
      const bgRun = this.add.graphics();
      bgRun.fillStyle(0x2ECC71, 1);
      bgRun.fillRoundedRect(0, 0, 120, 50, 8);
      const txtRun = this.add.text(60, 25, "RUN", { fontSize: '24px', fontStyle: 'bold' }).setOrigin(0.5);
      btnRun.add([bgRun, txtRun]);
      btnRun.setSize(120, 50);
      btnRun.setInteractive({ useHandCursor: true });
      btnRun.on('pointerdown', () => this.runLogic());
      
      const btnReset = this.add.container(width - 300, 15);
      const bgReset = this.add.graphics();
      bgReset.fillStyle(0xE74C3C, 1);
      bgReset.fillRoundedRect(0, 0, 120, 50, 8);
      const txtReset = this.add.text(60, 25, "RESET", { fontSize: '24px', fontStyle: 'bold' }).setOrigin(0.5);
      btnReset.add([bgReset, txtReset]);
      btnReset.setSize(120, 50);
      btnReset.setInteractive({ useHandCursor: true });
      btnReset.on('pointerdown', () => this.resetWorkspace());
      
      panel.add([g, btnRun, btnReset]);

      if (this.level.hasLives) {
          const lTxt = this.add.text(this.workspaceArea.x + 20, 25, `❤️ Nyawa: ${this.lives}`, {
              fontSize: '24px',
              fontStyle: 'bold',
              color: '#ff4d4d'
          });
          panel.add(lTxt);
      }
  }
  
  private resetWorkspace() {
      // Loop over and return to Pallet
      this.workspaceBlocks.forEach(root => {
          let child: LogicBlock | null = root;
          while (child) {
              let next = child.nextBlock;
              this.palletContainer.add(child);
              child.x = child.basePalletX;
              child.y = child.basePalletY;
              child.nextBlock = null;
              child.prevBlock = null;
              child.inWorkspace = false;
              child = next;
          }
      });
      this.workspaceBlocks = [];
      this.updateWorkspaceScrollBounds();
      this.workspaceScrollY = 0;
      this.workspaceContainer.y = 0;
  }
  
  private runLogic() {
      if (this.workspaceBlocks.length === 0) return;

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
          message: percent === 100 ? "Sempurna" : (percent >= 80 ? "Cukup Baik" : "Urutan masih berantakan, coba lagi.")
      };
      
      if (!resultParams.success && this.level.hasLives) {
          resultParams.lives -= 1;
      }
      
      this.scene.start('ResultScene', resultParams);
  }
}
