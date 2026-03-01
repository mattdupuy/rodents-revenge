interface MainMenuProps {
  onStartGame: () => void
}

export function MainMenu({ onStartGame }: MainMenuProps) {
  return (
    <div className="window main-menu-window">
      <div className="title-bar">
        <div className="title-bar-text">Rodent&apos;s Revenge</div>
        <div className="title-bar-controls">
          <button type="button" aria-label="Minimize" />
          <button type="button" aria-label="Maximize" />
          <button type="button" aria-label="Close" />
        </div>
      </div>
      <div className="window-body">
        <div className="menu-content">
          <h1 className="game-logo">🐭 Rodent&apos;s Revenge</h1>
          <p className="tagline">A Windows 95 classic, reborn for the web</p>
          <div className="menu-buttons">
            <button type="button" className="win-button menu-button" onClick={onStartGame}>
              Start Game
            </button>
          </div>
          <div className="how-to-play">
            <h2>How to Play</h2>
            <ul>
              <li>You are the mouse (brown square)</li>
              <li>Use arrow keys to move</li>
              <li>Push gray blocks into orange cats to squash them</li>
              <li>Beat 3 waves of cats to clear the level</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
