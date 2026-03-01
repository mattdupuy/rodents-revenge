import { useState } from 'react'
import '98.css'
import { MainMenu } from './components/MainMenu'
import { GameCanvas } from './components/GameCanvas'
import './App.css'

type Screen = 'menu' | 'game'

function App() {
  const [screen, setScreen] = useState<Screen>('menu')

  return (
    <div className="app">
      {screen === 'menu' && <MainMenu onStartGame={() => setScreen('game')} />}
      {screen === 'game' && <GameCanvas onBackToMenu={() => setScreen('menu')} />}
    </div>
  )
}

export default App
