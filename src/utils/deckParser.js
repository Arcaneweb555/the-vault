const SECTION_HEADER_RE =
  /^(commander|companion|deck|mainboard|sideboard|maybeboard|considering|creatures|instants|sorceries|artifacts|enchantments|planeswalkers|battles|lands|tokens)\s*:?\s*$/i

const CARD_LINE_RE = /^(\d+)\s*x?\s+(.+)$/
const SCRYFALL_COLLECTION_URL = 'https://api.scryfall.com/cards/collection'
const SCRYFALL_BATCH_SIZE = 75
const SCRYFALL_BATCH_DELAY_MS = 100
const CARD_TYPES = ['Creature', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Land', 'Planeswalker']

function normalizeLine(rawLine) {
  return rawLine
    .trim()
    .replace(/^(sb|mb|cmdr|commander)\s*:\s*/i, '')
}

function normalizeCardName(rawName) {
  return rawName
    .trim()
    .replace(/^\[[^[\]]+\]\s*/, '')
    .replace(/\s+\[[^[\]]+\]\s*$/, '')
    .replace(/\s+\([A-Z0-9]{2,8}\)\s+\d+[a-z]?\s*$/i, '')
    .replace(/\s+\([A-Z0-9]{2,8}\)\s*$/i, '')
    .replace(/\s+\*\S+\*\s*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function shouldIgnoreLine(line) {
  return !line || line.startsWith('//') || SECTION_HEADER_RE.test(line)
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getCacheKey(name) {
  return `vault:scryfall:card:${name.toLowerCase()}`
}

function readCachedCard(name) {
  try {
    const raw = localStorage.getItem(getCacheKey(name))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCachedCard(name, card) {
  try {
    localStorage.setItem(getCacheKey(name), JSON.stringify(card))
  } catch {
    // localStorage unavailable or full
  }
}

function extractPrimaryType(typeLine = '') {
  const match = CARD_TYPES.find((type) => typeLine.includes(type))
  return match ?? 'Unknown'
}

function mapScryfallCard(card) {
  return {
    name: card.name,
    type: extractPrimaryType(card.type_line),
    cmc: card.cmc ?? 0,
    color_identity: Array.isArray(card.color_identity) ? card.color_identity : [],
    type_line: card.type_line ?? '',
  }
}

async function fetchCardBatch(cardNames) {
  const response = await fetch(SCRYFALL_COLLECTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      identifiers: cardNames.map((name) => ({ name })),
    }),
  })

  if (!response.ok) {
    throw new Error(`Scryfall lookup failed with status ${response.status}`)
  }

  const payload = await response.json()
  const cardsByName = new Map()

  for (const card of payload.data ?? []) {
    const mapped = mapScryfallCard(card)
    cardsByName.set(mapped.name.toLowerCase(), mapped)
    writeCachedCard(mapped.name, mapped)
  }

  return cardsByName
}

export async function enrichDeckCards(cards = []) {
  if (!Array.isArray(cards) || cards.length === 0) {
    return []
  }

  const lookup = new Map()
  const missing = []

  for (const card of cards) {
    const cached = readCachedCard(card.name)
    if (cached) {
      lookup.set(card.name.toLowerCase(), cached)
      continue
    }

    missing.push(card.name)
  }

  for (let index = 0; index < missing.length; index += SCRYFALL_BATCH_SIZE) {
    const batch = missing.slice(index, index + SCRYFALL_BATCH_SIZE)
    const fetchedCards = await fetchCardBatch(batch)

    for (const [name, value] of fetchedCards.entries()) {
      lookup.set(name, value)
    }

    if (index + SCRYFALL_BATCH_SIZE < missing.length) {
      await delay(SCRYFALL_BATCH_DELAY_MS)
    }
  }

  return cards.map((card) => {
    const enriched = lookup.get(card.name.toLowerCase())

    return {
      ...card,
      type: enriched?.type ?? card.type ?? 'Unknown',
      cmc: enriched?.cmc ?? card.cmc ?? 0,
      color_identity: enriched?.color_identity ?? card.color_identity ?? [],
      type_line: enriched?.type_line ?? card.type_line,
    }
  })
}

export function parseDecklist(decklistText = '') {
  const cardsByName = new Map()

  for (const rawLine of decklistText.split(/\r?\n/)) {
    const line = normalizeLine(rawLine)

    if (shouldIgnoreLine(line)) {
      continue
    }

    const match = line.match(CARD_LINE_RE)
    if (!match) {
      continue
    }

    const quantity = Number.parseInt(match[1], 10)
    const name = normalizeCardName(match[2])

    if (!quantity || !name) {
      continue
    }

    const existing = cardsByName.get(name)
    cardsByName.set(name, {
      quantity: (existing?.quantity ?? 0) + quantity,
      name,
    })
  }

  return Array.from(cardsByName.values())
}
