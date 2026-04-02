import { useState } from 'react'
import { DECKS } from '../../data/decks'
import DeckCase from './DeckCase'
import DeckViewer from '../DeckViewer/DeckViewer'
import './DeckGrid.css'

const BANK_SIZE = 10
const TOTAL_BANKS = Math.ceil(DECKS.length / BANK_SIZE)

export default function DeckGrid() {
  const [currentBank, setCurrentBank] = useState(0)
  const [slideDir, setSlideDir] = useState('none')
  const [selectedDeck, setSelectedDeck] = useState(null)

  const bankDecks = DECKS.slice(currentBank * BANK_SIZE, (currentBank + 1) * BANK_SIZE)
  const deckStart = currentBank * BANK_SIZE + 1
  const deckEnd = Math.min((currentBank + 1) * BANK_SIZE, DECKS.length)
  const bankLabel = String(currentBank + 1).padStart(2, '0')
  const totalLabel = String(TOTAL_BANKS).padStart(2, '0')

  const navigate = (dir) => {
    if (dir === 'prev' && currentBank === 0) return
    if (dir === 'next' && currentBank === TOTAL_BANKS - 1) return
    setSlideDir(dir === 'next' ? 'left' : 'right')
    setSelectedDeck(null)
    setCurrentBank(prev => dir === 'next' ? prev + 1 : prev - 1)
  }

  const jumpToBank = (i) => {
    if (i === currentBank) return
    setSlideDir(i > currentBank ? 'left' : 'right')
    setSelectedDeck(null)
    setCurrentBank(i)
  }

  const handleSelect = (deck) => {
    setSelectedDeck(prev => prev?.id === deck.id ? null : deck)
  }

  return (
    <div className="deck-grid-page">

      <div className="grid-hud-bar">
        <div className="hud-left">
          <span className="hud-label">DECK VAULT</span>
          <span className="hud-sep">/</span>
          <span className="hud-value">BANK <span className="hud-bright">{bankLabel}</span>/{totalLabel}</span>
          <span className="hud-sep">/</span>
          <span className="hud-value">DECKS {deckStart}–{deckEnd} OF {DECKS.length}</span>
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
                isSelected={selectedDeck?.id === deck.id}
                onClick={() => handleSelect(deck)}
              />
            ))}
          </div>
        </div>

        <button
          className="carousel-arrow carousel-arrow-next"
          onClick={() => navigate('next')}
          disabled={currentBank === TOTAL_BANKS - 1}
          aria-label="Next bank"
        >
          ▶
        </button>
      </div>

      <div className="bank-indicator">
        {Array.from({ length: TOTAL_BANKS }, (_, i) => (
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
          onClose={() => setSelectedDeck(null)}
        />
      )}

    </div>
  )
}
