# The Vault — Technical Architecture

> This document describes the technical decisions, patterns, and structure that govern how The Vault is built. It is the contract between the current codebase and future development.

---

## Core Constraint

**The codebase must support web, desktop (Electron), and mobile (React Native) from a single shared logic layer.**

This constraint drives every architectural decision. It means:
- No business logic in React components
- No browser-specific APIs in shared hooks or utils (localStorage access is wrapped)
- State management via Zustand (works identically in React and React Native)
- Styling via CSS Modules for web; a separate theme system for React Native

---

## Layer Model

```
┌─────────────────────────────────────┐
│           UI Layer                  │  React components, CSS Modules
│     (platform-specific)             │  Platform: Web / React Native
├─────────────────────────────────────┤
│         Store Layer                 │  Zustand stores
│     (shared across platforms)       │  deckStore, gameStore, packStore
├─────────────────────────────────────┤
│         Hook Layer                  │  Custom hooks
│     (shared across platforms)       │  useScryfall, usePackSim, usePersist
├─────────────────────────────────────┤
│         Utils Layer                 │  Pure functions, zero dependencies
│     (shared across platforms)       │  deckParser, pullRates, manaConfig
├─────────────────────────────────────┤
│         Data Layer                  │  Scryfall API + localStorage
│     (platform adapter pattern)      │  scryfallCache, persistenceAdapter
└─────────────────────────────────────┘
```

The platform adapter pattern means: `usePersist.js` calls `persistenceAdapter.get/set`, and there are two implementations — one using `localStorage` (web), one using `AsyncStorage` (React Native). The hook never knows which it's using.

---

## State Management

**Zustand** is the choice for app-wide state.

Why not Redux? Too much boilerplate for this scale.  
Why not Context? Performance issues with frequent updates (life totals changing every second during a game).  
Why not useState everywhere? Doesn't scale across components without prop drilling.

Zustand hits the sweet spot: minimal API, works in React Native, supports middleware (persist, devtools), and stores are just importable functions.

### Store boundaries

| Store | Owns | Does NOT own |
|---|---|---|
| `deckStore` | Decks, selected deck, bank position | Card images (Scryfall cache) |
| `gameStore` | Life totals, damage, poison, dice | Player preferences |
| `packStore` | Current session, pack history, stats | Set list (Scryfall cache) |
| `settingsStore` | Theme, preferences, format defaults | Any game state |

Stores do not call each other. If cross-store data is needed, it's composed in a hook.

---

## Scryfall Integration

Scryfall is the single source of truth for all card data.

### Rate limiting
- Max 10 requests/second
- Recommended 50-100ms delay between requests
- We batch card lookups where possible

### Caching strategy
```
Request card data
       │
       ▼
Check localStorage cache
       │
   Hit? ──Yes──► Return cached data
       │
      No
       │
       ▼
Call Scryfall API
       │
       ▼
Store in localStorage with timestamp
       │
       ▼
Return data
```

Cache TTL: 24 hours for card data, 7 days for set lists.  
Cache key format: `scryfall:card:{scryfallId}` or `scryfall:set:{setCode}`

### What we fetch from Scryfall
- Card object by name (for deck import autocomplete)
- Card image URI (for pack opening reveal)
- Set list (for Pack Ripper set selector)
- Set card list (for pack simulation pool)

### What we do NOT fetch
- Prices (out of scope V1.0)
- Rulings (out of scope V1.0)
- Legality (out of scope V1.0)

---

## Data Persistence (V1.0)

All persistence is localStorage only in V1.0. The persistence layer is abstracted via a `persistenceAdapter` so swapping to IndexedDB or a remote database later requires changing one file.

```js
// persistenceAdapter.web.js
export const persistenceAdapter = {
  get: (key) => JSON.parse(localStorage.getItem(key)),
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  delete: (key) => localStorage.removeItem(key),
  keys: () => Object.keys(localStorage),
}

// persistenceAdapter.native.js (future)
import AsyncStorage from '@react-native-async-storage/async-storage'
export const persistenceAdapter = {
  get: async (key) => JSON.parse(await AsyncStorage.getItem(key)),
  set: async (key, value) => AsyncStorage.setItem(key, JSON.stringify(value)),
  delete: async (key) => AsyncStorage.removeItem(key),
  keys: async () => AsyncStorage.getAllKeys(),
}
```

### localStorage key namespace
All keys are prefixed `vault:` to avoid collisions:
- `vault:decks` — array of all user decks
- `vault:settings` — user preferences
- `vault:scryfall:card:{id}` — cached card objects
- `vault:scryfall:sets` — cached set list

---

## Component Rules

1. **No business logic in components.** Components call store actions or hook functions. They do not manipulate data themselves.

2. **One CSS module per component.** No global classes except design tokens in `index.css`.

3. **Props are the interface.** Components receive data and callbacks as props. They do not import stores directly — that happens in the page-level container component.

4. **Shared primitives live in `components/shared/`.** If a pattern appears in more than one component (a HUD bar, a neon button, a glass panel), it gets extracted.

---

## Deck Import Pipeline

```
User pastes plain text
        │
        ▼
deckParser.js
  - Strip comments (//)
  - Parse "Nx Card Name" or "N Card Name" or "N x Card Name"
  - Detect section headers (// Creatures) → ignored, we re-sort
  - Return { name: string, quantity: number }[]
        │
        ▼
Scryfall lookup (batched)
  - Fetch card type, colour identity, CMC for each card
  - Cache results
        │
        ▼
Build Deck object
  - Generate UUID
  - Set createdAt / updatedAt
  - Set source: 'imported'
  - Detect commander (card in 'Legendary Creature' type)
  - Derive colour identity from all cards
        │
        ▼
deckStore.addDeck(deck)
        │
        ▼
Persisted to localStorage
```

---

## Pack Simulation

Pack contents are simulated, not fetched live. The simulation uses:

1. **A card pool** — fetched from Scryfall for the selected set, split by rarity
2. **Pull rate constants** — documented in `pullRates.js` with sources
3. **A weighted random function** — seeded per pack, not per session (reproducible for debugging)

```js
function openPack(setCode, packType) {
  const pool = getSetPool(setCode)    // { commons[], uncommons[], rares[], mythics[] }
  const rates = PULL_RATES[packType]  // { mythicChance, foilChance, ... }

  const pack = []

  // Rare/Mythic slot
  const isMythic = Math.random() < rates.mythicChance
  pack.push(weightedPick(isMythic ? pool.mythics : pool.rares))

  // 3 Uncommons
  for (let i = 0; i < 3; i++) pack.push(weightedPick(pool.uncommons))

  // 6 Commons
  for (let i = 0; i < 6; i++) pack.push(weightedPick(pool.commons))

  // Wildcard slot (any rarity)
  // Land slot
  // Foil check

  return pack
}
```

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase | `DeckViewer.jsx` |
| CSS Modules | camelCase | `DeckViewer.module.css` |
| Stores | camelCase + Store suffix | `deckStore.js` |
| Hooks | camelCase + use prefix | `useScryfall.js` |
| Utils | camelCase | `deckParser.js` |
| Constants | SCREAMING_SNAKE_CASE | `PULL_RATES` |
| Data types | PascalCase JSDoc | `@typedef {Object} Deck` |

---

## Migration Path to TypeScript

The codebase is structured to make a TypeScript migration low-friction:

1. All data shapes are documented as JSDoc `@typedef` in `src/types/index.js`
2. Rename `.js` → `.ts`, `.jsx` → `.tsx` one file at a time
3. Replace JSDoc types with proper TS interfaces
4. No migration required for CSS, assets, or config

Target: TypeScript migration in V2.0 when the API surface stabilises.

---

## Platform Expansion Plan

### Desktop (Electron) — V2.0
- Electron wraps the web build
- Main process handles: file system access (local card image cache), system tray, auto-update
- Renderer process is the existing React app unchanged
- Persistence adapter swaps localStorage → electron-store

### Mobile (React Native) — V2.0/V3.0
- Shared: all stores, hooks, utils, data models
- New: React Native UI components (same design system, different implementation)
- Persistence adapter swaps localStorage → AsyncStorage
- Navigation: React Navigation
- Assessment point: evaluate if React Native Web allows sharing UI components too
