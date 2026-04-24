import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_DECKS } from '../data/decks'
import { enrichDeckCards } from '../utils/deckParser'
import { getDeckSymbolCode } from '../utils/deckIcons'
import { MANA_CONFIG } from '../utils/manaConfig'
import { normalisePulledCardForDeck } from '../utils/cardData'

const LEGACY_DUMMY_DECK_IDS = new Set(
  Array.from({ length: 97 }, (_, index) => `deck-${String(index + 4).padStart(3, '0')}`)
)

const pruneLegacyDummyDecks = (decks) => {
  if (!Array.isArray(decks)) {
    return DEFAULT_DECKS
  }

  return decks.filter((deck) => !LEGACY_DUMMY_DECK_IDS.has(deck?.id))
}

const normaliseImportedDeck = async (deck) => {
  const cards = await enrichDeckCards(deck.cards)
  const commanderCard = cards.find((card) => card.name.toLowerCase() === deck.commander?.toLowerCase())
  const colours = Array.isArray(deck.colours) && deck.colours.length > 0
    ? deck.colours
    : (commanderCard?.color_identity ?? [])

  return {
    ...deck,
    colours,
    iconSymbol: getDeckSymbolCode({ ...deck, colours, cards }),
    cards,
    cardCount: cards.reduce((total, card) => total + card.quantity, 0),
  }
}

// One-time migration: remove the old raw-array format written by the manual
// localStorage implementation so persist middleware can start with a clean slate.
try {
  const raw = localStorage.getItem('vault:decks')
  if (raw !== null && Array.isArray(JSON.parse(raw))) {
    localStorage.removeItem('vault:decks')
  }
} catch {
  // localStorage unavailable or value is not valid JSON — nothing to migrate
}

export const useDeckStore = create(
  persist(
    (set, get) => ({
      decks: DEFAULT_DECKS,
      selectedDeckId: null,
      selectedColour: null,
      currentBank: 0,

      addDeck: async (deck) => {
        const hydratedDeck = await normaliseImportedDeck(deck)
        set((s) => ({ decks: [...s.decks, hydratedDeck] }))
        return hydratedDeck
      },

      updateDeck: (id, changes) => set(s => ({
        decks: s.decks.map(d =>
          d.id === id ? { ...d, ...changes, updatedAt: new Date().toISOString() } : d
        ),
      })),

      addCardToDeck: (deckId, card) => set((state) => {
        if (!deckId || !card) return state

        const nextCard = normalisePulledCardForDeck(card)

        return {
          decks: state.decks.map((deck) => {
            if (deck.id !== deckId) return deck

            const cards = Array.isArray(deck.cards) ? [...deck.cards] : []
            const existingCardIndex = cards.findIndex((existingCard) => (
              (
                (existingCard.scryfallId && existingCard.scryfallId === nextCard.scryfallId) ||
                (existingCard.oracle_id && existingCard.oracle_id === nextCard.oracle_id) ||
                existingCard.name === nextCard.name
              ) &&
              Boolean(existingCard.isFoil) === Boolean(nextCard.isFoil)
            ))

            if (existingCardIndex >= 0) {
              cards[existingCardIndex] = {
                ...cards[existingCardIndex],
                quantity: (cards[existingCardIndex].quantity ?? 1) + nextCard.quantity,
              }
            } else {
              cards.push(nextCard)
            }

            const cardCount = cards.reduce((total, deckCard) => total + (deckCard.quantity ?? 1), 0)

            return {
              ...deck,
              cards,
              cardCount,
              updatedAt: new Date().toISOString(),
            }
          }),
        }
      }),

      deleteDeck: (id) => set(s => ({
        decks: s.decks.filter(d => d.id !== id),
        selectedDeckId: s.selectedDeckId === id ? null : s.selectedDeckId,
        selectedColour: s.selectedDeckId === id ? null : s.selectedColour,
      })),

      updateNotes: (id, notes) => set(s => ({
        decks: s.decks.map(d => d.id === id ? { ...d, notes } : d),
      })),

      selectDeck: (id) => {
        const deck = id ? get().decks.find(d => d.id === id) : null
        const selectedColour = deck?.colours?.[0]
          ? (MANA_CONFIG[deck.colours[0]]?.hex ?? null)
          : null
        set({ selectedDeckId: id, selectedColour })
      },

      setBank: (n) => set({ currentBank: n }),
    }),
    {
      name: 'vault:decks',
      version: 1,
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return persistedState
        }

        const decks = pruneLegacyDummyDecks(persistedState.decks)
        const selectedDeckId = decks.some((deck) => deck.id === persistedState.selectedDeckId)
          ? persistedState.selectedDeckId
          : null

        return {
          ...persistedState,
          decks,
          selectedDeckId,
        }
      },
      partialize: (state) => ({
        decks: state.decks,
        selectedDeckId: state.selectedDeckId,
        currentBank: state.currentBank,
      }),
    }
  )
)
