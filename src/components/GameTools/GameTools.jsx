import { useState } from 'react'
import HealthDashboard from './HealthDashboard'
import Board from './Board'
import Session from './Session'
import './GameTools.css'

const PANELS = [
  { id: 'HEALTH', label: 'HEALTH' },
  { id: 'BOARD', label: 'BOARD' },
  { id: 'SESSION', label: 'SESSION' },
]

export default function GameTools() {
  const [activePanel, setActivePanel] = useState('HEALTH')

  return (
    <div className="game-tools">
      <div className="game-tools-hud">
        <div className="game-tools-nav">
          {PANELS.map(panel => (
            <button
              key={panel.id}
              className={`panel-tab ${activePanel === panel.id ? 'active' : ''}`}
              onClick={() => setActivePanel(panel.id)}
            >
              {panel.label}
            </button>
          ))}
        </div>
        <div className="hud-label">TABLE TOOLS // COMMANDER COMPANION</div>
      </div>

      <div className="game-tools-content">
        {activePanel === 'HEALTH' && <HealthDashboard />}
        {activePanel === 'BOARD' && <Board />}
        {activePanel === 'SESSION' && <Session />}
      </div>
    </div>
  )
}
