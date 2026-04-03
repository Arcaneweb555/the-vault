# The Vault — Product Specification

> A TCG companion app for Magic: The Gathering players. Manage your collection, organise decks, simulate pack openings, and track games — all in one place.

**Version:** 1.0 (Current Target)  
**Last Updated:** April 2026  
**Status:** Active Development

---

## Vision

The Vault is a TCG companion tool built for serious MTG players who own physical cards. It bridges the gap between your physical collection and the digital tools you need to manage it — without requiring you to leave the app, open a browser, or dig through your binders.

The long-term vision is a cross-platform app (web, desktop via Electron, mobile via React Native) with a shared codebase. V1.0 ships as a web app. The architecture is designed from day one to support that expansion without a rewrite.

---

## V1.0 Scope — What Ships

### 1. The Vault (Deck Manager)
The core feature. A visual storage system for your Commander (and other format) decks.

**Features:**
- Visual deck grid — glass case aesthetic, backlit by colour identity
- Import decklist via paste-in (standard plain text format from Moxfield, Archidekt, etc.)
- Manual card entry with Scryfall autocomplete
- Per-deck view showing full card list grouped by type
- Commander highlighted with CDR badge
- Colour identity auto-detected from deck contents via Scryfall
- Deck count, type breakdown stats
- localStorage persistence — decks survive page refresh
- Export deck as plain text

**Out of scope for V1.0:** Cloud sync, deck sharing, deck builder (card suggestions), collection import

---

### 2. Pack Ripper (Pack Simulator)
Simulate opening booster packs from any MTG set using real pull rate data.

**Features:**
- Set selector — choose from all MTG sets (set list from Scryfall API)
- Pack type selector — Play Booster, Draft Booster, Collector Booster (where applicable per set)
- Card reveal animation — cards flip in one by one with rarity-appropriate effects
- Rarity colours and foil shimmer on rare/mythic hits
- Session stats panel — running pull rates vs. expected probability
- Pack history — last 10 packs opened, collapsible

**Pull rates (Play Booster, current standard):**
- 14 cards per pack
- Mythic: ~13.5% (1 in 7.4 packs)
- Rare: ~86.5%
- Foil: ~33% chance in wildcard slot
- Uncommons: 3 per pack
- Commons: 6 per pack

**Out of scope for V1.0:** Adding opened cards to collection, trading/wishlist

---

### 3. Game Tools
Lightweight utility tools for tracking an active game of Commander.

#### Spindown / Dice Roller
- D20 (Spindown life tracker) — large, prominent, animated roll
- D6, D4, D10, D12, D100 — secondary dice
- Roll history (last 5 rolls)
- Multi-dice rolls (e.g. 2D6)

#### Life / Token Tracker
- Up to 4 players (Commander pods)
- Each player: life total (starts at 40), name, colour
- Commander damage tracking per player (21 damage from a single commander = elimination)
- +1/+1 counter tracker for tokens and creatures
- Common token types quick-add (1/1 Soldier, 2/2 Zombie, 3/3 Beast, etc.)
- Poison counter tracker (10 poison = elimination)

---

## What Goes on the Roadmap (V2.0+)

These are validated ideas that don't ship in V1.0 but are explicitly planned:

- **Collection Manager** — import your full collection (CSV from Moxfield/Archidekt, or manual entry), track what you own
- **Deck Builder with AI Suggestions** — given your collection, suggest a deck using Scryfall card data and EDHREC synergy data
- **Cloud Sync** — user accounts, decks sync across devices
- **Desktop App** — Electron wrapper around the web app, system tray, offline mode
- **Mobile App** — React Native, same component logic, touch-optimised UI
- **Price Tracking** — TCGplayer/Scryfall price data per deck and per card
- **Trade Binder** — mark cards as available for trade, generate a shareable list

---

## Technical Architecture

### Guiding Principles

1. **Web first, platform agnostic** — All business logic lives in framework-agnostic hooks and utils. No logic in UI components. This is what makes React Native and Electron viable later without a rewrite.

2. **Scryfall as the single source of truth** — We don't maintain a card database. Scryfall is free, comprehensive, and up to date. We cache aggressively in localStorage.

3. **No backend in V1.0** — localStorage for persistence, Scryfall API for card data. This keeps the deployment story simple (static host) and removes auth complexity.

4. **State management via Zustand** — useState for local component state, Zustand for app-wide state (decks, collection, settings). Scales cleanly to mobile without changing the store API.

5. **Typed data models** — Even without TypeScript, all data shapes are documented as JSDoc types. This is the foundation for a TypeScript migration later.

---

### Folder Structure (Target)

```
src/
├── components/           # UI only — no business logic
│   ├── DeckGrid/
│   ├── DeckViewer/
│   ├── DeckImporter/     # Paste-in + manual entry
│   ├── PackOpener/
│   ├── DiceRoller/
│   ├── LifeTracker/
│   ├── TokenTracker/
│   └── shared/           # Reusable UI primitives
│       ├── HudBar/
│       ├── GlassPanel/
│       ├── NeonButton/
│       └── Manapip/
├── stores/               # Zustand stores — app state
│   ├── deckStore.js      # Decks, selected deck, CRUD
│   ├── packStore.js      # Pack sim session state
│   └── gameStore.js      # Life totals, counters, dice
├── hooks/                # Reusable logic
│   ├── useScryfall.js    # API calls + caching
│   ├── usePackSim.js     # Pull rate simulation
│   └── usePersist.js     # localStorage read/write
├── utils/                # Pure functions, no React
│   ├── deckParser.js     # Plain text → deck object
│   ├── pullRates.js      # Pack probability constants
│   ├── manaConfig.js     # WUBRG colour system
│   └── scryfallCache.js  # Cache management
├── data/                 # Static seed data only
│   └── decks.js          # Default/demo decks
└── constants/
    ├── sets.js           # MTG set list cache
    └── tokens.js         # Common token types
```

---

### Data Models

```js
/**
 * @typedef {Object} Deck
 * @property {string} id           - Unique identifier (uuid)
 * @property {string} name         - Display name
 * @property {string} commander    - Commander card name
 * @property {string[]} colours    - Colour identity ['W','U','B','R','G']
 * @property {string} theme        - Short theme description
 * @property {string} format       - 'commander' | 'standard' | 'modern' etc.
 * @property {number} cardCount    - Total card count
 * @property {Card[]} cards        - Array of cards
 * @property {string} sleeve       - Sleeve colour hex
 * @property {string} createdAt    - ISO date string
 * @property {string} updatedAt    - ISO date string
 * @property {string} source       - 'manual' | 'imported' | 'default'
 */

/**
 * @typedef {Object} Card
 * @property {number} quantity     - Number of copies
 * @property {string} name         - Card name (matches Scryfall)
 * @property {string} type         - 'Creature' | 'Instant' | etc.
 * @property {string} [scryfallId] - Scryfall card ID (populated on lookup)
 * @property {string} [imageUri]   - Scryfall image URI (cached)
 * @property {string[]} [colours]  - Card colour identity
 * @property {number} [cmc]        - Converted mana cost
 */

/**
 * @typedef {Object} PackSession
 * @property {string} setCode      - MTG set code (e.g. 'MKM')
 * @property {string} packType     - 'play' | 'draft' | 'collector'
 * @property {number} packsOpened  - Total packs opened this session
 * @property {number} mythicsHit   - Mythic rares pulled
 * @property {number} raresHit     - Rares pulled
 * @property {number} foilsHit     - Foils pulled
 * @property {Card[][]} history    - Last 10 packs, each an array of cards
 */

/**
 * @typedef {Object} GameState
 * @property {Player[]} players    - Up to 4 players
 * @property {number} turnNumber   - Current turn
 */

/**
 * @typedef {Object} Player
 * @property {string} id
 * @property {string} name
 * @property {number} life         - Current life total
 * @property {number} startingLife - 20 or 40
 * @property {Object} cmdDamage    - { [playerId]: number }
 * @property {number} poison       - Poison counters
 * @property {string} colour       - Player colour for UI
 */
```

---

### State Management (Zustand)

```js
// deckStore.js shape
{
  decks: Deck[],             // All decks
  selectedDeckId: string,    // Currently viewed deck
  currentBank: number,       // Carousel bank (0-indexed)

  addDeck: (deck) => void,
  updateDeck: (id, changes) => void,
  deleteDeck: (id) => void,
  importDeck: (plainText) => void,   // Parses + adds
  selectDeck: (id) => void,
  setBank: (n) => void,
}

// gameStore.js shape
{
  players: Player[],
  turnNumber: number,
  lastRoll: { dice: string, result: number },

  setPlayers: (players) => void,
  updateLife: (playerId, delta) => void,
  addCmdDamage: (fromId, toId, amount) => void,
  addPoison: (playerId, amount) => void,
  rollDice: (sides) => void,
  resetGame: () => void,
}
```

---

## Development Phases

### Phase 1 — Foundation (Current)
- ✅ Project scaffolding and documentation
- ✅ Holographic UI aesthetic established
- ✅ Deck grid with carousel navigation
- ✅ Real precon decklists (Sauron, Mothman, Tyranids)
- ✅ Deck viewer with type breakdown
- ⬜ Zustand store migration (replace static data)
- ⬜ localStorage persistence
- ⬜ Deck import via paste-in

### Phase 2 — Core Features
- ⬜ Pack Ripper with real set list from Scryfall
- ⬜ Card reveal animations with rarity effects
- ⬜ Dice Roller
- ⬜ Life / Token Tracker
- ⬜ Scryfall card autocomplete on manual entry

### Phase 3 — Polish & Deploy
- ⬜ Vercel deployment
- ⬜ Mobile responsive layout
- ⬜ Accessibility audit
- ⬜ Performance optimisation (Scryfall cache, lazy loading)
- ⬜ Demo video for portfolio

### Phase 4 — V2.0 Planning
- ⬜ Collection import
- ⬜ Electron wrapper (desktop)
- ⬜ React Native evaluation (mobile)
- ⬜ User accounts + cloud sync

---

## Competitive Landscape

| Tool | Strengths | What We Do Differently |
|---|---|---|
| Moxfield | Best deck builder, huge community | We focus on physical collection mgmt + game tools |
| Archidekt | Good visual deck builder | We're a companion tool, not a builder |
| MTG Goldfish | Best price/meta data | We're collection-first, not meta-first |
| Dragon Shield App | Good collection tracker | Better aesthetics, open source, web-first |
| No app | — | We fill the gap for in-game tools (life tracker, dice) combined with collection mgmt |

---

## Open Questions

- **Authentication:** When we add cloud sync, do we build auth ourselves or use something like Supabase Auth / Clerk?
- **Monetisation:** Free forever? Freemium with cloud sync as paid? Worth deciding before V2.0.
- **TCG expansion:** The Vault name was chosen to support non-MTG TCGs. When does Pokemon/Lorcana/Flesh and Blood support make sense?
- **Legal:** Scryfall API terms allow non-commercial use. If this becomes a paid product, review terms carefully.
