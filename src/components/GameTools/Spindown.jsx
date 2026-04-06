import { useState } from 'react'
import { useGameStore } from '../../stores/gameStore'
import './Spindown.css'

const SECONDARY_DICE = [4, 6, 8, 10, 12, 100]

export default function Spindown() {
  const {
    spindown,
    commanderDamage,
    diceResults,
    rollD20,
    adjustLife,
    rollDice,
    adjustCommanderDamage,
    addOpponent,
    removeOpponent,
    renameOpponent,
  } = useGameStore()

  const [rolling, setRolling] = useState(false)
  const [editingOpponent, setEditingOpponent] = useState(null)
  const [coinResult, setCoinResult] = useState(null)
  const [coinFlipping, setCoinFlipping] = useState(false)

  const handleRollD20 = () => {
    if (rolling) return
    setRolling(true)
    rollD20()
    setTimeout(() => setRolling(false), 650)
  }

  const handleCoinFlip = () => {
    if (coinFlipping) return
    setCoinFlipping(true)
    setTimeout(() => {
      setCoinResult(Math.random() < 0.5 ? 'HEADS' : 'TAILS')
      setCoinFlipping(false)
    }, 400)
  }

  return (
    <div className="spindown-panel">

      {/* ── D20 ──────────────────────────────────── */}
      <section className="sp-section">
        <div className="sp-hud">
          <span className="sp-label">SPINDOWN D20</span>
          <span className="sp-hint">TAP DIE TO ROLL</span>
        </div>

        <div className="d20-area">
          <div
            className={`d20-wrapper ${rolling ? 'rolling' : ''}`}
            onClick={handleRollD20}
            title="Click to roll"
          >
            <div className="d20-shape">
              <div className="d20-facets" />
              <span className="d20-number">{spindown.current}</span>
            </div>
          </div>

          <div className="life-adj">
            <button className="adj-btn" onClick={() => adjustLife(-1)}>−</button>
            <button className="adj-btn" onClick={() => adjustLife(1)}>+</button>
          </div>

          {spindown.history.length > 0 && (
            <div className="roll-history">
              <span className="history-label">LAST ROLLS</span>
              <div className="history-chips">
                {spindown.history.map((roll, i) => (
                  <span key={i} className={`history-chip ${i === 0 ? 'latest' : ''}`}>
                    {roll}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Commander Damage ─────────────────────── */}
      <section className="sp-section">
        <div className="sp-hud">
          <span className="sp-label">COMMANDER DAMAGE</span>
          {commanderDamage.opponents.length < 3 && (
            <button className="sp-action-btn" onClick={addOpponent}>
              + ADD OPPONENT
            </button>
          )}
        </div>

        <div className="cmd-list">
          {commanderDamage.opponents.map(opp => (
            <div
              key={opp.id}
              className={`cmd-slot ${opp.damage >= 21 ? 'lethal' : ''}`}
            >
              <div className="cmd-slot-header">
                {editingOpponent === opp.id ? (
                  <input
                    className="cmd-name-input"
                    defaultValue={opp.name}
                    autoFocus
                    onBlur={e => {
                      renameOpponent(opp.id, e.target.value || opp.name)
                      setEditingOpponent(null)
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        renameOpponent(opp.id, e.target.value || opp.name)
                        setEditingOpponent(null)
                      }
                      if (e.key === 'Escape') setEditingOpponent(null)
                    }}
                  />
                ) : (
                  <button
                    className="cmd-name"
                    onClick={() => setEditingOpponent(opp.id)}
                    title="Click to rename"
                  >
                    {opp.name}
                  </button>
                )}
                {opp.damage >= 21 && (
                  <span className="lethal-badge">LETHAL</span>
                )}
                <button
                  className="cmd-remove"
                  onClick={() => removeOpponent(opp.id)}
                  title="Remove opponent"
                >
                  ×
                </button>
              </div>
              <div className="cmd-slot-body">
                <button
                  className="cmd-adj minus"
                  onClick={() => adjustCommanderDamage(opp.id, -1)}
                >
                  −
                </button>
                <span className="cmd-value">{opp.damage}</span>
                <button
                  className="cmd-adj plus"
                  onClick={() => adjustCommanderDamage(opp.id, 1)}
                >
                  +
                </button>
              </div>
            </div>
          ))}

          {commanderDamage.opponents.length === 0 && (
            <p className="empty-hint">No opponents tracked. Add up to 3.</p>
          )}
        </div>
      </section>

      {/* ── Dice Tray ────────────────────────────── */}
      <section className="sp-section">
        <div className="sp-hud">
          <span className="sp-label">DICE TRAY</span>
        </div>

        <div className="dice-tray">
          {SECONDARY_DICE.map(sides => (
            <div key={sides} className="dice-cell">
              <button
                className="dice-btn"
                onClick={() => rollDice(sides)}
              >
                D{sides}
              </button>
              {diceResults[sides] !== undefined && (
                <span className="dice-result">{diceResults[sides]}</span>
              )}
            </div>
          ))}

          <div className="dice-cell">
            <button
              className={`dice-btn coin-btn ${coinFlipping ? 'flipping' : ''}`}
              onClick={handleCoinFlip}
            >
              COIN
            </button>
            {coinResult && !coinFlipping && (
              <span className={`dice-result coin-result ${coinResult === 'HEADS' ? 'heads' : 'tails'}`}>
                {coinResult}
              </span>
            )}
          </div>
        </div>
      </section>

    </div>
  )
}
