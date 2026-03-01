import Phaser from 'phaser'
import { config } from './config'
import GameScene from './scenes/GameScene'

config.scene = [GameScene]

let game: Phaser.Game | null = null

export function initGame(containerId: string): Phaser.Game {
  const parent = document.getElementById(containerId)
  if (!parent) throw new Error(`Container #${containerId} not found`)
  if (game) {
    game.destroy(true)
  }
  game = new Phaser.Game({ ...config, parent: containerId })
  return game
}

export function destroyGame() {
  if (game) {
    game.destroy(true)
    game = null
  }
}
