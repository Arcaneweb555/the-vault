import { useState, useRef, useCallback } from 'react'
import { useGameStore } from '../../stores/gameStore'
import './Board.css'

const TOKEN_TYPES = [
  { id: 'plus',    label: '+1/+1',   color: '#00ff88' },
  { id: 'minus',   label: '-1/-1',   color: '#ff4422' },
  { id: 'poison',  label: 'POISON',  color: '#cc44ff' },
  { id: 'rad',     label: 'RAD',     color: '#ffb800' },
  { id: 'energy',  label: 'ENERGY',  color: '#00d4ff' },
  { id: 'treasure',label: 'TRSRE',   color: '#ffd700' },
  { id: 'custom',  label: 'CUSTOM',  color: '#ffffff' },
]

const COLS = 5
const ROWS = 4

function TokenChip({ token, onIncrement, onRemove }) {
  const longPressRef = useRef(null)

  const handleMouseDown = useCallback(() => {
    longPressRef.current = setTimeout(() => onRemove(), 600)
  }, [onRemove])

  const handleMouseUp = useCallback(() => {
    clearTimeout(longPressRef.current)
  }, [])

  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    onRemove()
  }, [onRemove])

  const typeInfo = TOKEN_TYPES.find(t => t.id === token.type) || { color: '#ffffff', label: token.label || token.type }
  const label = token.type === 'custom' ? token.label : typeInfo.label

  return (
    <div
      className="token-chip"
      style={{ '--token-color': typeInfo.color }}
      onClick={onIncrement}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
      title={`${label} ×${token.count} — click to increment, right-click to remove`}
    >
      <span className="token-count">{token.count}</span>
      <span className="token-label">{label.slice(0, 5)}</span>
    </div>
  )
}

function TokenPicker({ onSelect, onClose }) {
  const [customLabel, setCustomLabel] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const handleSelect = (type) => {
    if (type === 'custom') {
      setShowCustom(true)
      return
    }
    onSelect(type, '')
  }

  const handleCustomSubmit = (e) => {
    e.preventDefault()
    if (customLabel.trim()) {
      onSelect('custom', customLabel.trim().toUpperCase())
    }
  }

  return (
    <div className="token-picker-overlay" onClick={onClose}>
      <div className="token-picker" onClick={e => e.stopPropagation()}>
        <div className="picker-hud">
          <span>PLACE TOKEN</span>
          <button className="picker-close" onClick={onClose}>×</button>
        </div>
        {showCustom ? (
          <form className="custom-token-form" onSubmit={handleCustomSubmit}>
            <input
              className="custom-label-input"
              placeholder="TOKEN LABEL"
              value={customLabel}
              onChange={e => setCustomLabel(e.target.value.toUpperCase())}
              autoFocus
              maxLength={8}
            />
            <button type="submit" className="custom-submit">PLACE</button>
          </form>
        ) : (
          <div className="picker-grid">
            {TOKEN_TYPES.map(type => (
              <button
                key={type.id}
                className="picker-token"
                style={{ '--token-color': type.color }}
                onClick={() => handleSelect(type.id)}
              >
                {type.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Board() {
  const { board, addToken, incrementToken, removeToken, clearBoard } = useGameStore()
  const [picker, setPicker] = useState(null) // slotKey when picker is open
  const [confirmClear, setConfirmClear] = useState(false)

  const slots = Array.from({ length: ROWS * COLS }, (_, i) => {
    const key = `${Math.floor(i / COLS)}-${i % COLS}`
    return { key, index: i }
  })

  const handleSlotClick = (slotKey) => {
    const slot = board.slots[slotKey]
    if (!slot || slot.tokens.length === 0) {
      setPicker(slotKey)
    }
  }

  const handlePlaceToken = (type, label) => {
    addToken(picker, type, label)
    setPicker(null)
  }

  const handleClear = () => {
    if (confirmClear) {
      clearBoard()
      setConfirmClear(false)
    } else {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 3000)
    }
  }

  return (
    <div className="board-panel">
      <div className="board-hud">
        <span className="board-hud-label">PLAYMAT // BATTLEFIELD</span>
        <div className="board-hud-right">
          <span className="board-hint">CLICK SLOT TO PLACE — R-CLICK TOKEN TO REMOVE</span>
          <button
            className={`clear-btn ${confirmClear ? 'confirm' : ''}`}
            onClick={handleClear}
          >
            {confirmClear ? 'CONFIRM CLEAR?' : 'CLEAR BOARD'}
          </button>
        </div>
      </div>

      <div className="playmat-grid">
        {slots.map(({ key }) => {
          const slot = board.slots[key]
          const hasTokens = slot && slot.tokens.length > 0

          return (
            <div
              key={key}
              className={`playmat-slot ${hasTokens ? 'has-tokens' : 'empty'}`}
              onClick={() => handleSlotClick(key)}
            >
              {hasTokens ? (
                <div className="slot-tokens">
                  {slot.tokens.map((token, i) => (
                    <TokenChip
                      key={i}
                      token={token}
                      onIncrement={() => incrementToken(key, i)}
                      onRemove={() => removeToken(key, i)}
                    />
                  ))}
                </div>
              ) : (
                <span className="slot-plus">+</span>
              )}
            </div>
          )
        })}
      </div>

      {picker && (
        <TokenPicker
          onSelect={handlePlaceToken}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  )
}
