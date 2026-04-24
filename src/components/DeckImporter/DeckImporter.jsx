import { useEffect, useMemo, useState } from 'react'
import { useDeckStore } from '../../stores/deckStore'
import { parseDecklist } from '../../utils/deckParser'
import { MANA_CONFIG } from '../../utils/manaConfig'
import './DeckImporter.css'

const COLOUR_ORDER = ['W', 'U', 'B', 'R', 'G']

function buildDeckId() {
  return `deck-import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getSleeveColour(colours) {
  return MANA_CONFIG[colours[0]]?.hex ?? '#0a1520'
}

function ensureCommanderIncluded(cards, commander) {
  if (!commander?.trim()) {
    return cards
  }

  if (cards.some((card) => card.name.toLowerCase() === commander.toLowerCase())) {
    return cards
  }

  return [{ quantity: 1, name: commander, type: 'Creature' }, ...cards]
}

function inferCardType(name, commander) {
  if (!commander?.trim()) return 'Unknown'
  return name.toLowerCase() === commander.toLowerCase() ? 'Creature' : 'Unknown'
}

export default function DeckImporter({
  isOpen,
  onClose,
  onImportSuccess,
  mode = 'import',
  title,
  kicker,
  submitLabel,
}) {
  const addDeck = useDeckStore((state) => state.addDeck)
  const [name, setName] = useState('')
  const [commander, setCommander] = useState('')
  const [colours, setColours] = useState([])
  const [decklist, setDecklist] = useState('')
  const [error, setError] = useState('')
  const isCreateMode = mode === 'create'
  const modalKicker = kicker ?? (isCreateMode ? 'PACK RIPPER' : 'ARCANE VAULT')
  const modalTitle = title ?? (isCreateMode ? 'NEW DECK' : 'IMPORT DECK')
  const primaryActionLabel = submitLabel ?? (isCreateMode ? 'CREATE DECK' : 'IMPORT')

  const parsedPreview = useMemo(() => parseDecklist(decklist), [decklist])

  const resetForm = () => {
    setName('')
    setCommander('')
    setColours([])
    setDecklist('')
    setError('')
  }

  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  const toggleColour = (symbol) => {
    setColours((current) =>
      current.includes(symbol)
        ? current.filter((value) => value !== symbol)
        : [...current, symbol].sort((a, b) => COLOUR_ORDER.indexOf(a) - COLOUR_ORDER.indexOf(b))
    )
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedName = name.trim()
    const trimmedCommander = commander.trim()
    const parsedCards = parseDecklist(decklist)

    if (!trimmedName) {
      setError('Deck name is required.')
      return
    }

    if (!isCreateMode && !trimmedCommander) {
      setError('Commander name is required.')
      return
    }

    if (!isCreateMode && parsedCards.length === 0) {
      setError('Paste at least one card into the decklist.')
      return
    }

    const cards = ensureCommanderIncluded(
      parsedCards.map((card) => ({
        ...card,
        type: inferCardType(card.name, trimmedCommander),
      })),
      trimmedCommander
    )

    const deck = {
      id: buildDeckId(),
      name: trimmedName,
      commander: trimmedCommander || 'Unassigned Commander',
      colours,
      sleeve: getSleeveColour(colours),
      theme: isCreateMode ? 'Pack Ripper Deck' : 'Imported Deck',
      cardCount: cards.reduce((total, card) => total + card.quantity, 0),
      cards,
    }

    const savedDeck = await addDeck(deck)
    handleClose()
    onImportSuccess(savedDeck)
  }

  return (
    <div className="deck-importer-overlay" onClick={handleClose}>
      <div className="deck-importer-modal" onClick={(event) => event.stopPropagation()}>
        <div className="deck-importer-header">
          <div className="deck-importer-header-copy">
            <span className="deck-importer-kicker">{modalKicker}</span>
            <h2 className="deck-importer-title">{modalTitle}</h2>
          </div>
          <button type="button" className="deck-importer-close" onClick={handleClose} aria-label="Close importer">
            X
          </button>
        </div>

        <form className="deck-importer-form" onSubmit={handleSubmit}>
          <div className="deck-importer-grid">
            <label className="deck-importer-field">
              <span className="deck-importer-label">DECK NAME</span>
              <input
                className="deck-importer-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="HOSTS OF MORDOR"
                autoFocus
              />
            </label>

            {!isCreateMode && (
              <label className="deck-importer-field">
                <span className="deck-importer-label">COMMANDER</span>
                <input
                  className="deck-importer-input"
                  value={commander}
                  onChange={(event) => setCommander(event.target.value)}
                  placeholder="SAURON, LORD OF THE RINGS"
                />
              </label>
            )}
          </div>

          <div className="deck-importer-field">
            <span className="deck-importer-label">COLOUR IDENTITY</span>
            <div className="deck-importer-pips" role="group" aria-label="Colour identity selector">
              {COLOUR_ORDER.map((symbol) => {
                const mana = MANA_CONFIG[symbol]
                const active = colours.includes(symbol)

                return (
                  <button
                    key={symbol}
                    type="button"
                    className={`deck-importer-pip${active ? ' active' : ''}`}
                    style={{ '--pip-colour': mana.hex }}
                    onClick={() => toggleColour(symbol)}
                    aria-pressed={active}
                    aria-label={mana.name}
                  >
                    {symbol}
                  </button>
                )
              })}
            </div>
          </div>

          <label className="deck-importer-field">
            <span className="deck-importer-label">{isCreateMode ? 'DECKLIST (OPTIONAL)' : 'DECKLIST'}</span>
            <textarea
              className="deck-importer-textarea"
              value={decklist}
              onChange={(event) => setDecklist(event.target.value)}
              placeholder={'1 Sol Ring\n1x Arcane Signet\n// comments are ignored'}
              rows={14}
            />
          </label>

          <div className="deck-importer-footer">
            <div className="deck-importer-meta">
              <span>
                {parsedPreview.length} UNIQUE CARDS PARSED
                {isCreateMode && parsedPreview.length === 0 ? ' - START EMPTY OR PASTE A LIST' : ''}
              </span>
              {error && <span className="deck-importer-error">{error}</span>}
            </div>
            <button type="submit" className="deck-importer-submit">
              {primaryActionLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
