import { useState } from 'react'
import { useGameStore } from '../../stores/gameStore'
import './Session.css'

function formatTimestamp(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function Session() {
  const {
    session,
    addPlayer,
    removePlayer,
    updatePlayer,
    recordWin,
    resetSession,
  } = useGameStore()

  const [editingPlayer, setEditingPlayer] = useState(null)
  const [editField, setEditField] = useState(null) // 'name' | 'deck'
  const [confirmReset, setConfirmReset] = useState(false)
  const [pendingWinner, setPendingWinner] = useState(null)
  const [turnCount, setTurnCount] = useState('')
  const [recordingFor, setRecordingFor] = useState(null)

  const totalGames = session.games.length

  const handleReset = () => {
    if (confirmReset) {
      resetSession()
      setConfirmReset(false)
    } else {
      setConfirmReset(true)
      setTimeout(() => setConfirmReset(false), 3000)
    }
  }

  const handleRecordWin = (playerId) => {
    setRecordingFor(playerId)
    setTurnCount('')
  }

  const handleConfirmWin = () => {
    recordWin(recordingFor, turnCount ? parseInt(turnCount, 10) : null)
    setRecordingFor(null)
    setTurnCount('')
  }

  const handleFieldBlur = (playerId, field, value) => {
    updatePlayer(playerId, { [field]: value })
    setEditingPlayer(null)
    setEditField(null)
  }

  const getWinner = (game) => session.players.find(p => p.id === game.winnerId)

  return (
    <div className="session-panel">

      {/* ── Players ─────────────────────────────── */}
      <section className="sess-section">
        <div className="sess-hud">
          <span className="sess-label">PLAYERS</span>
          <div className="sess-hud-right">
            {session.players.length < 4 && (
              <button className="sess-action-btn" onClick={addPlayer}>+ ADD PLAYER</button>
            )}
          </div>
        </div>

        <div className="player-list">
          {session.players.map(player => {
            const winRate = totalGames > 0
              ? Math.round((player.wins / totalGames) * 100)
              : 0

            return (
              <div key={player.id} className="player-card">
                <div className="player-card-top">
                  {/* Name */}
                  {editingPlayer === player.id && editField === 'name' ? (
                    <input
                      className="player-name-input"
                      defaultValue={player.name}
                      autoFocus
                      onBlur={e => handleFieldBlur(player.id, 'name', e.target.value || player.name)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleFieldBlur(player.id, 'name', e.target.value || player.name)
                        if (e.key === 'Escape') { setEditingPlayer(null); setEditField(null) }
                      }}
                    />
                  ) : (
                    <button
                      className="player-name"
                      onClick={() => { setEditingPlayer(player.id); setEditField('name') }}
                      title="Click to rename"
                    >
                      {player.name}
                    </button>
                  )}

                  <div className="player-card-right">
                    <span className="player-wins">{player.wins}W</span>
                    {totalGames > 0 && (
                      <span className="player-rate">{winRate}%</span>
                    )}
                    <button
                      className="player-remove"
                      onClick={() => removePlayer(player.id)}
                      title="Remove player"
                    >×</button>
                  </div>
                </div>

                {/* Deck name */}
                <div className="player-card-bottom">
                  {editingPlayer === player.id && editField === 'deck' ? (
                    <input
                      className="player-deck-input"
                      defaultValue={player.deck}
                      placeholder="DECK NAME"
                      autoFocus
                      onBlur={e => handleFieldBlur(player.id, 'deck', e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleFieldBlur(player.id, 'deck', e.target.value)
                        if (e.key === 'Escape') { setEditingPlayer(null); setEditField(null) }
                      }}
                    />
                  ) : (
                    <button
                      className="player-deck"
                      onClick={() => { setEditingPlayer(player.id); setEditField('deck') }}
                      title="Click to set deck name"
                    >
                      {player.deck || '— tap to set deck —'}
                    </button>
                  )}

                  {recordingFor === player.id ? (
                    <div className="win-confirm-row">
                      <input
                        className="turn-input"
                        type="number"
                        placeholder="TURNS?"
                        value={turnCount}
                        onChange={e => setTurnCount(e.target.value)}
                        min={1}
                        max={999}
                      />
                      <button className="confirm-win-btn" onClick={handleConfirmWin}>
                        ✓ CONFIRM WIN
                      </button>
                      <button className="cancel-win-btn" onClick={() => setRecordingFor(null)}>
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      className="record-win-btn"
                      onClick={() => handleRecordWin(player.id)}
                    >
                      RECORD WIN
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {session.players.length === 0 && (
            <p className="empty-hint">No players. Add up to 4.</p>
          )}
        </div>
      </section>

      {/* ── Stats ───────────────────────────────── */}
      {totalGames > 0 && (
        <section className="sess-section">
          <div className="sess-hud">
            <span className="sess-label">SESSION STATS</span>
            <span className="stat-total">{totalGames} GAME{totalGames !== 1 ? 'S' : ''} PLAYED</span>
          </div>
          <div className="stats-grid">
            {session.players.map(player => {
              const winRate = Math.round((player.wins / totalGames) * 100)
              return (
                <div key={player.id} className="stat-card">
                  <div className="stat-name">{player.name}</div>
                  <div className="stat-wins">{player.wins}W</div>
                  <div className="stat-bar-wrap">
                    <div
                      className="stat-bar-fill"
                      style={{ width: `${winRate}%` }}
                    />
                  </div>
                  <div className="stat-rate">{winRate}%</div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Game log ────────────────────────────── */}
      {session.games.length > 0 && (
        <section className="sess-section">
          <div className="sess-hud">
            <span className="sess-label">GAME LOG</span>
            <button
              className={`reset-btn ${confirmReset ? 'confirm' : ''}`}
              onClick={handleReset}
            >
              {confirmReset ? 'CONFIRM RESET?' : 'RESET SESSION'}
            </button>
          </div>

          <div className="game-log">
            {[...session.games].reverse().map((game, i) => {
              const winner = getWinner(game)
              return (
                <div key={game.id} className="log-entry">
                  <span className="log-index">
                    G{session.games.length - i}
                  </span>
                  <span className="log-winner">
                    {winner ? winner.name : 'Unknown'}
                  </span>
                  {game.turnCount && (
                    <span className="log-turns">{game.turnCount}T</span>
                  )}
                  <span className="log-time">{formatTimestamp(game.timestamp)}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Reset button when no games yet */}
      {session.games.length === 0 && session.players.some(p => p.wins > 0) === false && (
        <div className="sess-footer">
          <button
            className={`reset-btn ${confirmReset ? 'confirm' : ''}`}
            onClick={handleReset}
          >
            {confirmReset ? 'CONFIRM RESET?' : 'RESET SESSION'}
          </button>
        </div>
      )}

    </div>
  )
}
