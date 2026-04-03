import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const usePackStore = create(
  persist(
    (set, get) => ({
      selectedSet: null,   // { code, name, releasedAt, cardCount }
      packType: 'play',

      // Session stats
      packsOpened: 0,
      mythicsHit: 0,
      raresHit: 0,
      foilsHit: 0,

      // Last 10 packs opened — each is an array of card objects
      history: [],

      setSelectedSet: (setObj) => set({ selectedSet: setObj }),
      setPackType: (type) => set({ packType: type }),

      recordPack: (pack) => set(s => ({
        packsOpened: s.packsOpened + 1,
        mythicsHit: s.mythicsHit + pack.filter(c => c.rarity === 'mythic').length,
        raresHit:   s.raresHit   + pack.filter(c => c.rarity === 'rare').length,
        foilsHit:   s.foilsHit   + pack.filter(c => c.isFoil).length,
        history: [pack, ...s.history].slice(0, 10),
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
      partialize: (state) => ({
        selectedSet:  state.selectedSet,
        packType:     state.packType,
        packsOpened:  state.packsOpened,
        mythicsHit:   state.mythicsHit,
        raresHit:     state.raresHit,
        foilsHit:     state.foilsHit,
        history:      state.history,
      }),
    }
  )
)
