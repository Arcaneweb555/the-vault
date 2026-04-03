import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DECKS as DEFAULT_DECKS } from '../data/decks'

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
      })),

      selectDeck: (id) => set({ selectedDeckId: id }),

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
