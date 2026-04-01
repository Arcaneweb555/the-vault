# 🗃️ The Vault

> A TCG deck management and pack simulation tool — built for collectors who want visibility into their physical collections without touching a single sleeve.

![Status](https://img.shields.io/badge/status-in%20development-yellow)
![Built With](https://img.shields.io/badge/built%20with-React-61DAFB?logo=react)
![API](https://img.shields.io/badge/data-Scryfall%20API-orange)
![License](https://img.shields.io/badge/license-MIT-green)

---

## The Problem

Seven Commander decks sit sleeved and stacked on a shelf. To check what's in any one of them means pulling it out, breaking the order, risking the sleeves. There's no quick answer to "do I already have a Sol Ring in this deck?" without physically opening it.

The Vault solves that. It's a visual storage system for physical TCG decks — designed around the reality of how collectors actually interact with their cards.

---

## What It Does

### 🗂️ Deck Grid
A visual card-back grid representing your physical decks. Each deck is colour-coded by its mana identity and expandable to show a full sorted decklist — grouped by card type, with live card data pulled from the Scryfall API.

**Key interactions:**
- Paste in a decklist from Moxfield, Archidekt, or plain text — it parses automatically
- Filter and search within a deck without opening the physical cards
- Colour identity badges using MTG's WUBRG system
- Commander highlighted at the top of each deck view

### 🎲 Pack Simulator
Open virtual booster packs using real MTG pull rate data. Pick a set, open a pack, watch cards reveal one by one with rarity-appropriate effects.

**Tracked stats:**
- Mythic / Rare / Uncommon / Common pull rates across sessions
- Foil hit rate
- Running totals vs. expected probability — so you can see how lucky (or not) you actually are

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React 18 | Component reusability; the Deck and Card components are genuinely reusable across any TCG expansion |
| Styling | CSS Modules + custom properties | Scoped styles without a heavy dependency; easy to theme per TCG |
| Data | Scryfall REST API | Free, comprehensive, no auth required for read access |
| State | React useState / useReducer | No need for external state management at this scale — deliberate choice to keep the dependency footprint small |
| Deployment | Vercel | Zero-config deployment on push; free tier is sufficient |

---

## Design Decisions

See [`DECISIONS.md`](./DECISIONS.md) for the full reasoning log. Key choices at a glance:

- **Why no database?** Deck data lives in JSON files in `/src/data/`. For a personal collection tool, persistence via localStorage + exportable JSON is more useful than a backend. It also keeps the project self-contained and portable.
- **Why Scryfall and not a local card database?** Scryfall's API is the industry standard for MTG card data. Using it demonstrates real-world API integration with rate limiting, error handling, and caching considerations — more valuable as a portfolio signal than a static dataset.
- **Why simulate pull rates rather than use a live pack API?** No reliable free API exists for real-time pack contents. The simulation uses publicly documented pull rates from WotC and independent researchers — documented in `DECISIONS.md` with sources.

---

## Project Structure

```
the-vault/
├── src/
│   ├── components/
│   │   ├── DeckGrid/         # Visual card-back grid
│   │   ├── DeckViewer/       # Expanded deck list view
│   │   ├── PackOpener/       # Pack simulation + animation
│   │   ├── CardTile/         # Individual card component
│   │   └── StatsPanel/       # Pull rate tracking
│   ├── data/
│   │   └── decks/            # Your deck JSON files live here
│   ├── hooks/
│   │   ├── useScryfall.js    # API calls with caching
│   │   └── usePackSim.js     # Pull rate simulation logic
│   └── utils/
│       ├── deckParser.js     # Paste-in decklist → JSON
│       └── pullRates.js      # MTG booster pull rate constants
├── docs/
│   └── screenshots/          # Portfolio screenshots
├── DECISIONS.md
├── LICENSE
└── README.md
```

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/Arcaneweb555/the-vault.git
cd the-vault

# Install dependencies
npm install

# Start the dev server
npm run dev
```

No API keys required. Scryfall's API is open for read access.

---

## Roadmap

- [x] Project scaffolding and documentation
- [ ] Deck Grid component with colour identity
- [ ] Paste-in decklist parser
- [ ] Scryfall API integration with caching
- [ ] Deck Viewer with type-grouped card list
- [ ] Pack Simulator with real pull rates
- [ ] Stats Panel with session tracking
- [ ] localStorage persistence
- [ ] Exportable deck JSON
- [ ] Multi-TCG support (Pokemon, Lorcana)

---

## About This Project

This project was built as part of a deliberate transition into technology education. It sits at the intersection of a genuine hobby problem and the technical skills I'm developing — API integration, component architecture, data modelling, and UX thinking applied to a real use case.

The goal was never to build the best MTG deck manager on the internet. It was to build something real, document the decisions honestly, and ship it.

---

## License

MIT — see [`LICENSE`](./LICENSE)
