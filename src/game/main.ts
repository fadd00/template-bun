import { Game, AUTO, Types, Scale } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { MainMenu } from './scenes/MainMenu';
import { GameScene } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';

const config: Types.Core.GameConfig = {
  type: AUTO,
  width: 1024,
  height: 600,
  backgroundColor: '#0D1520',
  parent: 'game-container',
  scale: {
    mode: Scale.FIT,
    autoCenter: Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [Preloader, MainMenu, GameScene, ResultScene],
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

export default StartGame;