import Phaser from 'phaser'
import type { Types } from 'phaser'

export const TILE_SIZE = 32
export const GRID_COLS = 15
export const GRID_ROWS = 15
export const GAME_WIDTH = TILE_SIZE * GRID_COLS
export const GAME_HEIGHT = TILE_SIZE * GRID_ROWS

export const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#c0c0c0',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [],
}
