import { useState, useEffect } from 'react'
import { useDeckStore } from '../../stores/deckStore'
import DeckCase from './DeckCase'
import DeckViewer from '../DeckViewer/DeckViewer'
import './DeckGrid.css'

const BANK_SIZE = 10

export default function DeckGrid() {
  const decks = useDeckStore(s => s.decks)
  const selectedDeckId = useDeckStore(s => s.selectedDeckId)
  const currentBank = useDeckStore(s => s.currentBank)
  const selectDeck = useDeckStore(s => s.selectDeck)
  const setBank = useDeckStore(s => s.setBank)
  const selectedColour = useDeckStore(s => s.selectedColour)

  const [slideDir, setSlideDir] = useState('none')
  const [anchorRect, setAnchorRect] = useState(null)

  // Drive body background reactive lighting from selected deck colour
  useEffect(() => {
    if (selectedColour) {
      const r = parseInt(selectedColour.slice(1, 3), 16)
      const g = parseInt(selectedColour.slice(3, 5), 16)
      const b = parseInt(selectedColour.slice(5, 7), 16)
      document.documentElement.style.setProperty('--selected-colour', `rgba(${r},${g},${b},0.18)`)
    } else {
      document.documentElement.style.setProperty('--selected-colour', 'rgba(42,37,64,0)')
    }
  }, [selectedColour])

  const totalBanks = Math.ceil(decks.length / BANK_SIZE)
  const bankDecks = decks.slice(currentBank * BANK_SIZE, (currentBank + 1) * BANK_SIZE)
  const deckStart = currentBank * BANK_SIZE + 1
  const deckEnd = Math.min((currentBank + 1) * BANK_SIZE, decks.length)
  const bankLabel = String(currentBank + 1).padStart(2, '0')
  const totalLabel = String(totalBanks).padStart(2, '0')

  const selectedDeck = decks.find(d => d.id === selectedDeckId) ?? null

  const navigate = (dir) => {
    if (dir === 'prev' && currentBank === 0) return
    if (dir === 'next' && currentBank === totalBanks - 1) return
    setSlideDir(dir === 'next' ? 'left' : 'right')
    selectDeck(null)
    setAnchorRect(null)
    setBank(currentBank + (dir === 'next' ? 1 : -1))
  }

  const jumpToBank = (i) => {
    if (i === currentBank) return
    setSlideDir(i > currentBank ? 'left' : 'right')
    selectDeck(null)
    setAnchorRect(null)
    setBank(i)
  }

  const handleSelect = (deck, e) => {
    const isDeselecting = selectedDeckId === deck.id
    selectDeck(isDeselecting ? null : deck.id)
    setAnchorRect(isDeselecting ? null : e.currentTarget.getBoundingClientRect())
  }

  const handleClose = () => {
    selectDeck(null)
    setAnchorRect(null)
  }

  return (
    <div className="deck-grid-page">

      <div className="grid-hud-bar">
        <div className="hud-left">
          <span className="hud-label">DECK VAULT</span>
          <span className="hud-sep">/</span>
          <span className="hud-value">BANK <span className="hud-bright">{bankLabel}</span>/{totalLabel}</span>
          <span className="hud-sep">/</span>
          <span className="hud-value">DECKS {deckStart}–{deckEnd} OF {decks.length}</span>
        </div>
        <div className="hud-right">
          <div className="hud-tag">MTG</div>
          <div className="hud-tag">COMMANDER</div>
          <div className="hud-ping">
            <span className="ping-dot" />
            <span>LIVE</span>
          </div>
        </div>
      </div>

      <div className="carousel-shell">
        <button
          className="carousel-arrow carousel-arrow-prev"
          onClick={() => navigate('prev')}
          disabled={currentBank === 0}
          aria-label="Previous bank"
        >
          ◀
        </button>

        <div className="carousel-viewport">
          <div
            key={currentBank}
            className={`cases-bank slide-${slideDir}`}
          >
            {bankDecks.map((deck, i) => (
              <DeckCase
                key={deck.id}
                deck={deck}
                index={i}
                isSelected={selectedDeckId === deck.id}
                onClick={(e) => handleSelect(deck, e)}
              />
            ))}
          </div>
        </div>

        <button
          className="carousel-arrow carousel-arrow-next"
          onClick={() => navigate('next')}
          disabled={currentBank === totalBanks - 1}
          aria-label="Next bank"
        >
          ▶
        </button>
      </div>

      <div className="bank-indicator">
        {Array.from({ length: totalBanks }, (_, i) => (
          <button
            key={i}
            className={`bank-dot${i === currentBank ? ' active' : ''}`}
            onClick={() => jumpToBank(i)}
            aria-label={`Bank ${i + 1}`}
          />
        ))}
      </div>

      {selectedDeck && (
        <DeckViewer
          deck={selectedDeck}
          onClose={handleClose}
          anchorRect={anchorRect}
        />
      )}

    </div>
  )
}
