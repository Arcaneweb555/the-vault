import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEFAULT_OPPONENTS = [
  { id: '1', name: 'Opponent 1', damage: 0 },
  { id: '2', name: 'Opponent 2', damage: 0 },
]

const DEFAULT_PLAYERS = [
  { id: '1', name: 'Player 1', deck: '', wins: 0 },
  { id: '2', name: 'Player 2', deck: '', wins: 0 },
]

export const useGameStore = create(
  persist(
    (set, get) => ({
      spindown: { current: 20, history: [] },
      commanderDamage: { opponents: DEFAULT_OPPONENTS },
      board: { slots: {} },
      session: { players: DEFAULT_PLAYERS, games: [] },
      diceResults: {},

      // ─── Spindown ─────────────────────────────────────────────
      rollD20: () => {
        const result = Math.floor(Math.random() * 20) + 1
        set(s => ({
          spindown: {
            current: result,
            history: [result, ...s.spindown.history].slice(0, 5),
          },
        }))
      },

      adjustLife: (delta) => {
        set(s => ({
          spindown: { ...s.spindown, current: s.spindown.current + delta },
        }))
      },

      // ─── Secondary dice ───────────────────────────────────────
      rollDice: (sides) => {
        const result = Math.floor(Math.random() * sides) + 1
        set(s => ({ diceResults: { ...s.diceResults, [sides]: result } }))
        return result
      },

      // ─── Commander damage ──────────────────────────────────────
      adjustCommanderDamage: (opponentId, delta) => {
        set(s => ({
          commanderDamage: {
            ...s.commanderDamage,
            opponents: s.commanderDamage.opponents.map(op =>
              op.id === opponentId
                ? { ...op, damage: Math.max(0, op.damage + delta) }
                : op
            ),
          },
        }))
      },

      addOpponent: () => {
        const id = Date.now().toString()
        const count = get().commanderDamage.opponents.length + 1
        set(s => ({
          commanderDamage: {
            ...s.commanderDamage,
            opponents: [
              ...s.commanderDamage.opponents,
              { id, name: `Opponent ${count}`, damage: 0 },
            ],
          },
        }))
      },

      removeOpponent: (id) => {
        set(s => ({
          commanderDamage: {
            ...s.commanderDamage,
            opponents: s.commanderDamage.opponents.filter(op => op.id !== id),
          },
        }))
      },

      renameOpponent: (id, name) => {
        set(s => ({
          commanderDamage: {
            ...s.commanderDamage,
            opponents: s.commanderDamage.opponents.map(op =>
              op.id === id ? { ...op, name } : op
            ),
          },
        }))
      },

      // ─── Board ────────────────────────────────────────────────
      addToken: (slotKey, type, label = '') => {
        set(s => {
          const slot = s.board.slots[slotKey] || { tokens: [] }
          const existing = slot.tokens.find(
            t => t.type === type && (type !== 'custom' || t.label === label)
          )
          const tokens = existing
            ? slot.tokens.map(t => (t === existing ? { ...t, count: t.count + 1 } : t))
            : [...slot.tokens, { type, label, count: 1 }]
          return {
            board: {
              ...s.board,
              slots: { ...s.board.slots, [slotKey]: { tokens } },
            },
          }
        })
      },

      incrementToken: (slotKey, tokenIndex) => {
        set(s => {
          const slot = s.board.slots[slotKey]
          if (!slot) return s
          return {
            board: {
              ...s.board,
              slots: {
                ...s.board.slots,
                [slotKey]: {
                  tokens: slot.tokens.map((t, i) =>
                    i === tokenIndex ? { ...t, count: t.count + 1 } : t
                  ),
                },
              },
            },
          }
        })
      },

      removeToken: (slotKey, tokenIndex) => {
        set(s => {
          const slot = s.board.slots[slotKey]
          if (!slot) return s
          const tokens = slot.tokens.filter((_, i) => i !== tokenIndex)
          return {
            board: {
              ...s.board,
              slots: { ...s.board.slots, [slotKey]: { tokens } },
            },
          }
        })
      },

      clearBoard: () => set({ board: { slots: {} } }),

      // ─── Session ──────────────────────────────────────────────
      addPlayer: () => {
        const id = Date.now().toString()
        const count = get().session.players.length + 1
        set(s => ({
          session: {
            ...s.session,
            players: [...s.session.players, { id, name: `Player ${count}`, deck: '', wins: 0 }],
          },
        }))
      },

      removePlayer: (id) => {
        set(s => ({
          session: {
            ...s.session,
            players: s.session.players.filter(p => p.id !== id),
          },
        }))
      },

      updatePlayer: (id, changes) => {
        set(s => ({
          session: {
            ...s.session,
            players: s.session.players.map(p => (p.id === id ? { ...p, ...changes } : p)),
          },
        }))
      },

      recordWin: (winnerId, turnCount = null) => {
        set(s => ({
          session: {
            players: s.session.players.map(p =>
              p.id === winnerId ? { ...p, wins: p.wins + 1 } : p
            ),
            games: [
              ...s.session.games,
              {
                id: Date.now().toString(),
                winnerId,
                turnCount,
                timestamp: new Date().toISOString(),
              },
            ],
          },
        }))
      },

      resetSession: () => {
        set(s => ({
          session: {
            players: s.session.players.map(p => ({ ...p, wins: 0 })),
            games: [],
          },
        }))
      },
    }),
    {
      name: 'vault:game',
      partialize: (state) => ({
        spindown: state.spindown,
        commanderDamage: state.commanderDamage,
        board: state.board,
        session: state.session,
        diceResults: state.diceResults,
      }),
    }
  )
)
