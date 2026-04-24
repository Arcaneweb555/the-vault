import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function getCardValue(card) {
  const raw = card?.isFoil ? card?.prices?.usd_foil : card?.prices?.usd
  const value = Number.parseFloat(raw ?? '')
  return Number.isFinite(value) ? value : null
}

function normaliseHistoryEntry(entry) {
  if (Array.isArray(entry)) {
    return {
      cards: entry,
      setCode: null,
      setName: null,
      packType: 'play',
      totalValue: entry.reduce((sum, card) => sum + (getCardValue(card) ?? 0), 0),
      openedAt: null,
    }
  }

  if (!entry || !Array.isArray(entry.cards)) return null

  return {
    cards: entry.cards,
    setCode: entry.setCode ?? null,
    setName: entry.setName ?? null,
    packType: entry.packType ?? 'play',
    totalValue: Number.isFinite(entry.totalValue)
      ? entry.totalValue
      : entry.cards.reduce((sum, card) => sum + (getCardValue(card) ?? 0), 0),
    openedAt: entry.openedAt ?? null,
  }
}

export const usePackStore = create(
  persist(
    (set) => ({
      selectedSet: null,
      packType: 'play',

      // Session stats
      packsOpened: 0,
      mythicsHit: 0,
      raresHit: 0,
      foilsHit: 0,

      // Last 10 packs opened
      history: [],

      setSelectedSet: (setObj) => set({ selectedSet: setObj }),
      setPackType: (type) => set({ packType: type }),

      recordPack: (pack, setObj, packType) => set(s => ({
        packsOpened: s.packsOpened + 1,
        mythicsHit: s.mythicsHit + pack.filter(c => c.rarity === 'mythic').length,
        raresHit: s.raresHit + pack.filter(c => c.rarity === 'rare').length,
        foilsHit: s.foilsHit + pack.filter(c => c.isFoil).length,
        history: [
          {
            cards: pack,
            setCode: setObj?.code ?? null,
            setName: setObj?.name ?? null,
            packType,
            totalValue: pack.reduce((sum, card) => sum + (getCardValue(card) ?? 0), 0),
            openedAt: new Date().toISOString(),
          },
          ...s.history,
        ].slice(0, 10),
      })),

      resetStats: () => set({
        packsOpened: 0,
        mythicsHit: 0,
        raresHit: 0,
        foilsHit: 0,
        history: [],
      }),
    }),
    {
      name: 'vault:packs',
      version: 2,
      partialize: (state) => ({
        selectedSet: state.selectedSet,
        packType: state.packType,
        packsOpened: state.packsOpened,
        mythicsHit: state.mythicsHit,
        raresHit: state.raresHit,
        foilsHit: state.foilsHit,
        history: state.history,
      }),
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== 'object') return persistedState

        return {
          ...persistedState,
          history: Array.isArray(persistedState.history)
            ? persistedState.history.map(normaliseHistoryEntry).filter(Boolean)
            : [],
        }
      },
    }
  )
)
