import { useEffect, useMemo, useState } from 'react'
import { usePackSim } from '../../hooks/usePackSim'
import DeckImporter from '../DeckImporter/DeckImporter'
import { useDeckStore } from '../../stores/deckStore'
import { usePackStore } from '../../stores/packStore'
import { normalisePulledCardForDeck, resolveCardImageUrl } from '../../utils/cardData'
import { PULL_RATES, RARITY_CONFIG } from '../../utils/pullRates'
import './PackOpener.css'

const REVEAL_STAGGER_MS = 100
const REVEAL_DURATION_MS = 450
const IMAGE_CACHE_STORAGE_KEY = 'packOpenerImageCache'

function formatPrice(value) {
  return Number.isFinite(value) ? `$${value.toFixed(2)}` : '—'
}

function getCardPrice(card) {
  const rawPrice = card?.isFoil ? card?.prices?.usd_foil : card?.prices?.usd
  const parsed = Number.parseFloat(rawPrice ?? '')
  return Number.isFinite(parsed) ? parsed : null
}

function getBoosterMeta(packType) {
  return PULL_RATES[packType] ?? PULL_RATES.play
}

function getExpectedFoilRate(packType) {
  if (packType === 'collector') return '100%'
  if (packType === 'draft') return '20%'
  return '33%'
}

function formatDelta(value) {
  if (!Number.isFinite(value)) return '—'
  const sign = value >= 0 ? '+' : '-'
  return `${sign}$${Math.abs(value).toFixed(2)}`
}

function getStoredImageCache() {
  if (typeof window === 'undefined') return {}

  try {
    const stored = window.localStorage.getItem(IMAGE_CACHE_STORAGE_KEY)
    if (!stored) return {}

    const parsed = JSON.parse(stored)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export default function PackOpener() {
  const { sets, setsLoading, setsError, poolLoading, poolError, currentPack, selectSet, openPack, getBoosterTypesForSet } = usePackSim()
  const {
    selectedSet,
    setSelectedSet,
    packType,
    setPackType,
    packsOpened,
    mythicsHit,
    raresHit,
    foilsHit,
    history,
    recordPack,
    resetStats,
  } = usePackStore()
  const decks = useDeckStore(state => state.decks)
  const selectDeck = useDeckStore(state => state.selectDeck)
  const addCardToDeck = useDeckStore(state => state.addCardToDeck)
  const [revealedCount, setRevealedCount] = useState(0)
  const [imageCache, setImageCache] = useState(() => getStoredImageCache())
  const [loadedImages, setLoadedImages] = useState({})
  const [menuCardId, setMenuCardId] = useState(null)
  const [isDeckCreatorOpen, setIsDeckCreatorOpen] = useState(false)
  const [pendingNewDeckCard, setPendingNewDeckCard] = useState(null)

  useEffect(() => {
    if (!selectedSet?.code) return

    const availableTypes = getBoosterTypesForSet(selectedSet)
    if (!availableTypes.includes(packType)) {
      setPackType(availableTypes[0] ?? 'play')
    }

    selectSet(selectedSet.code)
  }, [getBoosterTypesForSet, packType, selectSet, selectedSet, setPackType])

  useEffect(() => {
    if (!currentPack?.length) return

    const timers = currentPack.map((_, index) => window.setTimeout(() => {
      setRevealedCount(index + 1)
    }, index * REVEAL_STAGGER_MS + REVEAL_DURATION_MS))

    return () => timers.forEach(timer => window.clearTimeout(timer))
  }, [currentPack, packsOpened])

  const availableBoosterTypes = useMemo(
    () => getBoosterTypesForSet(selectedSet),
    [getBoosterTypesForSet, selectedSet]
  )

  const boosterMeta = getBoosterMeta(packType)
  const revealedCards = currentPack?.slice(0, revealedCount) ?? []
  const currentPackValue = revealedCards.reduce((sum, card) => sum + (getCardPrice(card) ?? 0), 0)
  const mostValuableCard = useMemo(() => {
    if (!currentPack?.length) return null

    return currentPack.reduce((best, card) => {
      const bestPrice = getCardPrice(best)
      const cardPrice = getCardPrice(card)
      if (cardPrice === null) return best
      if (bestPrice === null || cardPrice > bestPrice) return card
      return best
    }, currentPack[0])
  }, [currentPack])

  const latestHistoryEntry = history[0] && !Array.isArray(history[0]) ? history[0] : null
  const comparableHistory = history
    .filter((entry, index) => !Array.isArray(entry) && index > 0)
    .filter(entry => entry.setCode === selectedSet?.code && entry.packType === packType)
  const averageComparableValue = comparableHistory.length > 0
    ? comparableHistory.reduce((sum, entry) => sum + (entry.totalValue ?? 0), 0) / comparableHistory.length
    : null
  const comparisonDelta = averageComparableValue !== null && latestHistoryEntry
    ? (latestHistoryEntry.totalValue ?? 0) - averageComparableValue
    : null

  const handleSetChange = async (e) => {
    const code = e.target.value
    const setObj = sets.find(set => set.code === code) ?? null
    const nextBoosterTypes = getBoosterTypesForSet(setObj)
    setSelectedSet(setObj)
    setPackType(nextBoosterTypes[0] ?? 'play')
    await selectSet(code)
  }

  const handleOpenPack = () => {
    setRevealedCount(0)
    setLoadedImages({})
    setMenuCardId(null)
    const pack = openPack(packType)
    if (pack) {
      recordPack(pack, selectedSet, packType)
      setImageCache((prevCache) => {
        let hasChanges = false
        const nextCache = { ...prevCache }

        pack.forEach((card) => {
          if (!card?.scryfallId || nextCache[card.scryfallId]) return

          const imageUrl = resolveCardImageUrl(card)
          if (!imageUrl) return

          nextCache[card.scryfallId] = imageUrl
          hasChanges = true
        })

        if (!hasChanges) return prevCache

        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(IMAGE_CACHE_STORAGE_KEY, JSON.stringify(nextCache))
          } catch {
            // Ignore localStorage write failures and continue with the in-memory cache.
          }
        }

        return nextCache
      })
    }
  }

  const handleAddToDeck = (deckId, card) => {
    if (!deckId || !card?.name) return
    addCardToDeck(deckId, normalisePulledCardForDeck(card))
    selectDeck(deckId)
    setMenuCardId(null)
  }

  const handleCreateDeckStart = (card) => {
    setPendingNewDeckCard(card)
    setIsDeckCreatorOpen(true)
    setMenuCardId(null)
  }

  const handleCreateDeckSuccess = (deck) => {
    if (!deck) return

    selectDeck(deck.id)

    if (pendingNewDeckCard?.name) {
      addCardToDeck(deck.id, normalisePulledCardForDeck(pendingNewDeckCard))
    }

    setPendingNewDeckCard(null)
    setIsDeckCreatorOpen(false)
  }

  const handleCreateDeckClose = () => {
    setPendingNewDeckCard(null)
    setIsDeckCreatorOpen(false)
  }

  const canOpen = !!selectedSet && !!packType && !poolLoading && !setsLoading
  const mythicRate = packsOpened > 0 ? ((mythicsHit / packsOpened) * 100).toFixed(1) : null
  const foilRate = packsOpened > 0 ? ((foilsHit / packsOpened) * 100).toFixed(1) : null

  return (
    <div className="pack-opener-page">
      <div className="pack-hud-bar">
        <div className="hud-left">
          <span className="hud-label">PACK RIPPER</span>
          <span className="hud-sep">/</span>
          <span className="hud-value">
            SET: <span className="hud-bright">{selectedSet ? selectedSet.name.toUpperCase() : 'NONE'}</span>
          </span>
          <span className="hud-sep">/</span>
          <span className="hud-value">{boosterMeta.label.toUpperCase()}</span>
          <span className="hud-sep">/</span>
          <span className="hud-value">PACKS: <span className="hud-bright">{packsOpened}</span></span>
          <span className="hud-sep">/</span>
          <span className="hud-value">PACK VALUE: <span className="hud-bright gold">{formatPrice(currentPackValue)}</span></span>
        </div>
        <div className="hud-right">
          <div className="hud-tag">MTG</div>
          <div className="hud-tag">{boosterMeta.totalCards} CARDS</div>
          <div className="hud-ping">
            <span className="ping-dot" />
            <span>LIVE</span>
          </div>
        </div>
      </div>

      <div className="pack-controls">
        <div className="set-selector-wrap">
          <div className="set-label">SELECT SET</div>
          {setsLoading ? (
            <div className="sets-loading">
              <span className="loading-spinner" />
              FETCHING SET LIST...
            </div>
          ) : setsError ? (
            <div className="sets-error">SCRYFALL UNAVAILABLE - {setsError}</div>
          ) : (
            <select
              className="set-select"
              value={selectedSet?.code ?? ''}
              onChange={handleSetChange}
            >
              <option value="">- CHOOSE A SET -</option>
              {sets.map(set => (
                <option key={set.code} value={set.code}>
                  {set.name} [{set.code.toUpperCase()}] {set.releasedAt.slice(0, 4)}
                </option>
              ))}
            </select>
          )}

          {selectedSet && availableBoosterTypes.length > 0 && (
            <div className="booster-selector">
              <div className="set-label">BOOSTER TYPE</div>
              <div className="booster-toggle-grid">
                {availableBoosterTypes.map(type => {
                  const option = getBoosterMeta(type)
                  return (
                    <button
                      key={type}
                      type="button"
                      className={`booster-toggle${packType === type ? ' active' : ''}`}
                      onClick={() => setPackType(type)}
                    >
                      <span className="booster-toggle-title">{option.label}</span>
                      <span className="booster-toggle-desc">{option.description}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="pack-actions">
          {poolLoading && (
            <div className="pool-loading-bar">
              <span className="loading-spinner" />
              <span>LOADING CARD POOL</span>
            </div>
          )}
          {poolError && (
            <div className="pool-error">{poolError}</div>
          )}
          <button
            className="open-pack-btn"
            onClick={handleOpenPack}
            disabled={!canOpen}
          >
            <span className="open-pack-icon">◆</span>
            <span className="open-pack-label">
              {poolLoading ? 'LOADING...' : 'OPEN PACK'}
            </span>
          </button>
          {packsOpened > 0 && (
            <button className="reset-btn" onClick={resetStats} title="Reset session stats">
              RESET
            </button>
          )}
        </div>
      </div>

      {!currentPack && !poolLoading && (
        <div className="pack-empty-state">
          <div className="pack-empty-icon">◆</div>
          <div className="pack-empty-title">PACK RIPPER</div>
          <div className="pack-empty-sub">
            {selectedSet
              ? `${selectedSet.name} loaded - press OPEN PACK to begin`
              : 'Select a set above, then open your first pack'}
          </div>
          {!selectedSet && (
            <div className="pack-stats-preview">
              <div className="stat-block">
                <div className="stat-value" style={{ color: 'var(--gold)' }}>~13.5%</div>
                <div className="stat-label">MYTHIC RATE</div>
              </div>
              <div className="stat-block">
                <div className="stat-value" style={{ color: 'var(--cyan)' }}>~33%</div>
                <div className="stat-label">FOIL RATE</div>
              </div>
              <div className="stat-block">
                <div className="stat-value" style={{ color: 'var(--purple)' }}>{boosterMeta.totalCards}</div>
                <div className="stat-label">CARDS / PACK</div>
              </div>
            </div>
          )}
        </div>
      )}

      {currentPack && (
        <div className="card-reveal-area">
          <div className="reveal-hud">
            <span className="reveal-label">PACK #{packsOpened} CONTENTS</span>
            <span className="reveal-count">{currentPack.length} CARDS</span>
            <span className="reveal-hits">
              {currentPack.some(card => card.rarity === 'mythic') && (
                <span className="hit-badge mythic-hit">MYTHIC</span>
              )}
              {currentPack.some(card => card.isFoil) && (
                <span className="hit-badge foil-hit">FOIL</span>
              )}
            </span>
          </div>

          <div key={packsOpened} className="pack-cards-grid">
            {currentPack.map((card, index) => {
              const rarityConfig = RARITY_CONFIG[card.rarity] ?? RARITY_CONFIG.common
              const cardPrice = getCardPrice(card)
              const imageUrl = resolveCardImageUrl(card) || imageCache[card.scryfallId] || null
              const isImageLoaded = !!(imageUrl && loadedImages[card.scryfallId] === imageUrl)
              const isMenuOpen = menuCardId === `${card.scryfallId}-${index}`

              return (
                <div key={`${card.scryfallId}-${index}`} className="pack-card-stack">
                  <div
                    className={`pack-card rarity-${card.rarity}${card.isFoil ? ' foil' : ''}`}
                    style={{ '--card-index': index, '--rarity-colour': rarityConfig.colour, '--rarity-glow': rarityConfig.glow }}
                  >
                    <div className="pack-card-image-wrap">
                      {imageUrl ? (
                        <>
                          {!isImageLoaded && (
                            <div className="card-art-placeholder" aria-hidden="true">
                              <span className="card-art-placeholder-icon">❖</span>
                            </div>
                          )}
                          <img
                            className={`card-art-image${isImageLoaded ? ' loaded' : ''}`}
                            src={imageUrl}
                            alt={card.name}
                            loading="lazy"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
                            onLoad={() => {
                              setLoadedImages(prev => ({ ...prev, [card.scryfallId]: imageUrl }))
                            }}
                          />
                        </>
                      ) : (
                        <div className="card-art-placeholder">
                          <span className="card-art-placeholder-icon">❖</span>
                        </div>
                      )}

                      {card.isFoil && <div className="foil-shimmer" />}

                      <div className="card-face-overlay">
                        <div className="card-footer">
                          <div className="card-rarity-badge">{rarityConfig.label}</div>
                          <div className="card-price-tag">{formatPrice(cardPrice)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="add-to-deck-menu-wrap">
                    <button
                      type="button"
                      className="add-to-deck-btn"
                      onClick={() => setMenuCardId(isMenuOpen ? null : `${card.scryfallId}-${index}`)}
                      disabled={!card?.name}
                      title={card?.name ? 'Add this card to a deck' : 'No valid card selected'}
                    >
                      ADD TO DECK
                    </button>

                    {isMenuOpen && (
                      <div className="add-to-deck-menu">
                        {decks.map((deck) => (
                          <button
                            key={deck.id}
                            type="button"
                            className="add-to-deck-menu-item"
                            onClick={() => handleAddToDeck(deck.id, card)}
                          >
                            <span>{deck.name}</span>
                            <span className="add-to-deck-menu-meta">{deck.cardCount}</span>
                          </button>
                        ))}
                        <button
                          type="button"
                          className="add-to-deck-menu-item add-to-deck-menu-item-new"
                          onClick={() => handleCreateDeckStart(card)}
                        >
                          + New Deck
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {revealedCount >= currentPack.length && (
            <div className="pack-summary">
              <div className="pack-summary-block">
                <div className="pack-summary-label">TOTAL PACK VALUE</div>
                <div className="pack-summary-value">{formatPrice(latestHistoryEntry?.totalValue ?? currentPackValue)}</div>
              </div>
              <div className="pack-summary-block">
                <div className="pack-summary-label">MOST VALUABLE CARD</div>
                <div className="pack-summary-value small">
                  {mostValuableCard ? `${mostValuableCard.name} (${formatPrice(getCardPrice(mostValuableCard))})` : '—'}
                </div>
              </div>
              <div className="pack-summary-block">
                <div className="pack-summary-label">VS SESSION AVERAGE</div>
                <div className="pack-summary-value small">
                  {averageComparableValue === null
                    ? 'No comparable packs yet'
                    : `${formatDelta(comparisonDelta)} vs ${formatPrice(averageComparableValue)} avg`}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="pack-stats-panel">
        <div className="stats-col featured">
          <div className="stat-value">{packsOpened}</div>
          <div className="stat-label">PACKS OPENED</div>
        </div>

        <div className="stats-divider" />

        <div className="stats-col">
          <div className="stat-value" style={{ color: RARITY_CONFIG.mythic.colour }}>
            {mythicRate !== null ? `${mythicRate}%` : '—'}
          </div>
          <div className="stat-label">MYTHIC RATE</div>
          <div className="stat-expected">EXP {Math.round(boosterMeta.mythicChance * 1000) / 10}%</div>
        </div>

        <div className="stats-col">
          <div className="stat-value" style={{ color: 'var(--cyan)' }}>
            {foilRate !== null ? `${foilRate}%` : '—'}
          </div>
          <div className="stat-label">FOIL RATE</div>
          <div className="stat-expected">EXP {getExpectedFoilRate(packType)}</div>
        </div>

        <div className="stats-divider" />

        <div className="stats-col">
          <div className="stat-value" style={{ color: RARITY_CONFIG.mythic.colour }}>{mythicsHit}</div>
          <div className="stat-label">MYTHICS</div>
        </div>

        <div className="stats-col">
          <div className="stat-value" style={{ color: RARITY_CONFIG.rare.colour }}>{raresHit}</div>
          <div className="stat-label">RARES</div>
        </div>

        <div className="stats-col">
          <div className="stat-value">{foilsHit}</div>
          <div className="stat-label">FOILS</div>
        </div>
      </div>

      {history.length > 0 && (
        <div className="pack-history">
          <div className="history-hud">
            <span className="hud-label">PACK HISTORY</span>
            <span className="hud-sep">/</span>
            <span className="hud-value">LAST {history.length} PACKS</span>
          </div>

          <div className="history-list">
            {history.map((entry, index) => {
              const packNumber = packsOpened - index
              const cards = Array.isArray(entry) ? entry : entry.cards
              const hits = cards.filter(card => ['rare', 'mythic'].includes(card.rarity))
              const foils = cards.filter(card => card.isFoil)
              const entryValue = Array.isArray(entry)
                ? cards.reduce((sum, card) => sum + (getCardPrice(card) ?? 0), 0)
                : entry.totalValue

              return (
                <div key={index} className="history-entry">
                  <span className="history-num">#{packNumber}</span>
                  <div className="history-meta">
                    {!Array.isArray(entry) && (
                      <span className="history-pack-type">{getBoosterMeta(entry.packType).label}</span>
                    )}
                    <span className="history-pack-value">{formatPrice(entryValue)}</span>
                  </div>
                  <div className="history-cards">
                    {hits.map((card, hitIndex) => {
                      const rarityConfig = RARITY_CONFIG[card.rarity]
                      const isFoilHit = foils.some(foilCard => foilCard.name === card.name)
                      return (
                        <span key={`${card.scryfallId}-${hitIndex}`} className="history-card" style={{ color: rarityConfig.colour }}>
                          {isFoilHit && '✦ '}{card.name}
                        </span>
                      )
                    })}
                    {foils
                      .filter(foilCard => !hits.find(hit => hit.name === foilCard.name))
                      .map((card, foilIndex) => (
                        <span key={`foil-${card.scryfallId}-${foilIndex}`} className="history-card" style={{ color: 'var(--cyan)' }}>
                          ✦ {card.name}
                        </span>
                      ))}
                    {hits.length === 0 && foils.length === 0 && (
                      <span className="history-blank">No notable hits</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <DeckImporter
        isOpen={isDeckCreatorOpen}
        onClose={handleCreateDeckClose}
        onImportSuccess={handleCreateDeckSuccess}
        mode="create"
        title="NEW DECK"
        kicker="PACK RIPPER"
        submitLabel="CREATE DECK"
      />
    </div>
  )
}
