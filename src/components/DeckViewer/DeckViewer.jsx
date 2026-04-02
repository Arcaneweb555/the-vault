import { useMemo } from 'react'
import { MANA_CONFIG } from '../../utils/manaConfig'
import './DeckViewer.css'

const TYPE_ORDER = ['Creature', 'Planeswalker', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Land', 'Other']

export default function DeckViewer({ deck, onClose }) {
  const grouped = useMemo(() => {
    const groups = {}
    for (const card of deck.cards) {
      const type = card.type || 'Other'
      if (!groups[type]) groups[type] = []
      groups[type].push(card)
    }
    const sorted = {}
    for (const t of TYPE_ORDER) {
      if (groups[t]?.length) sorted[t] = groups[t]
    }
    return sorted
  }, [deck])

  const colours = deck.colours.map(c => MANA_CONFIG[c]).filter(Boolean)
  const primaryColour = colours[0]?.hex || '#00d4ff'

  const typeCounts = Object.entries(grouped).map(([type, cards]) => ({
    type,
    count: cards.reduce((sum, c) => sum + c.quantity, 0)
  }))

  return (
    <div className="deck-viewer" style={{ '--viewer-colour': primaryColour }}>

      <div className="viewer-hud-bar">
        <div className="viewer-hud-left">
          <div className="viewer-colours">
            {colours.map(c => (
              <span
                key={c.symbol}
                className="viewer-pip"
                style={{ background: c.hex, boxShadow: `0 0 8px ${c.hex}` }}
                title={c.name}
              />
            ))}
          </div>
          <span className="viewer-hud-name">{deck.name.toUpperCase()}</span>
          <span className="viewer-hud-sep">//</span>
          <span className="viewer-hud-sub">{deck.commander}</span>
        </div>
        <div className="viewer-hud-right">
          <span className="viewer-count">{deck.cardCount} CARDS</span>
          <span className="viewer-theme-tag">{deck.theme}</span>
          <button className="viewer-close" onClick={onClose} aria-label="Close">
            <span>✕</span>
          </button>
        </div>
      </div>

      <div className="viewer-content">

        <div className="viewer-sidebar">
          <div className="sidebar-label">TYPE BREAKDOWN</div>
          <div className="sidebar-bars">
            {typeCounts.map(({ type, count }) => {
              const pct = Math.round((count / deck.cardCount) * 100)
              return (
                <div key={type} className="type-bar-row">
                  <span className="type-bar-label">{type.toUpperCase()}</span>
                  <div className="type-bar-track">
                    <div
                      className="type-bar-fill"
                      style={{ width: `${pct}%`, background: primaryColour }}
                    />
                  </div>
                  <span className="type-bar-count">{count}</span>
                </div>
              )
            })}
          </div>
          <div className="sidebar-note">
            Showing {deck.cards.length} of {deck.cardCount} cards.<br />
            Edit <code>src/data/decks.js</code> to add your full list.
          </div>
        </div>

        <div className="viewer-list">
          {Object.entries(grouped).map(([type, cards]) => (
            <div key={type} className="card-group">
              <div className="card-group-header">
                <span className="card-group-type">{type.toUpperCase()}</span>
                <span className="card-group-count">
                  {cards.reduce((s, c) => s + c.quantity, 0)}
                </span>
              </div>
              <div className="card-group-items">
                {cards.map((card, i) => (
                  <div key={i} className="card-list-item">
                    <span className="card-qty">{card.quantity}x</span>
                    <span className="card-list-name">{card.name}</span>
                    {card.name === deck.commander && (
                      <span className="card-cmd-badge">CDR</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
