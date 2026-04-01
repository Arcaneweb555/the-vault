# Design & Technical Decisions

This file is a running log of meaningful decisions made during the development of The Vault — including the reasoning, the alternatives considered, and where I changed my mind.

The audience for this document is future-me, collaborators, and anyone evaluating this project who wants to understand the thinking behind it.

---

## Decision Log

---

### 001 — No backend / no database
**Date:** Project start  
**Decision:** All deck data is stored as JSON files in `/src/data/` and persisted via `localStorage`. There is no backend server or database.

**Alternatives considered:**
- Supabase (free tier Postgres + auth)
- Firebase Firestore
- Simple Express + SQLite backend

**Reasoning:**  
The use case is a single user managing their own physical collection. A backend adds deployment complexity, auth requirements, and ongoing maintenance cost for no meaningful benefit at this scale. JSON + localStorage is fast, portable, and keeps the project self-contained — you can run it offline.

The tradeoff is that data doesn't sync across devices. That's an acceptable limitation for v1, and a clear scope for a future enhancement if multi-device becomes a real need.

---

### 002 — Scryfall API for card data
**Date:** Project start  
**Decision:** Use the [Scryfall REST API](https://scryfall.com/docs/api) for all card data (names, types, images, mana costs, colour identity).

**Alternatives considered:**
- Bundling a local copy of the MTG card database (available as a bulk JSON download from Scryfall)
- MTGJSON (another open dataset)

**Reasoning:**  
The Scryfall API is the standard that the MTG community actually uses. It's well-documented, free for non-commercial use, returns rich card objects, and stays up to date with new releases automatically. Using it demonstrates real-world API integration skills: rate limiting (10 requests/second), error handling, response caching, and async data fetching patterns.

The local bulk download was considered for performance — it would eliminate all API latency. Ruled out for v1 because it's a 200MB+ file and complicates the deployment story significantly. Caching responses in localStorage achieves most of the same benefit for a personal collection tool.

**Scryfall API rate limit:** Max 10 requests/second with a recommended 50–100ms delay between requests. Caching strategy: cache card objects in localStorage by Scryfall ID, TTL of 24 hours.

---

### 003 — Pull rate simulation methodology
**Date:** Pack Simulator design  
**Decision:** Simulate MTG booster pack pull rates using documented probability data rather than a live pack API.

**Sources used:**
- [WotC Play Booster announcement (2024)](https://magic.wizards.com/en/news/making-magic/the-play-booster-2023-10-23)
- Community pull rate analysis from r/magicTCG and independent researchers

**Play Booster composition (current standard as of 2024):**
- 14 cards per pack
- 6 Commons
- 3 Uncommons  
- 1 Rare or Mythic Rare (Mythic appears in approximately 1 in 7.4 packs — ~13.5%)
- 1 Land (basic or occasionally special treatment)
- 1 Non-foil card of any rarity (wildcard slot)
- 1 Token/Ad card
- 1 Foil card of any rarity (~33% chance of foil rare or higher)

**Reasoning:**  
No reliable free API exists that provides real-time pack opening results. The simulation uses these publicly documented rates as constants in `pullRates.js`. Each simulated pack uses a seeded random function weighted against these probabilities. This is honest about what it is — a simulation, not a real pack — and the stats panel shows running averages so users can see how their results compare to expected rates over time.

---

### 004 — Decklist parser input format
**Date:** Deck input UX design  
**Decision:** Support paste-in of the standard plain-text decklist format used by Moxfield, Archidekt, CubeCobra, and MTGO exports.

**Format:**
```
1 Sol Ring
1 Command Tower
4 Lightning Bolt
// Comments are ignored
```

Optional companion formats to support:
- `1x Sol Ring` (with the `x` multiplier notation)
- Sections prefixed with `// Creatures`, `// Lands` etc. (treated as ignored comments, we re-sort by type from Scryfall data)

**Reasoning:**  
Requiring users to fill in a structured form to add 100 cards is a non-starter. Paste-in from any of the major deck building sites removes friction entirely. The parser is a utility function in `utils/deckParser.js` — deliberately isolated so it's easy to test and extend.

---

### 005 — Colour identity representation
**Date:** Deck Grid design  
**Decision:** Represent each deck's colour identity using MTG's standard mana symbol system (WUBRG: White, Blue, Black, Red, Green) as coloured badge dots.

**Alternatives considered:**
- Full mana symbol SVGs
- Text labels ("Simic", "Grixis")
- Commander card art as deck thumbnail

**Reasoning:**  
The coloured dot system is immediately readable to any MTG player and is the convention used by virtually every MTG tool. Full mana SVGs add asset management complexity for v1. Guild/shard names are less universal (newer players may not know "Grixis"). Commander card art via Scryfall is the ideal v2 enhancement — deferred because it adds an API call per deck on initial load and complicates the loading state.

---

## Decisions Pending

- **Testing strategy:** What gets tested, what doesn't, and why. (The parser utility is the clearest candidate for unit tests.)
- **Animation library:** CSS transitions vs. a library like Framer Motion for the pack opening reveal.
- **Accessibility approach:** Keyboard navigation for the deck grid; colour-blind friendly mana identity representation.

---

*This document is updated as decisions are made. Not retrospectively cleaned up.*
