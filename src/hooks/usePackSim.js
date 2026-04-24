import { useState, useRef, useEffect, useCallback } from 'react'
import { PULL_RATES } from '../utils/pullRates'
import { extractPrimaryCardType, normaliseCardImages } from '../utils/cardData'

const SCRYFALL_BASE = 'https://api.scryfall.com'
const SET_CACHE_TTL = 7 * 24 * 60 * 60 * 1000
const POOL_CACHE_TTL = 7 * 24 * 60 * 60 * 1000
const PLAY_BOOSTER_CUTOFF = '2024-02-09'
const POOL_CACHE_VERSION = 'v3'
const PREMIUM_FRAME_EFFECTS = new Set([
  'extendedart',
  'showcase',
  'etched',
  'textured',
  'shatteredglass',
  'inverted',
  'legendary',
  'upsidedown',
  'snow',
  'nyxtouched',
  'sunmoondfc',
  'mooneldrazidfc',
  'companion',
  'enchantment',
  'originpwdfc',
  'fandfc',
  'borderless',
])
const PREMIUM_PROMO_TYPES = new Set([
  'boosterfun',
  'borderless',
  'showcase',
  'extendedart',
  'fullart',
  'galaxyfoil',
  'surgefoil',
  'confettifoil',
  'fracturefoil',
  'textured',
  'halofoil',
  'stepandcompleat',
  'serialized',
])

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickWeighted(entries) {
  const validEntries = entries.filter((entry) => entry.weight > 0 && entry.value?.length !== 0)
  if (validEntries.length === 0) return null

  const totalWeight = validEntries.reduce((sum, entry) => sum + entry.weight, 0)
  let roll = Math.random() * totalWeight

  for (const entry of validEntries) {
    roll -= entry.weight
    if (roll <= 0) return entry.value
  }

  return validEntries[validEntries.length - 1].value
}

function readCache(key, ttl) {
  try {
    const cached = JSON.parse(localStorage.getItem(key))
    if (cached && Date.now() - cached.ts < ttl) return cached.data
  } catch {
    // Ignore malformed cache entries.
  }

  return null
}

function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }))
  } catch {
    // Ignore localStorage issues.
  }
}

function getTodayPriceCacheKey() {
  const todayKey = getTodayCacheDate()
  return `vault:scryfall:prices:${todayKey}`
}

function getTodayCacheDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function readPriceCache() {
  try {
    return JSON.parse(localStorage.getItem(getTodayPriceCacheKey())) ?? {}
  } catch {
    return {}
  }
}

function writePriceCache(data) {
  try {
    localStorage.setItem(getTodayPriceCacheKey(), JSON.stringify(data))
  } catch {
    // Ignore localStorage issues.
  }
}

function mergePricesIntoPool(pool, priceMap) {
  const mergeGroup = (cards) => cards.map(card => ({
    ...card,
    prices: priceMap[card.scryfallId] ?? { usd: null, usd_foil: null },
  }))

  return {
    mythics: mergeGroup(pool.mythics),
    rares: mergeGroup(pool.rares),
    uncommons: mergeGroup(pool.uncommons),
    commons: mergeGroup(pool.commons),
    lands: mergeGroup(pool.lands),
    premium: mergeGroup(pool.premium ?? []),
    collectorFallback: Boolean(pool.collectorFallback),
  }
}

function mergeCollectorPools(specialPool, fillerPool) {
  return {
    special: specialPool,
    filler: fillerPool,
    collectorFallback: Boolean(specialPool.collectorFallback),
  }
}

function normalizePackType(packType) {
  if (packType === 'collector_booster') return 'collector'
  return packType
}

export function getBoosterTypesForSet(setObj) {
  if (!setObj) return []

  if (['masters', 'masterpiece'].includes(setObj.setType)) {
    return ['draft']
  }

  const baseType = setObj.releasedAt >= PLAY_BOOSTER_CUTOFF ? 'play' : 'draft'
  return [baseType, 'collector']
}

function createEmptyPool() {
  return {
    mythics: [],
    rares: [],
    uncommons: [],
    commons: [],
    lands: [],
    premium: [],
    collectorFallback: false,
  }
}

function createPoolEntry(card) {
  const { imageUrl, image_uris, card_faces } = normaliseCardImages(card)

  return {
    id: card.id,
    oracle_id: card.oracle_id ?? null,
    name: card.name,
    type: extractPrimaryCardType(card),
    type_line: card.type_line ?? '',
    rarity: card.rarity,
    scryfallId: card.id,
    imageUrl,
    image_uris,
    card_faces,
    mana_cost: card.mana_cost ?? null,
    cmc: card.cmc ?? 0,
    oracle_text: card.oracle_text ?? null,
    finishes: card.finishes ?? [],
    isCollectorEligible: isCollectorEligible(card),
  }
}

function hasPremiumFrameEffect(card) {
  return (card.frame_effects ?? []).some((effect) => PREMIUM_FRAME_EFFECTS.has(effect))
}

function hasPremiumPromoType(card) {
  return (card.promo_types ?? []).some((promoType) => PREMIUM_PROMO_TYPES.has(promoType))
}

function isCollectorEligible(card) {
  if (!card || typeof card !== 'object') return false

  return Boolean(
    card.promo ||
    card.border_color === 'borderless' ||
    card.full_art ||
    card.variation ||
    card.variation_of ||
    card.textless ||
    card.finishes?.includes('etched') ||
    hasPremiumFrameEffect(card) ||
    hasPremiumPromoType(card)
  )
}

function addCardToPool(pool, card) {
  if (['token', 'double_faced_token', 'art_series', 'emblem'].includes(card.layout)) return

  const entry = createPoolEntry(card)
  if (entry.isCollectorEligible) pool.premium.push(entry)

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

async function fetchCardsForQuery(query) {
  const cards = []
  let url = `${SCRYFALL_BASE}/cards/search?q=${encodeURIComponent(query)}&include_extras=false`

  while (url) {
    await delay(100)
    const res = await fetch(url)
    if (!res.ok) {
      if (res.status === 404) break
      throw new Error(`Scryfall ${res.status}: ${res.statusText}`)
    }

    const json = await res.json()
    cards.push(...(json.data ?? []))
    url = json.has_more ? json.next_page : null
  }

  return cards
}

function buildPoolFromCards(cards, options = {}) {
  const pool = createEmptyPool()

  for (const card of cards) {
    addCardToPool(pool, card)
  }

  if (pool.lands.length === 0) pool.lands = pool.commons
  pool.collectorFallback = Boolean(options.collectorFallback)
  return pool
}

async function fetchSetPool(setCode) {
  const cacheKey = `vault:scryfall:set:${POOL_CACHE_VERSION}:${setCode.toLowerCase()}`
  const cached = readCache(cacheKey, POOL_CACHE_TTL)
  if (cached) return cached

  const cards = await fetchCardsForQuery(`set:${setCode} is:booster`)
  const pool = buildPoolFromCards(cards)

  writeCache(cacheKey, pool)
  return pool
}

async function fetchCollectorPool(setCode, regularPool) {
  const normalizedSetCode = setCode.toLowerCase()
  const cacheKey = `vault:scryfall:collector:${POOL_CACHE_VERSION}:${normalizedSetCode}`
  const cached = readCache(cacheKey, POOL_CACHE_TTL)
  if (cached) return cached

  const cards = await fetchCardsForQuery(`set:${setCode} unique:prints`)
  const premiumCards = cards.filter(isCollectorEligible)

  const collectorPool = buildPoolFromCards(premiumCards)

  if (premiumCards.length === 0) {
    const fallbackPool = {
      ...regularPool,
      collectorFallback: true,
    }
    writeCache(cacheKey, fallbackPool)
    return fallbackPool
  }

  writeCache(cacheKey, collectorPool)
  return collectorPool
}

async function fetchSetPrices(setCode) {
  const normalizedSetCode = setCode.toLowerCase()
  const dailyCache = readPriceCache()
  if (dailyCache[normalizedSetCode]) return dailyCache[normalizedSetCode]

  const queries = [
    `set:${setCode} is:booster`,
    `set:${setCode} unique:prints`,
  ]
  const setPrices = {}

  for (const query of queries) {
    const cards = await fetchCardsForQuery(query)
    for (const card of cards) {
      setPrices[card.id] = {
        usd: card.prices?.usd ?? null,
        usd_foil: card.prices?.usd_foil ?? null,
      }
    }
  }

  writePriceCache({
    ...dailyCache,
    [normalizedSetCode]: setPrices,
  })

  return setPrices
}

function getAllNonLandCards(pool) {
  return [...pool.mythics, ...pool.rares, ...pool.uncommons, ...pool.commons]
}

function getAllRareOrMythicCards(pool) {
  return [...pool.mythics, ...pool.rares]
}

function pickFoilWeighted(arr, fallback = []) {
  const src = arr.length > 0 ? arr : fallback
  if (src.length === 0) return null

  const weighted = src.flatMap(card => {
    const supportsPremiumFinish =
      card.finishes?.includes('foil') ||
      card.finishes?.includes('etched') ||
      card.prices?.usd_foil != null

    return supportsPremiumFinish ? [card, card, card] : [card]
  })

  return pick(weighted)
}

function cloneWithMeta(card, extra = {}) {
  if (!card) return null

  return {
    ...card,
    imageUrl: card.imageUrl ?? null,
    isFoil: Boolean(extra.isFoil),
    ...extra,
  }
}

function buildBags(pool) {
  return {
    mythics: [...(pool?.mythics ?? [])],
    rares: [...(pool?.rares ?? [])],
    uncommons: [...(pool?.uncommons ?? [])],
    commons: [...(pool?.commons ?? [])],
    lands: [...(pool?.lands ?? [])],
    premium: [...(pool?.premium ?? [])],
  }
}

function takeRandomFromBag(bag, keys, fallbackKeys = []) {
  for (const key of [...keys, ...fallbackKeys]) {
    if (!bag[key]?.length) continue

    const index = Math.floor(Math.random() * bag[key].length)
    return bag[key].splice(index, 1)[0]
  }

  return null
}

function pickRareOrMythic(pool, mythicChance, options = {}) {
  const sourcePool = options.preferPremium && pool.premium?.length > 0
    ? {
        mythics: pool.premium.filter((card) => card.rarity === 'mythic'),
        rares: pool.premium.filter((card) => card.rarity === 'rare'),
      }
    : pool

  const wantsMythic = sourcePool.mythics?.length > 0 && Math.random() < mythicChance
  const primaryBucket = wantsMythic
    ? sourcePool.mythics
    : (sourcePool.rares?.length ? sourcePool.rares : sourcePool.mythics)
  const card = primaryBucket?.length ? pick(primaryBucket) : null

  if (!card && !options.allowFallback) return null

  const fallbackPool = getAllRareOrMythicCards(pool)
  return card ?? (fallbackPool.length > 0 ? pick(fallbackPool) : null)
}

function pickPlayCommonLike(pool) {
  const bucket = pickWeighted([
    { value: pool.commons, weight: 87 },
    { value: pool.uncommons, weight: 9 },
    { value: pool.rares, weight: 3 },
    { value: pool.mythics, weight: 1 },
  ])

  return bucket?.length ? pick(bucket) : null
}

function pickPlayWildcard(pool) {
  const bucket = pickWeighted([
    { value: pool.commons, weight: 58 },
    { value: pool.uncommons, weight: 24 },
    { value: pool.rares, weight: 14 },
    { value: pool.mythics, weight: 4 },
  ])

  return bucket?.length ? pick(bucket) : null
}

function pickCollectorPremiumCard(premiumPool, fillerPool, bag) {
  const premiumCard = takeRandomFromBag(bag, ['premium'])
  if (premiumCard) return premiumCard

  const weightedBucket = pickWeighted([
    { value: getAllRareOrMythicCards(fillerPool), weight: 50 },
    { value: fillerPool.uncommons, weight: 35 },
    { value: fillerPool.commons, weight: 15 },
  ])

  return weightedBucket?.length ? pickFoilWeighted(weightedBucket, getAllNonLandCards(fillerPool)) : null
}

function buildPlayBooster(pool, rates) {
  // Generic play boosters are modeled as the 14 playable cards from the modern
  // 15-slot structure. The token/ad/art slot is intentionally omitted in this UI.
  const pack = []
  const addCard = (card, extra = {}) => {
    const nextCard = cloneWithMeta(card, extra)
    if (nextCard) pack.push(nextCard)
  }

  const guaranteedRare = pickRareOrMythic(pool, rates.mythicChance, { allowFallback: true })
  addCard(guaranteedRare, {
    rarity: guaranteedRare?.rarity ?? 'rare',
    isFoil: false,
  })

  for (let i = 0; i < 3; i += 1) {
    addCard(pool.uncommons.length > 0 ? pick(pool.uncommons) : pickPlayCommonLike(pool), {
      rarity: pool.uncommons.length > 0 ? 'uncommon' : 'common',
      isFoil: false,
    })
  }

  for (let i = 0; i < 6; i += 1) {
    addCard(pool.commons.length > 0 ? pick(pool.commons) : pickPlayCommonLike(pool), {
      rarity: 'common',
      isFoil: false,
    })
  }

  const commonOrSpecial = pickPlayCommonLike(pool)
  if (commonOrSpecial) {
    addCard(commonOrSpecial, {
      rarity: commonOrSpecial.rarity ?? 'common',
      isFoil: false,
      isBonusSheetLike: commonOrSpecial.rarity !== 'common',
    })
  }

  const landCard = (pool.lands?.length ?? 0) > 0 ? pick(pool.lands) : pick(pool.commons)
  if (landCard) {
    addCard(landCard, {
      rarity: landCard.type_line?.includes('Land') ? 'land' : landCard.rarity ?? 'common',
      isFoil: false,
    })
  }

  const nonFoilWildcard = pickPlayWildcard(pool)
  if (nonFoilWildcard) {
    addCard(nonFoilWildcard, {
      rarity: nonFoilWildcard.rarity ?? 'common',
      isFoil: false,
    })
  }

  const foilWildcard = pickPlayWildcard(pool)
  if (foilWildcard) {
    addCard(foilWildcard, {
      rarity: foilWildcard.rarity ?? 'common',
      isFoil: true,
    })
  }

  return pack.slice(0, rates.totalCards)
}

function buildCollectorBooster(pool, rates) {
  // Real collector boosters are highly set-specific. This is a generic model that
  // keeps the product identity believable: rare-heavy, almost fully foil, and rich
  // in premium treatments, while gracefully falling back when Scryfall lacks enough
  // booster-fun printings for the selected set.
  const premiumPool = pool.special ?? pool
  const fillerPool = pool.filler ?? pool
  const premiumBags = buildBags(premiumPool)
  const fillerBags = buildBags(fillerPool)
  const pack = []
  const addCard = (card, extra = {}) => {
    const nextCard = cloneWithMeta(card, extra)
    if (nextCard) pack.push(nextCard)
  }

  for (let i = 0; i < 5; i += 1) {
    const premiumRare = takeRandomFromBag(
      premiumBags,
      Math.random() < rates.mythicChance ? ['mythics', 'rares'] : ['rares', 'mythics']
    )
    const fallbackRare = takeRandomFromBag(
      fillerBags,
      Math.random() < rates.mythicChance ? ['mythics', 'rares'] : ['rares', 'mythics']
    )
    const rareCard = premiumRare ?? fallbackRare

    addCard(rareCard, {
      rarity: rareCard?.rarity ?? 'rare',
      isFoil: true,
      isSpecialTreatment: Boolean(premiumRare),
    })
  }

  for (let i = 0; i < 3; i += 1) {
    const premiumCard = pickCollectorPremiumCard(premiumPool, fillerPool, premiumBags)
    addCard(premiumCard, {
      rarity: premiumCard?.rarity ?? 'rare',
      isFoil: true,
      isSpecialTreatment: true,
    })
  }

  for (let i = 0; i < 3; i += 1) {
    const uncommonCard = takeRandomFromBag(fillerBags, ['uncommons'], ['commons', 'rares'])
    addCard(uncommonCard, {
      rarity: uncommonCard?.rarity ?? 'uncommon',
      isFoil: true,
    })
  }

  const landCard = takeRandomFromBag(fillerBags, ['lands'], ['commons'])
  if (landCard) {
    addCard(landCard, {
      rarity: landCard.type_line?.includes('Land') ? 'land' : landCard.rarity ?? 'common',
      isFoil: true,
    })
  }

  while (pack.length < rates.totalCards - 1) {
    const fillerCard = takeRandomFromBag(fillerBags, ['commons', 'uncommons'], ['rares', 'mythics', 'lands'])
    if (!fillerCard) break

    addCard(fillerCard, {
      rarity: fillerCard.type_line?.includes('Land') ? 'land' : fillerCard.rarity ?? 'common',
      isFoil: true,
    })
  }

  const displayCard = pickCollectorPremiumCard(premiumPool, fillerPool, premiumBags)
  if (displayCard) {
    addCard(displayCard, {
      rarity: displayCard.rarity ?? 'rare',
      isFoil: Math.random() < 0.8,
      isSpecialTreatment: true,
    })
  }

  while (pack.length < rates.totalCards) {
    const fallbackCard = pickFoilWeighted(getAllNonLandCards(fillerPool), fillerPool.lands)
    if (!fallbackCard) break

    addCard(fallbackCard, {
      rarity: fallbackCard.type_line?.includes('Land') ? 'land' : fallbackCard.rarity ?? 'common',
      isFoil: true,
    })
  }

  return pack.slice(0, rates.totalCards)
}

function simulatePack(pool, packType) {
  const normalizedPackType = normalizePackType(packType)
  const rates = PULL_RATES[normalizedPackType] ?? PULL_RATES.play
  if (normalizedPackType === 'collector') return buildCollectorBooster(pool, rates)
  if (normalizedPackType === 'play') return buildPlayBooster(pool, rates)

  const pack = []
  const addCard = (card, extra = {}) => {
    const nextCard = cloneWithMeta(card, extra)
    if (nextCard) pack.push(nextCard)
  }

  const guaranteedRare = pickRareOrMythic(pool, rates.mythicChance, { allowFallback: true })
  if (guaranteedRare) {
    addCard(guaranteedRare, {
      rarity: guaranteedRare.rarity ?? 'rare',
      isFoil: false,
    })
  }

  for (let i = 0; i < rates.uncommonSlots; i += 1) {
    addCard(pool.uncommons.length > 0 ? pick(pool.uncommons) : pickPlayCommonLike(pool), {
      rarity: pool.uncommons.length > 0 ? 'uncommon' : 'common',
      isFoil: false,
    })
  }

  for (let i = 0; i < rates.commonSlots; i += 1) {
    addCard(pool.commons.length > 0 ? pick(pool.commons) : pickPlayCommonLike(pool), {
      rarity: 'common',
      isFoil: false,
    })
  }

  const landCard = (pool.lands?.length ?? 0) > 0 ? pick(pool.lands) : null
  if (landCard) {
    addCard(landCard, {
      rarity: 'land',
      isFoil: false,
    })
  }

  if (Math.random() < rates.foilChance) {
    const foilIndex = pack.findIndex((card) => card.rarity !== 'land')
    if (foilIndex >= 0) {
      pack[foilIndex] = {
        ...pack[foilIndex],
        isFoil: true,
      }
    }
  }

  return pack.slice(0, rates.totalCards)
}

export function usePackSim() {
  const [sets, setSets] = useState([])
  const [setsLoading, setSetsLoading] = useState(true)
  const [setsError, setSetsError] = useState(null)
  const [poolLoading, setPoolLoading] = useState(false)
  const [poolError, setPoolError] = useState(null)
  const [currentPack, setCurrentPack] = useState(null)

  const poolRef = useRef(null)
  const loadedSetRef = useRef(null)

  useEffect(() => {
    async function loadSets() {
      const cacheKey = 'vault:scryfall:sets'
      const cached = readCache(cacheKey, SET_CACHE_TTL)
      if (cached && cached.every(set => typeof set.setType === 'string')) {
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
            setType: s.set_type,
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

  const selectSet = useCallback(async (code) => {
    if (!code) {
      poolRef.current = null
      loadedSetRef.current = null
      setCurrentPack(null)
      return
    }

    if (loadedSetRef.current === code) return

    setPoolLoading(true)
    setPoolError(null)
    poolRef.current = null
    loadedSetRef.current = code

    try {
      const regularPool = await fetchSetPool(code)
      const [collectorPool, prices] = await Promise.all([
        fetchCollectorPool(code, regularPool),
        fetchSetPrices(code),
      ])

      poolRef.current = {
        regular: mergePricesIntoPool(regularPool, prices),
        collector: mergeCollectorPools(
          mergePricesIntoPool(collectorPool, prices),
          mergePricesIntoPool(regularPool, prices)
        ),
      }
    } catch (err) {
      setPoolError(err.message)
      loadedSetRef.current = null
    } finally {
      setPoolLoading(false)
    }
  }, [])

  const openPack = useCallback((packType = 'play') => {
    if (!poolRef.current) return null
    const normalizedPackType = normalizePackType(packType)
    const pool = normalizedPackType === 'collector' ? poolRef.current.collector : poolRef.current.regular
    if (!pool) return null

    const pack = simulatePack(pool, normalizedPackType)
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
    getBoosterTypesForSet,
  }
}
