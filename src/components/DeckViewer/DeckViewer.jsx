import { useMemo, useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { MANA_CONFIG } from '../../utils/manaConfig'
import { useDeckStore } from '../../stores/deckStore'
import './DeckViewer.css'

const TYPE_ORDER = ['Creature', 'Planeswalker', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Land', 'Other']
const CMC_BUCKETS = [0, 1, 2, 3, 4, 5, 6, 7]

const POPOVER_MAX_W = 900
const SIDE_MARGIN = 24
const NOTCH_GAP = 12

export default function DeckViewer({ deck, onClose, anchorRect }) {
  const updateNotes = useDeckStore(s => s.updateNotes)
  const deleteDeck = useDeckStore(s => s.deleteDeck)
  const [notes, setNotes] = useState(deck.notes ?? '')
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  useEffect(() => {
    setNotes(deck.notes ?? '')
    setIsConfirmingDelete(false)
  }, [deck.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

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

  const typeCounts = useMemo(() =>
    Object.entries(grouped).map(([type, cards]) => ({
      type,
      count: cards.reduce((sum, c) => sum + c.quantity, 0),
    })),
  [grouped])

  const maxTypeCount = useMemo(() =>
    Math.max(...typeCounts.map(t => t.count), 1),
  [typeCounts])

  const { manaCurve, hasCurveData } = useMemo(() => {
    const curve = {}
    for (const card of deck.cards) {
      if (card.cmc == null) continue
      const bucket = Math.min(7, Math.floor(card.cmc))
      curve[bucket] = (curve[bucket] || 0) + card.quantity
    }
    return { manaCurve: curve, hasCurveData: Object.keys(curve).length > 0 }
  }, [deck])

  const maxCurveCount = hasCurveData
    ? Math.max(...Object.values(manaCurve), 1)
    : 1

  const vw = window.innerWidth
  const vh = window.innerHeight
  const popoverWidth = Math.min(POPOVER_MAX_W, vw - SIDE_MARGIN * 2)
  const popoverLeft = Math.max(SIDE_MARGIN, (vw - popoverWidth) / 2)

  const anchorCenterX = anchorRect
    ? anchorRect.left + anchorRect.width / 2
    : vw / 2
  const notchLeft = Math.max(20, Math.min(anchorCenterX - popoverLeft, popoverWidth - 20))

  const maxPopoverH = vh * 0.8
  const desiredTop = anchorRect ? anchorRect.bottom + NOTCH_GAP : vh * 0.15
  const topPos = Math.min(desiredTop, vh - maxPopoverH - SIDE_MARGIN)

  const popoverStyle = {
    '--viewer-colour': primaryColour,
    '--notch-left': `${notchLeft}px`,
    '--notch-colour': primaryColour,
    top: `${Math.max(72, topPos)}px`,
    left: `${popoverLeft}px`,
    width: `${popoverWidth}px`,
  }

  const handleNotesBlur = useCallback(() => {
    updateNotes(deck.id, notes)
  }, [deck.id, notes, updateNotes])

  const handleDeleteConfirm = useCallback(() => {
    deleteDeck(deck.id)
    onClose()
  }, [deck.id, deleteDeck, onClose])

  const content = (
    <>
      <div className="viewer-backdrop" onClick={onClose} />

      <div className="deck-viewer" style={popoverStyle}>
        <div className="viewer-notch" />

        <div className="viewer-header">
          <div className="viewer-header-left">
            <div className="viewer-pips">
              {colours.map(c => (
                <span
                  key={c.symbol}
                  className="viewer-pip"
                  style={{ background: c.hex, boxShadow: `0 0 10px ${c.hex}` }}
                  title={c.name}
                />
              ))}
            </div>
            <span className="viewer-deck-name">{deck.name.toUpperCase()}</span>
            <span className="viewer-sep">//</span>
            <span className="viewer-commander">{deck.commander}</span>
          </div>
          <div className="viewer-header-right">
            <span className="viewer-count">{deck.cardCount} CARDS</span>
            <span className="viewer-theme-tag">{deck.theme}</span>
            {isConfirmingDelete ? (
              <div className="viewer-delete-confirm">
                <span className="viewer-delete-text">DELETE?</span>
                <button className="viewer-delete-yes" onClick={handleDeleteConfirm}>YES</button>
                <button className="viewer-delete-no" onClick={() => setIsConfirmingDelete(false)}>NO</button>
              </div>
            ) : (
              <button className="viewer-delete" onClick={() => setIsConfirmingDelete(true)}>
                DELETE DECK
              </button>
            )}
            <button className="viewer-close" onClick={onClose} aria-label="Close">X</button>
          </div>
        </div>

        <div className="viewer-body">
          <div className="viewer-left">
            <div className="left-section">
              <div className="section-label">TYPE BREAKDOWN</div>
              <div className="type-bars">
                {typeCounts.map(({ type, count }) => {
                  const pct = Math.round((count / maxTypeCount) * 100)
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
            </div>

            <div className="left-section">
              <div className="section-label">MANA CURVE</div>
              {hasCurveData ? (
                <div className="curve-chart">
                  {CMC_BUCKETS.map(cmc => {
                    const count = manaCurve[cmc] || 0
                    const heightPct = (count / maxCurveCount) * 100
                    return (
                      <div key={cmc} className="curve-col">
                        <span className="curve-count">{count > 0 ? count : ''}</span>
                        <div className="curve-bar-wrap">
                          <div
                            className="curve-bar"
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className="curve-cmc">{cmc === 7 ? '7+' : cmc}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="curve-empty">
                  Add <code>cmc</code> to cards to enable curve
                </p>
              )}
            </div>

            <div className="left-section notes-section">
              <div className="section-label">NOTES &amp; TACTICS</div>
              <textarea
                className="notes-textarea"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                onBlur={handleNotesBlur}
                placeholder="Win conditions, combos, key synergies..."
                spellCheck={false}
              />
            </div>
          </div>

          <div className="viewer-right">
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
    </>
  )

  return createPortal(content, document.body)
}
