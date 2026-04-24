import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const HEALTH_PLAYER_ACCENTS = [
  { tone: 'red', hex: '#e8705a' },
  { tone: 'gold', hex: '#ffb800' },
  { tone: 'purple', hex: '#b44fff' },
  { tone: 'green', hex: '#6dd68a' },
]

const HEALTH_PLAYER_AVATARS = ['STAR', 'MOON', 'SPARK', 'CROWN', 'SKULL', 'ORB']

const DEFAULT_HEALTH_PLAYERS = [
  { id: '1', name: 'Player 1', life: 40 },
  { id: '2', name: 'Player 2', life: 40 },
  { id: '3', name: 'Player 3', life: 40 },
  { id: '4', name: 'Player 4', life: 40 },
]

function buildDefaultStatuses() {
  return {
    activeTurn: false,
    monarch: false,
    initiative: false,
    eliminated: false,
    firstPlayer: false,
  }
}

function buildCommanderDefaultPlayers() {
  return DEFAULT_HEALTH_PLAYERS.map((player, index) => ({
    ...player,
    accent: HEALTH_PLAYER_ACCENTS[index % HEALTH_PLAYER_ACCENTS.length],
    avatar: HEALTH_PLAYER_AVATARS[index % HEALTH_PLAYER_AVATARS.length],
    poison: 0,
    energy: 0,
    experience: 0,
    notes: '',
    deckId: null,
    statuses: buildDefaultStatuses(),
  }))
}

function hydrateHealthPlayers(players = []) {
  return players.map((player, index) => ({
    ...player,
    accent: player.accent ?? HEALTH_PLAYER_ACCENTS[index % HEALTH_PLAYER_ACCENTS.length],
    avatar: player.avatar ?? HEALTH_PLAYER_AVATARS[index % HEALTH_PLAYER_AVATARS.length],
    poison: player.poison ?? 0,
    energy: player.energy ?? 0,
    experience: player.experience ?? 0,
    notes: player.notes ?? '',
    deckId: player.deckId ?? null,
    statuses: { ...buildDefaultStatuses(), ...(player.statuses ?? {}) },
  }))
}

function buildHealthPlayersFromSetup({ playerCount = 4, startingLife = 40, players = [] }) {
  return Array.from({ length: playerCount }, (_, index) => {
    const configured = players[index] ?? {}
    return {
      id: configured.id ?? `${index + 1}`,
      name: configured.name?.trim() || `Player ${index + 1}`,
      life: startingLife,
      accent: configured.accent ?? HEALTH_PLAYER_ACCENTS[index % HEALTH_PLAYER_ACCENTS.length],
      avatar: configured.avatar ?? HEALTH_PLAYER_AVATARS[index % HEALTH_PLAYER_AVATARS.length],
      poison: 0,
      energy: 0,
      experience: 0,
      notes: configured.notes ?? '',
      deckId: configured.deckId ?? null,
      statuses: buildDefaultStatuses(),
    }
  })
}

function buildCommanderTargets(players = buildCommanderDefaultPlayers()) {
  return players.map((player) => ({
    id: player.id,
    name: player.name,
    damage: 0,
  }))
}

function buildSessionPlayersFromHealth(healthPlayers = [], existingSessionPlayers = []) {
  return healthPlayers.map((player) => {
    const existing = existingSessionPlayers.find((sessionPlayer) => sessionPlayer.id === player.id)
    return {
      id: player.id,
      name: player.name,
      deck: existing?.deck ?? '',
      wins: existing?.wins ?? 0,
    }
  })
}

function buildLastSetupFromHealth(healthState) {
  return {
    playerCount: healthState.players.length,
    startingLife: healthState.startingLife ?? 40,
    layoutMode: healthState.layoutMode ?? 'grid',
    displayMode: healthState.displayMode ?? 'default',
    players: healthState.players.map((player) => ({
      id: player.id,
      name: player.name,
      accent: player.accent,
      avatar: player.avatar ?? '',
      deckId: player.deckId ?? null,
    })),
  }
}

export const useGameStore = create(
  persist(
    (set, get) => ({
      health: {
        players: buildCommanderDefaultPlayers(),
        startingLife: 40,
        layoutMode: 'grid',
        displayMode: 'default',
        lastSetup: null,
      },
      commanderDamage: { opponents: buildCommanderTargets() },
      board: { slots: {} },
      session: { players: buildSessionPlayersFromHealth(buildCommanderDefaultPlayers()), games: [] },
      diceResults: {},
      diceHistory: [],

      increasePlayerLife: (playerId, amount = 1) => {
        set((state) => ({
          health: {
            ...state.health,
            players: state.health.players.map((player) =>
              player.id === playerId ? { ...player, life: player.life + amount } : player
            ),
          },
        }))
      },

      decreasePlayerLife: (playerId, amount = 1) => {
        set((state) => ({
          health: {
            ...state.health,
            players: state.health.players.map((player) =>
              player.id === playerId ? { ...player, life: player.life - amount } : player
            ),
          },
        }))
      },

      setPlayerLife: (playerId, value) => {
        const nextLife = Number.parseInt(value, 10)
        if (!Number.isFinite(nextLife)) return

        set((state) => ({
          health: {
            ...state.health,
            players: state.health.players.map((player) =>
              player.id === playerId ? { ...player, life: nextLife } : player
            ),
          },
        }))
      },

      renameHealthPlayer: (playerId, name) => {
        const trimmedName = name?.trim()
        set((state) => ({
          health: {
            ...state.health,
            players: state.health.players.map((player) =>
              player.id === playerId ? { ...player, name: trimmedName || player.name } : player
            ),
            lastSetup: state.health.lastSetup
              ? {
                  ...state.health.lastSetup,
                  players: state.health.lastSetup.players.map((player) =>
                    player.id === playerId ? { ...player, name: trimmedName || player.name } : player
                  ),
                }
              : state.health.lastSetup,
          },
          commanderDamage: {
            ...state.commanderDamage,
            opponents: state.commanderDamage.opponents.map((opponent) =>
              opponent.id === playerId ? { ...opponent, name: trimmedName || opponent.name } : opponent
            ),
          },
          session: {
            ...state.session,
            players: state.session.players.map((player) =>
              player.id === playerId ? { ...player, name: trimmedName || player.name } : player
            ),
          },
        }))
      },

      setPlayerAvatar: (playerId, avatar) => {
        set((state) => ({
          health: {
            ...state.health,
            players: state.health.players.map((player) =>
              player.id === playerId ? { ...player, avatar: avatar || '' } : player
            ),
            lastSetup: state.health.lastSetup
              ? {
                  ...state.health.lastSetup,
                  players: state.health.lastSetup.players.map((player) =>
                    player.id === playerId ? { ...player, avatar: avatar || '' } : player
                  ),
                }
              : state.health.lastSetup,
          },
        }))
      },

      linkPlayerDeck: (playerId, deckId) => {
        set((state) => ({
          health: {
            ...state.health,
            players: state.health.players.map((player) =>
              player.id === playerId ? { ...player, deckId: deckId || null } : player
            ),
            lastSetup: state.health.lastSetup
              ? {
                  ...state.health.lastSetup,
                  players: state.health.lastSetup.players.map((player) =>
                    player.id === playerId ? { ...player, deckId: deckId || null } : player
                  ),
                }
              : state.health.lastSetup,
          },
        }))
      },

      addHealthPlayer: () => {
        const count = get().health.players.length + 1
        const id = Date.now().toString()

        set((state) => ({
          health: {
            ...state.health,
            players: [
              ...state.health.players,
              {
                id,
                name: `Player ${count}`,
                life: state.health.startingLife ?? 40,
                accent: HEALTH_PLAYER_ACCENTS[(count - 1) % HEALTH_PLAYER_ACCENTS.length],
                avatar: HEALTH_PLAYER_AVATARS[(count - 1) % HEALTH_PLAYER_AVATARS.length],
                poison: 0,
                energy: 0,
                experience: 0,
                notes: '',
                deckId: null,
                statuses: buildDefaultStatuses(),
              },
            ],
          },
          commanderDamage: {
            ...state.commanderDamage,
            opponents: [...state.commanderDamage.opponents, { id, name: `Player ${count}`, damage: 0 }],
          },
          session: {
            ...state.session,
            players: [...state.session.players, { id, name: `Player ${count}`, deck: '', wins: 0 }],
          },
        }))
      },

      removeHealthPlayer: (playerId) => {
        set((state) => ({
          health: {
            ...state.health,
            players: state.health.players.filter((player) => player.id !== playerId),
          },
          commanderDamage: {
            ...state.commanderDamage,
            opponents: state.commanderDamage.opponents.filter((opponent) => opponent.id !== playerId),
          },
          session: {
            ...state.session,
            players: state.session.players.filter((player) => player.id !== playerId),
          },
        }))
      },

      resetPlayersToCommanderDefaults: () => {
        const players = buildCommanderDefaultPlayers()
        const nextHealth = {
          players,
          startingLife: 40,
          layoutMode: 'grid',
          displayMode: 'default',
          lastSetup: null,
        }

        set({
          health: {
            ...nextHealth,
            lastSetup: buildLastSetupFromHealth(nextHealth),
          },
          commanderDamage: { opponents: buildCommanderTargets(players) },
          diceResults: {},
          diceHistory: [],
          session: { players: buildSessionPlayersFromHealth(players), games: [] },
        })
      },

      initializeGameSetup: ({
        playerCount = 4,
        startingLife = 40,
        layoutMode = 'grid',
        displayMode = 'default',
        players = [],
      }) => {
        const nextPlayers = buildHealthPlayersFromSetup({ playerCount, startingLife, players })
        const nextHealth = {
          players: nextPlayers,
          startingLife,
          layoutMode,
          displayMode,
          lastSetup: {
            playerCount,
            startingLife,
            layoutMode,
            displayMode,
            players: nextPlayers.map((player) => ({
              id: player.id,
              name: player.name,
              accent: player.accent,
              avatar: player.avatar ?? '',
              deckId: player.deckId ?? null,
            })),
          },
        }

        set({
          health: nextHealth,
          commanderDamage: { opponents: buildCommanderTargets(nextPlayers) },
          diceResults: {},
          diceHistory: [],
          session: {
            players: buildSessionPlayersFromHealth(nextPlayers, get().session.players),
            games: [],
          },
        })
      },

      rematchSamePlayers: () => {
        const { health, session } = get()
        const nextPlayers = health.players.map((player) => ({
          ...player,
          life: health.startingLife ?? 40,
          poison: 0,
          energy: 0,
          experience: 0,
          notes: player.notes ?? '',
          statuses: {
            ...buildDefaultStatuses(),
            firstPlayer: player.statuses?.firstPlayer ?? false,
          },
        }))

        set({
          health: {
            ...health,
            players: nextPlayers,
            lastSetup: buildLastSetupFromHealth({ ...health, players: nextPlayers }),
          },
          commanderDamage: { opponents: buildCommanderTargets(nextPlayers) },
          diceResults: {},
          diceHistory: [],
          session: {
            players: buildSessionPlayersFromHealth(nextPlayers, session.players),
            games: session.games,
          },
        })
      },

      setLayoutMode: (layoutMode) => {
        set((state) => ({
          health: {
            ...state.health,
            layoutMode,
            lastSetup: state.health.lastSetup ? { ...state.health.lastSetup, layoutMode } : state.health.lastSetup,
          },
        }))
      },

      setDisplayMode: (displayMode) => {
        set((state) => ({
          health: {
            ...state.health,
            displayMode,
            lastSetup: state.health.lastSetup ? { ...state.health.lastSetup, displayMode } : state.health.lastSetup,
          },
        }))
      },

      adjustPlayerCounter: (playerId, counterKey, delta) => {
        set((state) => ({
          health: {
            ...state.health,
            players: state.health.players.map((player) =>
              player.id === playerId
                ? { ...player, [counterKey]: Math.max(0, (player[counterKey] ?? 0) + delta) }
                : player
            ),
          },
        }))
      },

      togglePlayerStatus: (playerId, statusKey) => {
        const uniqueStatuses = new Set(['activeTurn', 'monarch', 'initiative', 'firstPlayer'])

        set((state) => ({
          health: {
            ...state.health,
            players: state.health.players.map((player) => {
              if (uniqueStatuses.has(statusKey)) {
                if (player.id === playerId) {
                  return {
                    ...player,
                    statuses: {
                      ...player.statuses,
                      [statusKey]: !player.statuses?.[statusKey],
                    },
                  }
                }

                return {
                  ...player,
                  statuses: {
                    ...player.statuses,
                    [statusKey]: false,
                  },
                }
              }

              if (player.id !== playerId) return player

              return {
                ...player,
                statuses: {
                  ...player.statuses,
                  [statusKey]: !player.statuses?.[statusKey],
                },
              }
            }),
          },
        }))
      },

      rollDice: (sides) => {
        const result = Math.floor(Math.random() * sides) + 1
        const rolledAt = new Date().toISOString()
        set((state) => ({
          diceResults: { ...state.diceResults, [sides]: result },
          diceHistory: [
            { id: `${Date.now()}-${sides}`, sides, result, rolledAt },
            ...state.diceHistory,
          ].slice(0, 10),
        }))
        return result
      },

      adjustCommanderDamage: (opponentId, delta) => {
        set((state) => ({
          commanderDamage: {
            ...state.commanderDamage,
            opponents: state.commanderDamage.opponents.map((opponent) =>
              opponent.id === opponentId
                ? { ...opponent, damage: Math.max(0, opponent.damage + delta) }
                : opponent
            ),
          },
        }))
      },

      resetCommanderDamage: () => {
        set({
          commanderDamage: { opponents: buildCommanderTargets(get().health.players) },
        })
      },

      addToken: (slotKey, type, label = '') => {
        set((state) => {
          const slot = state.board.slots[slotKey] || { tokens: [] }
          const existing = slot.tokens.find(
            (token) => token.type === type && (type !== 'custom' || token.label === label)
          )
          const tokens = existing
            ? slot.tokens.map((token) => (token === existing ? { ...token, count: token.count + 1 } : token))
            : [...slot.tokens, { type, label, count: 1 }]

          return {
            board: {
              ...state.board,
              slots: { ...state.board.slots, [slotKey]: { tokens } },
            },
          }
        })
      },

      incrementToken: (slotKey, tokenIndex) => {
        set((state) => {
          const slot = state.board.slots[slotKey]
          if (!slot) return state

          return {
            board: {
              ...state.board,
              slots: {
                ...state.board.slots,
                [slotKey]: {
                  tokens: slot.tokens.map((token, index) =>
                    index === tokenIndex ? { ...token, count: token.count + 1 } : token
                  ),
                },
              },
            },
          }
        })
      },

      removeToken: (slotKey, tokenIndex) => {
        set((state) => {
          const slot = state.board.slots[slotKey]
          if (!slot) return state

          return {
            board: {
              ...state.board,
              slots: {
                ...state.board.slots,
                [slotKey]: { tokens: slot.tokens.filter((_, index) => index !== tokenIndex) },
              },
            },
          }
        })
      },

      clearBoard: () => set({ board: { slots: {} } }),

      addPlayer: () => {
        const id = Date.now().toString()
        const count = get().session.players.length + 1
        set((state) => ({
          session: {
            ...state.session,
            players: [...state.session.players, { id, name: `Player ${count}`, deck: '', wins: 0 }],
          },
        }))
      },

      removePlayer: (id) => {
        set((state) => ({
          session: {
            ...state.session,
            players: state.session.players.filter((player) => player.id !== id),
          },
        }))
      },

      updatePlayer: (id, changes) => {
        set((state) => ({
          session: {
            ...state.session,
            players: state.session.players.map((player) => (player.id === id ? { ...player, ...changes } : player)),
          },
        }))
      },

      recordWin: (winnerId, turnCount = null) => {
        set((state) => ({
          session: {
            players: state.session.players.map((player) =>
              player.id === winnerId ? { ...player, wins: player.wins + 1 } : player
            ),
            games: [
              ...state.session.games,
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
        set((state) => ({
          session: {
            players: state.session.players.map((player) => ({ ...player, wins: 0 })),
            games: [],
          },
        }))
      },
    }),
    {
      name: 'vault:game',
      version: 5,
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== 'object') return persistedState

        const hydratedPlayers = persistedState.health?.players?.length
          ? hydrateHealthPlayers(persistedState.health.players)
          : buildCommanderDefaultPlayers()

        const health = persistedState.health?.players?.length
          ? {
              ...persistedState.health,
              players: hydratedPlayers,
              startingLife: persistedState.health.startingLife ?? 40,
              layoutMode: persistedState.health.layoutMode ?? 'grid',
              displayMode: persistedState.health.displayMode ?? 'default',
              lastSetup: persistedState.health.lastSetup ?? buildLastSetupFromHealth({
                players: hydratedPlayers,
                startingLife: persistedState.health.startingLife ?? 40,
                layoutMode: persistedState.health.layoutMode ?? 'grid',
                displayMode: persistedState.health.displayMode ?? 'default',
              }),
            }
          : {
              players: hydratedPlayers,
              startingLife: 40,
              layoutMode: 'grid',
              displayMode: 'default',
              lastSetup: buildLastSetupFromHealth({
                players: hydratedPlayers,
                startingLife: 40,
                layoutMode: 'grid',
                displayMode: 'default',
              }),
            }

        return {
          ...persistedState,
          health,
          commanderDamage: persistedState.commanderDamage?.opponents?.length
            ? persistedState.commanderDamage
            : { opponents: buildCommanderTargets(hydratedPlayers) },
          board: persistedState.board ?? { slots: {} },
          session: persistedState.session ?? { players: buildSessionPlayersFromHealth(hydratedPlayers), games: [] },
          diceResults: persistedState.diceResults ?? {},
          diceHistory: persistedState.diceHistory ?? [],
        }
      },
      partialize: (state) => ({
        health: state.health,
        commanderDamage: state.commanderDamage,
        board: state.board,
        session: state.session,
        diceResults: state.diceResults,
        diceHistory: state.diceHistory,
      }),
    }
  )
)
