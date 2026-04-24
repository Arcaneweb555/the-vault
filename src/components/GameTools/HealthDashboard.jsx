import { useMemo, useRef, useState } from 'react'
import { useDeckStore } from '../../stores/deckStore'
import { useGameStore } from '../../stores/gameStore'
import { MANA_CONFIG, getColourBacklight } from '../../utils/manaConfig'
import './HealthDashboard.css'

const DICE_TYPES = [4, 6, 8, 10, 12, 20]
const LIFE_PRESETS = [20, 30, 40]
const DISPLAY_MODE_OPTIONS = [
  { id: 'default', label: 'Default' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'showcase', label: 'Showcase' },
]
const LAYOUT_OPTIONS = [
  { id: 'grid', label: 'Grid' },
  { id: 'table', label: 'Around Table' },
]
const ACCENT_OPTIONS = [
  { tone: 'red', hex: '#e8705a' },
  { tone: 'gold', hex: '#ffb800' },
  { tone: 'purple', hex: '#b44fff' },
  { tone: 'green', hex: '#6dd68a' },
]
const AVATAR_OPTIONS = ['STAR', 'MOON', 'SPARK', 'CROWN', 'SKULL', 'ORB']
const STATUS_OPTIONS = [
  { key: 'activeTurn', label: 'Turn' },
  { key: 'monarch', label: 'Monarch' },
  { key: 'initiative', label: 'Initiative' },
  { key: 'firstPlayer', label: 'First' },
  { key: 'eliminated', label: 'Out' },
]

function getCommanderStatus(damage) {
  if (damage >= 21) return 'lethal'
  if (damage >= 15) return 'danger'
  return 'safe'
}

function formatRollHistoryEntry(entry) {
  return `D${entry.sides} ${entry.result}`
}

export default function HealthDashboard() {
  const decks = useDeckStore((state) => state.decks)
  const {
    health,
    commanderDamage,
    session,
    diceResults,
    diceHistory,
    increasePlayerLife,
    decreasePlayerLife,
    setPlayerLife,
    renameHealthPlayer,
    setPlayerAvatar,
    linkPlayerDeck,
    removeHealthPlayer,
    resetPlayersToCommanderDefaults,
    initializeGameSetup,
    rematchSamePlayers,
    setLayoutMode,
    setDisplayMode,
    adjustPlayerCounter,
    togglePlayerStatus,
    rollDice,
    adjustCommanderDamage,
    resetCommanderDamage,
    recordWin,
  } = useGameStore()

  const [editingPlayer, setEditingPlayer] = useState(null)
  const [coinResult, setCoinResult] = useState(null)
  const [coinFlipping, setCoinFlipping] = useState(false)
  const [lifeFeedback, setLifeFeedback] = useState({})
  const [expandedPlayers, setExpandedPlayers] = useState({})
  const [isSetupOpen, setIsSetupOpen] = useState(false)
  const [lifeEditing, setLifeEditing] = useState(null)
  const [lifeDraft, setLifeDraft] = useState('')
  const [setupDraft, setSetupDraft] = useState(() => ({
    playerCount: health.players.length,
    startingLife: health.startingLife ?? 40,
    layoutMode: health.layoutMode ?? 'grid',
    displayMode: health.displayMode ?? 'default',
    players: health.players.map((player) => ({
      id: player.id,
      name: player.name,
      accent: player.accent,
      avatar: player.avatar ?? '',
      deckId: player.deckId ?? '',
    })),
  }))
  const feedbackTimersRef = useRef({})

  const gridClassName = useMemo(() => {
    const playerCount = health.players.length
    if ((health.layoutMode ?? 'grid') === 'table' && playerCount <= 4) {
      return 'players-grid grid-table'
    }

    if (playerCount <= 4) return 'players-grid grid-2'
    return 'players-grid grid-4'
  }, [health.layoutMode, health.players.length])

  const commanderDamageMap = useMemo(
    () => new Map(commanderDamage.opponents.map((opponent) => [opponent.id, opponent])),
    [commanderDamage.opponents]
  )

  const sessionPlayerMap = useMemo(
    () => new Map(session.players.map((player) => [player.id, player])),
    [session.players]
  )

  const deckMap = useMemo(
    () => new Map(decks.map((deck) => [deck.id, deck])),
    [decks]
  )

  const handleCoinFlip = () => {
    if (coinFlipping) return
    setCoinFlipping(true)

    window.setTimeout(() => {
      setCoinResult(Math.random() < 0.5 ? 'HEADS' : 'TAILS')
      setCoinFlipping(false)
    }, 400)
  }

  const pushLifeFeedback = (playerId, delta) => {
    window.clearTimeout(feedbackTimersRef.current[playerId])

    setLifeFeedback((current) => ({
      ...current,
      [playerId]: {
        delta,
        direction: delta >= 0 ? 'positive' : 'negative',
        tick: Date.now(),
      },
    }))

    feedbackTimersRef.current[playerId] = window.setTimeout(() => {
      setLifeFeedback((current) => {
        const next = { ...current }
        delete next[playerId]
        return next
      })
    }, 700)
  }

  const handleLifeAdjust = (playerId, delta) => {
    if (delta > 0) {
      increasePlayerLife(playerId, delta)
    } else {
      decreasePlayerLife(playerId, Math.abs(delta))
    }

    pushLifeFeedback(playerId, delta)
  }

  const openLifeEditor = (player) => {
    if (player.statuses?.eliminated) return
    setLifeEditing(player.id)
    setLifeDraft(String(player.life))
  }

  const closeLifeEditor = () => {
    setLifeEditing(null)
    setLifeDraft('')
  }

  const commitLifeEdit = (player) => {
    const parsedValue = Number.parseInt(lifeDraft.trim(), 10)
    if (!Number.isFinite(parsedValue)) {
      closeLifeEditor()
      return
    }

    setPlayerLife(player.id, parsedValue)
    pushLifeFeedback(player.id, parsedValue - player.life)
    closeLifeEditor()
  }

  const handleOpenSetup = () => {
    setSetupDraft({
      playerCount: health.players.length,
      startingLife: health.startingLife ?? 40,
      layoutMode: health.layoutMode ?? 'grid',
      displayMode: health.displayMode ?? 'default',
      players: health.players.map((player, index) => ({
        id: player.id,
        name: player.name,
        accent: player.accent ?? ACCENT_OPTIONS[index % ACCENT_OPTIONS.length],
        avatar: player.avatar ?? AVATAR_OPTIONS[index % AVATAR_OPTIONS.length],
        deckId: player.deckId ?? '',
      })),
    })
    setIsSetupOpen(true)
  }

  const handleSetupPlayerCountChange = (nextCount) => {
    setSetupDraft((current) => {
      const parsedCount = Number.parseInt(nextCount, 10)
      const nextPlayers = Array.from({ length: parsedCount }, (_, index) => ({
        id: current.players[index]?.id ?? `${index + 1}`,
        name: current.players[index]?.name ?? `Player ${index + 1}`,
        accent: current.players[index]?.accent ?? ACCENT_OPTIONS[index % ACCENT_OPTIONS.length],
        avatar: current.players[index]?.avatar ?? AVATAR_OPTIONS[index % AVATAR_OPTIONS.length],
        deckId: current.players[index]?.deckId ?? '',
      }))

      return {
        ...current,
        playerCount: parsedCount,
        players: nextPlayers,
      }
    })
  }

  const handleApplySetup = () => {
    initializeGameSetup(setupDraft)
    setExpandedPlayers({})
    setLifeFeedback({})
    setCoinResult(null)
    closeLifeEditor()
    setIsSetupOpen(false)
  }

  const toggleExpanded = (playerId) => {
    setExpandedPlayers((current) => ({
      ...current,
      [playerId]: !current[playerId],
    }))
  }

  return (
    <div className={`health-dashboard mode-${health.displayMode ?? 'default'}`}>
      <section className="health-section">
        <div className="health-hud">
          <div>
            <span className="health-label">PLAYER HEALTH</span>
            <span className="health-hint">
              {health.players.length} PLAYERS // STARTING LIFE {health.startingLife ?? 40}
            </span>
          </div>
          <div className="health-actions">
            <div className="layout-toggle">
              {LAYOUT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  className={`layout-toggle-btn${(health.layoutMode ?? 'grid') === option.id ? ' active' : ''}`}
                  onClick={() => setLayoutMode(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="layout-toggle">
              {DISPLAY_MODE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  className={`layout-toggle-btn${(health.displayMode ?? 'default') === option.id ? ' active' : ''}`}
                  onClick={() => setDisplayMode(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button className="health-action-btn" onClick={rematchSamePlayers}>
              REMATCH
            </button>
            <button className="health-action-btn" onClick={handleOpenSetup}>
              NEW GAME
            </button>
            <button className="health-action-btn" onClick={resetPlayersToCommanderDefaults}>
              QUICK RESET
            </button>
          </div>
        </div>

        <div className={gridClassName}>
          {health.players.map((player, index) => {
            const feedback = lifeFeedback[player.id]
            const expanded = Boolean(expandedPlayers[player.id])
            const commanderTarget = commanderDamageMap.get(player.id) ?? { damage: 0 }
            const commanderStatus = getCommanderStatus(commanderTarget.damage)
            const rotationClass = (health.layoutMode ?? 'grid') === 'table' && health.players.length <= 4
              ? ` table-pos-${index}`
              : ''
            const linkedDeck = player.deckId ? deckMap.get(player.deckId) : null
            const deckBacklight = linkedDeck?.colours?.length
              ? getColourBacklight(linkedDeck.colours)
              : null
            const wins = sessionPlayerMap.get(player.id)?.wins ?? 0
            const activeStatuses = STATUS_OPTIONS.filter((status) => player.statuses?.[status.key])

            return (
              <div
                key={player.id}
                className={`player-health-card${feedback ? ` life-${feedback.direction}` : ''}${rotationClass}${player.statuses?.eliminated ? ' eliminated' : ''}`}
                style={{
                  '--player-accent': linkedDeck?.colours?.[0]
                    ? (MANA_CONFIG[linkedDeck.colours[0]]?.hex ?? player.accent?.hex ?? 'var(--cyan)')
                    : (player.accent?.hex ?? 'var(--cyan)'),
                  '--player-deck-backlight': deckBacklight ?? 'transparent',
                }}
              >
                <div className="player-health-top">
                  <div className="player-health-name-wrap">
                    {player.avatar && <span className="player-avatar-badge">{player.avatar}</span>}
                    <span className="player-accent-pill" />
                    {editingPlayer === player.id ? (
                      <input
                        className="player-health-name-input"
                        defaultValue={player.name}
                        autoFocus
                        onBlur={(event) => {
                          renameHealthPlayer(player.id, event.target.value)
                          setEditingPlayer(null)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            renameHealthPlayer(player.id, event.currentTarget.value)
                            setEditingPlayer(null)
                          }
                          if (event.key === 'Escape') setEditingPlayer(null)
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        className="player-health-name"
                        onClick={() => setEditingPlayer(player.id)}
                        title="Rename player"
                      >
                        {player.name}
                      </button>
                    )}
                  </div>

                  <div className="player-health-meta">
                    {wins > 0 && <span className="player-win-badge">{wins}W</span>}
                    {commanderTarget.damage > 0 && (
                      <button
                        type="button"
                        className={`commander-summary ${commanderStatus}`}
                        onClick={() => toggleExpanded(player.id)}
                        title="Toggle player details"
                      >
                        CMD {commanderTarget.damage}
                      </button>
                    )}
                    {health.players.length > 2 && (
                      <button
                        type="button"
                        className="player-health-remove"
                        onClick={() => removeHealthPlayer(player.id)}
                        title="Remove player"
                      >
                        X
                      </button>
                    )}
                  </div>
                </div>

                {linkedDeck && (
                  <div className="linked-deck-strip">
                    <div className="linked-deck-copy">
                      <span className="linked-deck-name">{linkedDeck.name}</span>
                      <span className="linked-deck-commander">{linkedDeck.commander}</span>
                    </div>
                    <div className="linked-deck-pips">
                      {(linkedDeck.colours ?? []).map((colour) => (
                        <span
                          key={`${player.id}-${colour}`}
                          className="linked-deck-pip"
                          style={{ '--deck-pip': MANA_CONFIG[colour]?.hex ?? '#00d4ff' }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {activeStatuses.length > 0 && (
                  <div className="status-badge-row">
                    {activeStatuses.map((status) => (
                      <span key={`${player.id}-${status.key}`} className={`status-badge ${status.key}`}>
                        {status.label}
                      </span>
                    ))}
                  </div>
                )}

                <div className="player-health-body">
                  <div className="life-controls">
                    <button type="button" className="life-adjust-btn minor minus" onClick={() => handleLifeAdjust(player.id, -1)} disabled={player.statuses?.eliminated}>
                      -1
                    </button>
                    <button type="button" className="life-adjust-btn major minus" onClick={() => handleLifeAdjust(player.id, -5)} disabled={player.statuses?.eliminated}>
                      -5
                    </button>
                  </div>

                  {lifeEditing === player.id ? (
                    <div className={`player-life-total changed editing${feedback ? ' has-feedback' : ''}`}>
                      <input
                        className="player-life-input"
                        inputMode="numeric"
                        pattern="-?[0-9]*"
                        value={lifeDraft}
                        autoFocus
                        onChange={(event) => setLifeDraft(event.target.value.replace(/(?!^-)[^0-9]/g, ''))}
                        onBlur={() => commitLifeEdit(player)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') commitLifeEdit(player)
                          if (event.key === 'Escape') closeLifeEditor()
                        }}
                        aria-label={`Life total for ${player.name}`}
                      />
                      {feedback && (
                        <span key={feedback.tick} className={`life-delta ${feedback.direction}`}>
                          {feedback.delta > 0 ? `+${feedback.delta}` : feedback.delta}
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={`player-life-total${feedback ? ' changed' : ''}`}
                      onClick={() => openLifeEditor(player)}
                      title="Click to enter a life total"
                    >
                      {player.life}
                      {feedback && (
                        <span key={feedback.tick} className={`life-delta ${feedback.direction}`}>
                          {feedback.delta > 0 ? `+${feedback.delta}` : feedback.delta}
                        </span>
                      )}
                    </button>
                  )}

                  <div className="life-controls">
                    <button type="button" className="life-adjust-btn major plus" onClick={() => handleLifeAdjust(player.id, 5)} disabled={player.statuses?.eliminated}>
                      +5
                    </button>
                    <button type="button" className="life-adjust-btn minor plus" onClick={() => handleLifeAdjust(player.id, 1)} disabled={player.statuses?.eliminated}>
                      +1
                    </button>
                  </div>
                </div>

                <div className="player-secondary">
                  <button
                    type="button"
                    className={`player-secondary-toggle${expanded ? ' open' : ''}`}
                    onClick={() => toggleExpanded(player.id)}
                  >
                    {expanded ? 'HIDE DETAILS' : 'SHOW DETAILS'}
                  </button>

                  {expanded && (
                    <div className="player-secondary-panel">
                      <div className="secondary-block">
                        <span className="secondary-counter-label">Deck Link</span>
                        <select
                          className="setup-select compact"
                          value={player.deckId ?? ''}
                          onChange={(event) => linkPlayerDeck(player.id, event.target.value)}
                        >
                          <option value="">No linked deck</option>
                          {decks.map((deck) => (
                            <option key={deck.id} value={deck.id}>
                              {deck.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="secondary-block">
                        <span className="secondary-counter-label">Avatar Badge</span>
                        <div className="avatar-picker-row">
                          {AVATAR_OPTIONS.map((avatar) => (
                            <button
                              key={`${player.id}-${avatar}`}
                              type="button"
                              className={`avatar-picker-btn${player.avatar === avatar ? ' active' : ''}`}
                              onClick={() => setPlayerAvatar(player.id, avatar)}
                            >
                              {avatar}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="secondary-block">
                        <span className="secondary-counter-label">Status Markers</span>
                        <div className="status-toggle-grid">
                          {STATUS_OPTIONS.map((status) => (
                            <button
                              key={`${player.id}-${status.key}`}
                              type="button"
                              className={`status-toggle${player.statuses?.[status.key] ? ' active' : ''}`}
                              onClick={() => togglePlayerStatus(player.id, status.key)}
                            >
                              {status.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="secondary-counter-grid">
                        <div className="secondary-counter-card commander">
                          <span className="secondary-counter-label">Commander</span>
                          <div className="secondary-counter-controls">
                            <button type="button" className="secondary-counter-btn" onClick={() => adjustCommanderDamage(player.id, -1)}>-</button>
                            <span className={`secondary-counter-value ${commanderStatus}`}>{commanderTarget.damage}</span>
                            <button type="button" className="secondary-counter-btn" onClick={() => adjustCommanderDamage(player.id, 1)}>+</button>
                          </div>
                        </div>

                        {[
                          ['poison', 'Poison'],
                          ['energy', 'Energy'],
                          ['experience', 'Experience'],
                        ].map(([key, label]) => (
                          <div key={key} className="secondary-counter-card">
                            <span className="secondary-counter-label">{label}</span>
                            <div className="secondary-counter-controls">
                              <button type="button" className="secondary-counter-btn" onClick={() => adjustPlayerCounter(player.id, key, -1)}>-</button>
                              <span className="secondary-counter-value">{player[key] ?? 0}</span>
                              <button type="button" className="secondary-counter-btn" onClick={() => adjustPlayerCounter(player.id, key, 1)}>+</button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="secondary-block win-row">
                        <span className="secondary-counter-label">Session Wins</span>
                        <div className="win-controls">
                          <span className="player-win-badge">{wins}W</span>
                          <button className="health-action-btn compact" onClick={() => recordWin(player.id)}>
                            RECORD WIN
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="tools-companion-grid">
        <section className="health-section">
          <div className="health-hud">
            <span className="health-label">DICE TRAY</span>
            <div className="health-actions">
              <button className="health-action-btn" onClick={resetCommanderDamage}>
                RESET CMD
              </button>
            </div>
          </div>

          <div className="dice-utility-grid">
            <div className="dice-tray">
              {DICE_TYPES.map((sides) => (
                <div key={sides} className="dice-cell">
                  <button className="dice-btn" onClick={() => rollDice(sides)}>
                    D{sides}
                  </button>
                  {diceResults[sides] !== undefined && (
                    <span className="dice-result">{diceResults[sides]}</span>
                  )}
                </div>
              ))}

              <div className="dice-cell">
                <button className={`dice-btn coin-btn ${coinFlipping ? 'flipping' : ''}`} onClick={handleCoinFlip}>
                  COIN
                </button>
                {coinResult && !coinFlipping && (
                  <span className={`dice-result coin-result ${coinResult === 'HEADS' ? 'heads' : 'tails'}`}>
                    {coinResult}
                  </span>
                )}
              </div>
            </div>

            <div className="dice-history">
              <span className="secondary-counter-label">Recent Rolls</span>
              <div className="dice-history-list">
                {diceHistory.length === 0 && <span className="dice-history-empty">No rolls yet</span>}
                {diceHistory.map((entry) => (
                  <span key={entry.id} className="dice-history-chip">
                    {formatRollHistoryEntry(entry)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {isSetupOpen && (
        <div className="game-setup-overlay" onClick={() => setIsSetupOpen(false)}>
          <div className="game-setup-modal" onClick={(event) => event.stopPropagation()}>
            <div className="game-setup-header">
              <div>
                <span className="health-label">NEW GAME</span>
                <span className="health-hint">SET PLAYERS, LIFE PRESET, LAYOUT, AND LINK DECKS</span>
              </div>
              <button className="player-health-remove" onClick={() => setIsSetupOpen(false)}>X</button>
            </div>

            <div className="game-setup-grid">
              <label className="setup-field">
                <span className="secondary-counter-label">Player Count</span>
                <select
                  className="setup-select"
                  value={setupDraft.playerCount}
                  onChange={(event) => handleSetupPlayerCountChange(event.target.value)}
                >
                  {Array.from({ length: 7 }, (_, index) => index + 2).map((count) => (
                    <option key={count} value={count}>{count}</option>
                  ))}
                </select>
              </label>

              <div className="setup-field">
                <span className="secondary-counter-label">Starting Life</span>
                <div className="preset-row">
                  {LIFE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`layout-toggle-btn${setupDraft.startingLife === preset ? ' active' : ''}`}
                      onClick={() => setSetupDraft((current) => ({ ...current, startingLife: preset }))}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setup-field">
                <span className="secondary-counter-label">Layout Mode</span>
                <div className="preset-row">
                  {LAYOUT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`layout-toggle-btn${setupDraft.layoutMode === option.id ? ' active' : ''}`}
                      onClick={() => setSetupDraft((current) => ({ ...current, layoutMode: option.id }))}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setup-field">
                <span className="secondary-counter-label">Display Mode</span>
                <div className="preset-row">
                  {DISPLAY_MODE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`layout-toggle-btn${setupDraft.displayMode === option.id ? ' active' : ''}`}
                      onClick={() => setSetupDraft((current) => ({ ...current, displayMode: option.id }))}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="setup-player-list">
              {setupDraft.players.map((player, index) => (
                <div key={player.id ?? index} className="setup-player-row enriched">
                  <input
                    className="setup-input"
                    value={player.name}
                    onChange={(event) => {
                      const nextName = event.target.value
                      setSetupDraft((current) => ({
                        ...current,
                        players: current.players.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, name: nextName } : entry
                        ),
                      }))
                    }}
                    placeholder={`Player ${index + 1}`}
                  />

                  <select
                    className="setup-select"
                    value={player.deckId ?? ''}
                    onChange={(event) => {
                      const nextDeckId = event.target.value
                      setSetupDraft((current) => ({
                        ...current,
                        players: current.players.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, deckId: nextDeckId || '' } : entry
                        ),
                      }))
                    }}
                  >
                    <option value="">No linked deck</option>
                    {decks.map((deck) => (
                      <option key={deck.id} value={deck.id}>{deck.name}</option>
                    ))}
                  </select>

                  <div className="setup-style-row">
                    <div className="setup-accent-row">
                      {ACCENT_OPTIONS.map((accent) => (
                        <button
                          key={`${player.id ?? index}-${accent.tone}`}
                          type="button"
                          className={`setup-accent-swatch${player.accent?.tone === accent.tone ? ' active' : ''}`}
                          style={{ '--player-accent': accent.hex }}
                          onClick={() => {
                            setSetupDraft((current) => ({
                              ...current,
                              players: current.players.map((entry, entryIndex) =>
                                entryIndex === index ? { ...entry, accent } : entry
                              ),
                            }))
                          }}
                        />
                      ))}
                    </div>

                    <div className="setup-avatar-row">
                      {AVATAR_OPTIONS.map((avatar) => (
                        <button
                          key={`${player.id ?? index}-${avatar}`}
                          type="button"
                          className={`setup-avatar-btn${player.avatar === avatar ? ' active' : ''}`}
                          onClick={() => {
                            setSetupDraft((current) => ({
                              ...current,
                              players: current.players.map((entry, entryIndex) =>
                                entryIndex === index ? { ...entry, avatar } : entry
                              ),
                            }))
                          }}
                        >
                          {avatar}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="game-setup-footer">
              <button className="health-action-btn" onClick={() => setIsSetupOpen(false)}>
                CANCEL
              </button>
              <button className="health-action-btn primary" onClick={handleApplySetup}>
                START GAME
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
