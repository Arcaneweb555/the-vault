import { useState, useRef, useEffect, useCallback } from 'react'
import { PULL_RATES } from '../utils/pullRates'

const SCRYFALL_BASE = 'https://api.scryfall.com'
const SET_CACHE_TTL  = 7 * 24 * 60 * 60 * 1000  // 7 days
const POOL_CACHE_TTL = 7 * 24 * 60 * 60 * 1000  // 7 days

/** Polite delay between paginated Scryfall requests */
const delay = (ms) => new Promise(r => setTimeout(r, ms))

/** Pick a random element from an array */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Read a JSON blob from localStorage with a TTL check */
function readCache(key, ttl) {
  try {
    const cached = JSON.parse(localStorage.getItem(key))
    if (cached && Date.now() - cached.ts < ttl) return cached.data
  } catch { /* ignore */ }
  return null
}

/** Write a JSON blob to localStorage */
function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }))
  } catch { /* localStorage full or unavailable — no-op */ }
}

/**
 * Fetch all boosterable cards for a set from Scryfall, split by rarity.
 * Results are cached in localStorage under vault:scryfall:set:{code}.
 *
 * @param {string} setCode
 * @returns {Promise<{ mythics: Object[], rares: Object[], uncommons: Object[], commons: Object[], lands: Object[] }>}
 */
async function fetchSetPool(setCode) {
  const cacheKey = `vault:scryfall:set:${setCode.toLowerCase()}`
  const cached = readCache(cacheKey, POOL_CACHE_TTL)
  if (cached) return cached

  const pool = { mythics: [], rares: [], uncommons: [], commons: [], lands: [] }

  // not:extra excludes tokens, art cards, and other non-booster inserts
  let url = `${SCRYFALL_BASE}/cards/search?q=set:${setCode}+not:extra&unique=cards&order=set&page=1`

  while (url) {
    await delay(100)
    const res = await fetch(url)
    if (!res.ok) {
      if (res.status === 404) break  // set has no searchable cards
      throw new Error(`Scryfall ${res.status}: ${res.statusText}`)
    }
    const json = await res.json()

    for (const card of json.data) {
      // Skip double-faced tokens and emblems
      if (['token', 'double_faced_token', 'art_series', 'emblem'].includes(card.layout)) continue

      const entry = {
        name: card.name,
        type: card.type_line,
        rarity: card.rarity,
        scryfallId: card.id,
      }

      if (card.type_line?.includes('Basic Land') || card.type_line?.startsWith('Land')) {
        pool.lands.push(entry)
      } else if (card.rarity === 'mythic') {
        pool.mythics.push(entry)
      } else if (card.rarity === 'rare') {
        pool.rares.push(entry)
      } else if (card.rarity === 'uncommon') {
        pool.uncommons.push(entry)
      } else {
        pool.commons.push(entry)
      }
    }

    url = json.has_more ? json.next_page : null
  }

  // Fallback: land slot uses commons if the set has no basic lands
  if (pool.lands.length === 0) pool.lands = pool.commons

  writeCache(cacheKey, pool)
  return pool
}

/**
 * Simulate opening a single Play Booster from a card pool.
 *
 * Slot breakdown (14 cards total):
 *   1  rare/mythic  — mythicChance 13.5%
 *   3  uncommons
 *   6  commons
 *   1  wildcard     — any rarity, foilChance 33%
 *   1  basic land
 *   2  bonus commons — to reach totalCards: 14
 *
 * @param {{ mythics, rares, uncommons, commons, lands }} pool
 * @returns {Object[]}
 */
function simulatePack(pool) {
  const rates = PULL_RATES.play
  const pack = []

  const safePick = (arr, fallback = []) => {
    const src = arr.length > 0 ? arr : fallback
    return src.length > 0 ? pick(src) : null
  }

  // Rare / mythic slot
  const isMythic = pool.mythics.length > 0 && Math.random() < rates.mythicChance
  const rareCard = safePick(isMythic ? pool.mythics : pool.rares, pool.rares)
  if (rareCard) {
    pack.push({ ...rareCard, rarity: isMythic ? 'mythic' : 'rare', isFoil: false })
  }

  // Uncommon slots
  for (let i = 0; i < rates.uncommonSlots; i++) {
    const c = safePick(pool.uncommons)
    if (c) pack.push({ ...c, rarity: 'uncommon', isFoil: false })
  }

  // Common slots
  for (let i = 0; i < rates.commonSlots; i++) {
    const c = safePick(pool.commons)
    if (c) pack.push({ ...c, rarity: 'common', isFoil: false })
  }

  // Wildcard slot — any rarity, foil check
  const all = [...pool.mythics, ...pool.rares, ...pool.uncommons, ...pool.commons]
  const wildcardCard = safePick(all)
  if (wildcardCard) {
    pack.push({ ...wildcardCard, isFoil: Math.random() < rates.foilChance })
  }

  // Basic land slot
  const landCard = safePick(pool.lands)
  if (landCard) {
    pack.push({ ...landCard, rarity: 'land', isFoil: false })
  }

  // Bonus commons to reach totalCards: 14
  while (pack.length < rates.totalCards && pool.commons.length > 0) {
    const c = pick(pool.commons)
    pack.push({ ...c, rarity: 'common', isFoil: false })
  }

  return pack
}

// ─────────────────────────────────────────────────────────────────────────────

export function usePackSim() {
  const [sets, setSets] = useState([])
  const [setsLoading, setSetsLoading] = useState(true)
  const [setsError, setSetsError] = useState(null)
  const [poolLoading, setPoolLoading] = useState(false)
  const [poolError, setPoolError] = useState(null)
  const [currentPack, setCurrentPack] = useState(null)

  const poolRef = useRef(null)
  const loadedSetRef = useRef(null)

  // Fetch the Scryfall set list on mount
  useEffect(() => {
    async function loadSets() {
      const cacheKey = 'vault:scryfall:sets'
      const cached = readCache(cacheKey, SET_CACHE_TTL)
      if (cached) {
        setSets(cached)
        setSetsLoading(false)
        return
      }

      try {
        const res = await fetch(`${SCRYFALL_BASE}/sets`)
        if (!res.ok) throw new Error(`Scryfall ${res.status}`)
        const json = await res.json()

        const filtered = json.data
          .filter(s => ['expansion', 'core', 'masters', 'draft_innovation', 'starter'].includes(s.set_type))
          .filter(s => s.card_count > 0 && !s.digital)
          .sort((a, b) => new Date(b.released_at) - new Date(a.released_at))
          .map(s => ({
            code: s.code,
            name: s.name,
            releasedAt: s.released_at,
            cardCount: s.card_count,
            iconUri: s.icon_svg_uri,
          }))

        writeCache(cacheKey, filtered)
        setSets(filtered)
      } catch (err) {
        setSetsError(err.message)
      } finally {
        setSetsLoading(false)
      }
    }

    loadSets()
  }, [])

  /**
   * Load the card pool for a given set code.
   * Idempotent — if the same set is already loaded it returns immediately.
   */
  const selectSet = useCallback(async (code) => {
    if (!code) {
      poolRef.current = null
      loadedSetRef.current = null
      setCurrentPack(null)
      return
    }
    if (loadedSetRef.current === code) return  // already loaded

    setPoolLoading(true)
    setPoolError(null)
    poolRef.current = null
    loadedSetRef.current = code

    try {
      poolRef.current = await fetchSetPool(code)
    } catch (err) {
      setPoolError(err.message)
      loadedSetRef.current = null
    } finally {
      setPoolLoading(false)
    }
  }, [])

  /**
   * Simulate opening one pack from the currently loaded pool.
   * Returns the pack array so the caller can record it in the store.
   */
  const openPack = useCallback(() => {
    if (!poolRef.current) return null
    const pack = simulatePack(poolRef.current)
    setCurrentPack(pack)
    return pack
  }, [])

  return {
    sets,
    setsLoading,
    setsError,
    poolLoading,
    poolError,
    currentPack,
    selectSet,
    openPack,
  }
}
