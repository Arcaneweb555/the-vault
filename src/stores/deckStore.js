import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DECKS as DEFAULT_DECKS } from '../data/decks'
import { MANA_CONFIG } from '../utils/manaConfig'

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

      addDeck: (deck) => set(s => ({ decks: [...s.decks, deck] })),

      updateDeck: (id, changes) => set(s => ({
        decks: s.decks.map(d =>
          d.id === id ? { ...d, ...changes, updatedAt: new Date().toISOString() } : d
        ),
      })),

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
      partialize: (state) => ({
        decks: state.decks,
        selectedDeckId: state.selectedDeckId,
        currentBank: state.currentBank,
      }),
    }
  )
)
