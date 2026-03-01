import Phaser from 'phaser'
import { TILE_SIZE, GRID_COLS, GRID_ROWS, GAME_WIDTH, GAME_HEIGHT } from '../config'

const Cell = {
  Empty: 0,
  Stone: 1, // fixed wall (not pushable)
  Block: 2, // movable block (pushable)
  Cat: 3,
  Mouse: 4,
} as const

type Cell = (typeof Cell)[keyof typeof Cell]

const WAVES_PER_LEVEL = 3
const MIN_CATS_PER_WAVE = 1
const MAX_CATS_PER_WAVE = 3

export default class GameScene extends Phaser.Scene {
  private gridGraphics!: Phaser.GameObjects.Graphics
  private mouseSprite!: Phaser.GameObjects.Rectangle
  private stoneSprites: Phaser.GameObjects.Rectangle[] = []
  private blockSprites: Map<string, Phaser.GameObjects.Rectangle> = new Map()
  private catSprites: Map<string, Phaser.GameObjects.Rectangle> = new Map()
  private grid: Cell[][] = []
  private mouseX = 0
  private mouseY = 0
  private waveIndex = 0
  private hudText!: Phaser.GameObjects.Text
  private inputEnabled = true
  private catTimer?: Phaser.Time.TimerEvent

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    this.gridGraphics = this.add.graphics()
    this.drawGrid()

    // HUD
    this.hudText = this.add
      .text(8, 6, '', {
        fontFamily: 'MS Sans Serif, Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#000',
        backgroundColor: '#c0c0c0',
        padding: { left: 6, right: 6, top: 4, bottom: 4 },
      })
      .setDepth(10)

    // Level 1 (for now): 15x15 board, stone border, mouse centered
    this.startLevel1()

    // Keyboard input (arrow keys like the original)
    const keyLeft = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT)
    const keyRight = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)
    const keyUp = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP)
    const keyDown = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN)

    keyLeft.on('down', () => this.tryMove(-1, 0))
    keyRight.on('down', () => this.tryMove(1, 0))
    keyUp.on('down', () => this.tryMove(0, -1))
    keyDown.on('down', () => this.tryMove(0, 1))
  }

  private drawGrid() {
    this.gridGraphics.clear()
    this.gridGraphics.lineStyle(1, 0x808080, 1)
    for (let x = 0; x <= GRID_COLS; x++) {
      this.gridGraphics.lineBetween(x * TILE_SIZE, 0, x * TILE_SIZE, GAME_HEIGHT)
    }
    for (let y = 0; y <= GRID_ROWS; y++) {
      this.gridGraphics.lineBetween(0, y * TILE_SIZE, GAME_WIDTH, y * TILE_SIZE)
    }
  }

  private startLevel1() {
    this.resetWorld()

    // Initialize empty grid
    for (let y = 0; y < GRID_ROWS; y++) {
      this.grid[y] = []
      for (let x = 0; x < GRID_COLS; x++) {
        this.grid[y][x] = Cell.Empty
      }
    }

    // Fixed stones: border walls (default layout, does not move)
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const isBorder = x === 0 || y === 0 || x === GRID_COLS - 1 || y === GRID_ROWS - 1
        if (!isBorder) continue
        this.placeStone(x, y)
      }
    }

    // Place mouse (player) in center
    this.mouseX = Math.floor(GRID_COLS / 2)
    this.mouseY = Math.floor(GRID_ROWS / 2)
    this.grid[this.mouseY][this.mouseX] = Cell.Mouse
    this.mouseSprite = this.add
      .rectangle(
        this.mouseX * TILE_SIZE + TILE_SIZE / 2,
        this.mouseY * TILE_SIZE + TILE_SIZE / 2,
        TILE_SIZE - 4,
        TILE_SIZE - 4,
        0x8b4513
      )
      .setOrigin(0.5)

    // Place some movable blocks (these can change during play)
    this.placeRandomBlocks(18)

    // Start wave system (3 iterations of cats)
    this.waveIndex = 0
    this.spawnNextWave()
    this.updateHud()
  }

  private resetWorld() {
    if (this.catTimer) {
      this.catTimer.remove()
      this.catTimer = undefined
    }

    for (const r of this.stoneSprites) r.destroy()
    this.stoneSprites = []

    for (const r of this.blockSprites.values()) r.destroy()
    this.blockSprites.clear()

    for (const r of this.catSprites.values()) r.destroy()
    this.catSprites.clear()

    if (this.mouseSprite) this.mouseSprite.destroy()
    this.inputEnabled = true
  }

  private key(x: number, y: number) {
    return `${x},${y}`
  }

  private placeStone(x: number, y: number) {
    this.grid[y][x] = Cell.Stone
    const stone = this.add
      .rectangle(
        x * TILE_SIZE + TILE_SIZE / 2,
        y * TILE_SIZE + TILE_SIZE / 2,
        TILE_SIZE - 4,
        TILE_SIZE - 4,
        0x4a4a4a
      )
      .setOrigin(0.5)
    this.stoneSprites.push(stone)
  }

  private placeBlock(x: number, y: number) {
    this.grid[y][x] = Cell.Block
    const block = this.add
      .rectangle(
        x * TILE_SIZE + TILE_SIZE / 2,
        y * TILE_SIZE + TILE_SIZE / 2,
        TILE_SIZE - 4,
        TILE_SIZE - 4,
        0x6b6b6b
      )
      .setOrigin(0.5)
    this.blockSprites.set(this.key(x, y), block)
  }

  private placeCat(x: number, y: number) {
    this.grid[y][x] = Cell.Cat
    const cat = this.add
      .rectangle(
        x * TILE_SIZE + TILE_SIZE / 2,
        y * TILE_SIZE + TILE_SIZE / 2,
        TILE_SIZE - 4,
        TILE_SIZE - 4,
        0xff6600
      )
      .setOrigin(0.5)
    this.catSprites.set(this.key(x, y), cat)
  }

  private getRandomEmptyCell(): { x: number; y: number } | null {
    // avoid infinite loops by limiting tries
    for (let i = 0; i < 200; i++) {
      const x = Phaser.Math.Between(1, GRID_COLS - 2)
      const y = Phaser.Math.Between(1, GRID_ROWS - 2)
      if (this.grid[y][x] === Cell.Empty) return { x, y }
    }
    return null
  }

  private placeRandomBlocks(count: number) {
    for (let i = 0; i < count; i++) {
      const cell = this.getRandomEmptyCell()
      if (!cell) return
      // don't place a block on the mouse
      if (cell.x === this.mouseX && cell.y === this.mouseY) continue
      this.placeBlock(cell.x, cell.y)
    }
  }

  private spawnNextWave() {
    // Clear cats from previous wave (should already be cleared, but keep safe)
    for (const r of this.catSprites.values()) r.destroy()
    this.catSprites.clear()
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        if (this.grid[y][x] === Cell.Cat) this.grid[y][x] = Cell.Empty
      }
    }

    const catsThisWave = Phaser.Math.Between(MIN_CATS_PER_WAVE, MAX_CATS_PER_WAVE)
    for (let i = 0; i < catsThisWave; i++) {
      const cell = this.getRandomEmptyCell()
      if (!cell) break
      // don’t spawn on mouse
      if (cell.x === this.mouseX && cell.y === this.mouseY) continue
      this.placeCat(cell.x, cell.y)
    }

    // Start cat movement timer if not already running
    if (!this.catTimer) {
      this.catTimer = this.time.addEvent({
        delay: 1000,
        loop: true,
        callback: this.stepCats,
        callbackScope: this,
      })
    }
  }

  private updateHud() {
    const waveLabel = `Wave ${Math.min(this.waveIndex + 1, WAVES_PER_LEVEL)}/${WAVES_PER_LEVEL}`
    const catsLeft = this.catSprites.size
    this.hudText.setText(`Level 1  |  ${waveLabel}  |  Cats: ${catsLeft}`)
  }

  private onWaveCleared() {
    if (this.waveIndex < WAVES_PER_LEVEL - 1) {
      this.waveIndex += 1
      this.spawnNextWave()
      this.updateHud()
      return
    }

    this.onAllLevelsCompleted()
  }

  private onAllLevelsCompleted() {
    this.inputEnabled = false
    if (this.catTimer) {
      this.catTimer.remove()
      this.catTimer = undefined
    }
    this.updateHud()

    const winText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'You won!', {
        fontFamily: 'MS Sans Serif, Segoe UI, sans-serif',
        fontSize: '32px',
        color: '#000',
        backgroundColor: '#c0c0c0',
        padding: { left: 12, right: 12, top: 10, bottom: 10 },
      })
      .setOrigin(0.5)
      .setDepth(20)

    this.tweens.add({
      targets: winText,
      y: winText.y - 6,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    })
  }

  private onPlayerCaught() {
    this.inputEnabled = false
    if (this.catTimer) {
      this.catTimer.remove()
      this.catTimer = undefined
    }

    this.hudText.setText('You were caught!')

    const loseText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'You were caught!', {
        fontFamily: 'MS Sans Serif, Segoe UI, sans-serif',
        fontSize: '28px',
        color: '#000',
        backgroundColor: '#c0c0c0',
        padding: { left: 12, right: 12, top: 10, bottom: 10 },
      })
      .setOrigin(0.5)
      .setDepth(20)

    this.tweens.add({
      targets: loseText,
      y: loseText.y - 4,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    })
  }

  private tryMove(dx: number, dy: number) {
    if (!this.inputEnabled) return

    const targetX = this.mouseX + dx
    const targetY = this.mouseY + dy

    if (targetX < 0 || targetX >= GRID_COLS || targetY < 0 || targetY >= GRID_ROWS) return

    const targetCell = this.grid[targetY][targetX]
    if (targetCell === Cell.Empty) {
      // Empty - move
      this.moveMouse(targetX, targetY)
    } else if (targetCell === Cell.Block) {
      // Movable blocks in a line – push all consecutive blocks until they hit a stone / edge

      // 1) Collect all consecutive blocks in this direction
      const line: { x: number; y: number }[] = []
      let bx = targetX
      let by = targetY

      while (
        bx >= 0 &&
        bx < GRID_COLS &&
        by >= 0 &&
        by < GRID_ROWS &&
        this.grid[by][bx] === Cell.Block
      ) {
        line.push({ x: bx, y: by })
        bx += dx
        by += dy
      }

      // Now (bx, by) is the first non-block cell in that direction
      if (bx < 0 || bx >= GRID_COLS || by < 0 || by >= GRID_ROWS) {
        // Hit the edge of the board: cannot push
        return
      }

      const endCell = this.grid[by][bx]

      // Cannot push blocks into stone or the mouse
      if (endCell === Cell.Stone || endCell === Cell.Mouse) {
        return
      }

      // If there's a cat at the end, squash it and treat as empty
      if (endCell === Cell.Cat) {
        this.squashCat(bx, by)
      }

      // Now the end cell must be empty to allow pushing
      if (this.grid[by][bx] !== Cell.Empty) {
        return
      }

      // 2) Move all blocks one step forward, from farthest to closest
      for (let i = line.length - 1; i >= 0; i -= 1) {
        const from = line[i]
        const toX = from.x + dx
        const toY = from.y + dy
        this.pushBlock(from.x, from.y, toX, toY)
      }

      // 3) Finally move the mouse into the first block position
      this.moveMouse(targetX, targetY)
    }
    // Stone wall / cat: can't walk into it
  }

  private moveMouse(nx: number, ny: number) {
    this.grid[this.mouseY][this.mouseX] = Cell.Empty
    this.mouseX = nx
    this.mouseY = ny
    this.grid[ny][nx] = Cell.Mouse
    this.mouseSprite.setPosition(nx * TILE_SIZE + TILE_SIZE / 2, ny * TILE_SIZE + TILE_SIZE / 2)
  }

  private pushBlock(fromX: number, fromY: number, toX: number, toY: number) {
    const fromKey = this.key(fromX, fromY)
    const block = this.blockSprites.get(fromKey)
    if (!block) return

    this.blockSprites.delete(fromKey)
    this.grid[fromY][fromX] = Cell.Empty
    this.grid[toY][toX] = Cell.Block

    const toKey = this.key(toX, toY)
    this.blockSprites.set(toKey, block)
    block.setPosition(toX * TILE_SIZE + TILE_SIZE / 2, toY * TILE_SIZE + TILE_SIZE / 2)
  }

  private stepCats() {
    if (!this.inputEnabled) return
    if (this.catSprites.size === 0) return

    type MovePlan = { fromX: number; fromY: number; toX: number; toY: number }
    const plans: MovePlan[] = []
    const reservedTargets = new Set<string>()

    const directions = [
      { dx: 1, dy: 0 },
      { dx: 1, dy: 1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: -1, dy: -1 },
      { dx: 0, dy: -1 },
      { dx: 1, dy: -1 },
    ]

    for (const [key] of this.catSprites.entries()) {
      const [xs, ys] = key.split(',')
      const cx = Number(xs)
      const cy = Number(ys)

      type Candidate = { x: number; y: number; dist: number }
      const candidates: Candidate[] = []

      for (const dir of directions) {
        const nx = cx + dir.dx
        const ny = cy + dir.dy

        if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) continue

        const cell = this.grid[ny][nx]
        // Cats cannot move through stone, blocks, or other cats
        if (cell === Cell.Stone || cell === Cell.Block || cell === Cell.Cat) continue

        const dist = Math.abs(nx - this.mouseX) + Math.abs(ny - this.mouseY)
        candidates.push({ x: nx, y: ny, dist })
      }

      // if no candidates, skip
      if (candidates.length === 0) {
        continue
      }

      // Choose the candidate with minimal distance (tie-breaker: first in list)
      candidates.sort((a, b) => a.dist - b.dist)
      const chosen = candidates[0]

      // If moving directly into the mouse, handle capture immediately
      if (chosen.x === this.mouseX && chosen.y === this.mouseY) {
        const fromKey = this.key(cx, cy)
        const cat = this.catSprites.get(fromKey)
        if (cat) {
          this.catSprites.delete(fromKey)
          this.grid[cy][cx] = Cell.Empty
          this.grid[this.mouseY][this.mouseX] = Cell.Cat
          cat.setPosition(
            this.mouseX * TILE_SIZE + TILE_SIZE / 2,
            this.mouseY * TILE_SIZE + TILE_SIZE / 2,
          )
        }
        this.onPlayerCaught()
        return
      }

      const targetKey = this.key(chosen.x, chosen.y)
      if (reservedTargets.has(targetKey)) {
        // Another cat already plans to move here this tick
        continue
      }

      reservedTargets.add(targetKey)
      plans.push({ fromX: cx, fromY: cy, toX: chosen.x, toY: chosen.y })
    }

    // Apply all planned moves
    for (const plan of plans) {
      const fromKey = this.key(plan.fromX, plan.fromY)
      const toKey = this.key(plan.toX, plan.toY)
      const cat = this.catSprites.get(fromKey)
      if (!cat) continue

      this.catSprites.delete(fromKey)
      this.catSprites.set(toKey, cat)

      if (this.grid[plan.fromY][plan.fromX] === Cell.Cat) {
        this.grid[plan.fromY][plan.fromX] = Cell.Empty
      }
      // Target cell should be empty or mouse (mouse case handled above),
      // so we safely set it to cat here.
      this.grid[plan.toY][plan.toX] = Cell.Cat

      cat.setPosition(
        plan.toX * TILE_SIZE + TILE_SIZE / 2,
        plan.toY * TILE_SIZE + TILE_SIZE / 2,
      )
    }
  }

  private squashCat(gx: number, gy: number) {
    const catKey = this.key(gx, gy)
    const cat = this.catSprites.get(catKey)
    if (!cat) return

    cat.destroy()
    this.catSprites.delete(catKey)
    this.grid[gy][gx] = Cell.Empty

    this.updateHud()
    if (this.catSprites.size === 0) {
      this.onWaveCleared()
    }
  }
}
