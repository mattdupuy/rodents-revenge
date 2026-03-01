import { useEffect, useRef } from 'react'
import { initGame, destroyGame } from '../game'

interface GameCanvasProps {
  onBackToMenu: () => void
}

export function GameCanvas({ onBackToMenu }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initGame('game-container')
    return () => destroyGame()
  }, [])

  return (
    <div className="game-wrapper">
      <div className="game-header">
        <button type="button" onClick={onBackToMenu} className="win-button">
          ← Back to Menu
        </button>
        <span className="game-title">Rodent&apos;s Revenge</span>
      </div>
      <div ref={containerRef} id="game-container" className="game-container" />
      <p className="game-instructions">
        Use arrow keys to move. Each level has 3 waves of 1–3 cats. Squash them by pushing blocks!
      </p>
    </div>
  )
}
