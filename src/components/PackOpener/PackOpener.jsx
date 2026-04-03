import { useEffect } from 'react'
import { usePackSim } from '../../hooks/usePackSim'
import { usePackStore } from '../../stores/packStore'
import { RARITY_CONFIG } from '../../utils/pullRates'
import './PackOpener.css'

export default function PackOpener() {
  const { sets, setsLoading, setsError, poolLoading, poolError, currentPack, selectSet, openPack } = usePackSim()
  const {
    selectedSet, setSelectedSet,
    packsOpened, mythicsHit, raresHit, foilsHit,
    history, recordPack, resetStats,
  } = usePackStore()

  // Restore the previously selected set's card pool on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (selectedSet?.code) selectSet(selectedSet.code) }, [])

  const handleSetChange = async (e) => {
    const code = e.target.value
    const setObj = sets.find(s => s.code === code) ?? null
    setSelectedSet(setObj)
    await selectSet(code)
  }

  const handleOpenPack = () => {
    const pack = openPack()
    if (pack) recordPack(pack)
  }

  const canOpen = !!selectedSet && !poolLoading && !setsLoading
  const mythicRate = packsOpened > 0 ? ((mythicsHit / packsOpened) * 100).toFixed(1) : null
  const foilRate   = packsOpened > 0 ? ((foilsHit   / packsOpened) * 100).toFixed(1) : null

  return (
    <div className="pack-opener-page">

      {/* ── HUD Bar ── */}
      <div className="pack-hud-bar">
        <div className="hud-left">
          <span className="hud-label">PACK RIPPER</span>
          <span className="hud-sep">/</span>
          <span className="hud-value">
            SET: <span className="hud-bright">{selectedSet ? selectedSet.name.toUpperCase() : 'NONE'}</span>
          </span>
          <span className="hud-sep">/</span>
          <span className="hud-value">PLAY BOOSTER</span>
          <span className="hud-sep">/</span>
          <span className="hud-value">PACKS: <span className="hud-bright">{packsOpened}</span></span>
        </div>
        <div className="hud-right">
          <div className="hud-tag">MTG</div>
          <div className="hud-tag">14 CARDS</div>
          <div className="hud-ping">
            <span className="ping-dot" />
            <span>LIVE</span>
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="pack-controls">
        <div className="set-selector-wrap">
          <div className="set-label">SELECT SET</div>
          {setsLoading ? (
            <div className="sets-loading">
              <span className="loading-spinner" />
              FETCHING SET LIST...
            </div>
          ) : setsError ? (
            <div className="sets-error">SCRYFALL UNAVAILABLE — {setsError}</div>
          ) : (
            <select
              className="set-select"
              value={selectedSet?.code ?? ''}
              onChange={handleSetChange}
            >
              <option value="">— CHOOSE A SET —</option>
              {sets.map(s => (
                <option key={s.code} value={s.code}>
                  {s.name}  [{s.code.toUpperCase()}]  {s.releasedAt.slice(0, 4)}
                </option>
              ))}
            </select>
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
            <span className="open-pack-icon">◈</span>
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

      {/* ── Empty prompt before first pack ── */}
      {!currentPack && !poolLoading && (
        <div className="pack-empty-state">
          <div className="pack-empty-icon">◈</div>
          <div className="pack-empty-title">PACK RIPPER</div>
          <div className="pack-empty-sub">
            {selectedSet
              ? `${selectedSet.name} loaded — press OPEN PACK to begin`
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
                <div className="stat-value" style={{ color: 'var(--purple)' }}>14</div>
                <div className="stat-label">CARDS / PACK</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Card Reveal ── */}
      {currentPack && (
        <div className="card-reveal-area">
          <div className="reveal-hud">
            <span className="reveal-label">PACK #{packsOpened} CONTENTS</span>
            <span className="reveal-count">{currentPack.length} CARDS</span>
            <span className="reveal-hits">
              {currentPack.filter(c => c.rarity === 'mythic').length > 0 && (
                <span className="hit-badge mythic-hit">MYTHIC</span>
              )}
              {currentPack.filter(c => c.isFoil).length > 0 && (
                <span className="hit-badge foil-hit">FOIL</span>
              )}
            </span>
          </div>

          {/* key=packsOpened forces remount → retriggers CSS animations on each new pack */}
          <div key={packsOpened} className="pack-cards-grid">
            {currentPack.map((card, i) => {
              const rc = RARITY_CONFIG[card.rarity] ?? RARITY_CONFIG.common
              return (
                <div
                  key={i}
                  className={`pack-card rarity-${card.rarity}${card.isFoil ? ' foil' : ''}`}
                  style={{ '--card-index': i, '--rarity-colour': rc.colour, '--rarity-glow': rc.glow }}
                >
                  {card.isFoil && <div className="foil-shimmer" />}
                  <div className="card-rarity-stripe" />
                  <div className="card-reveal-body">
                    <div className="card-reveal-name">{card.name}</div>
                    <div className="card-reveal-type">
                      {card.type?.split('//')[0]?.split('—')[0]?.trim() ?? ''}
                    </div>
                  </div>
                  <div className="card-rarity-badge">
                    {card.isFoil && <span className="foil-star">✦</span>}
                    {rc.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Stats Panel ── */}
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
          <div className="stat-expected">EXP 13.5%</div>
        </div>

        <div className="stats-col">
          <div className="stat-value" style={{ color: 'var(--cyan)' }}>
            {foilRate !== null ? `${foilRate}%` : '—'}
          </div>
          <div className="stat-label">FOIL RATE</div>
          <div className="stat-expected">EXP 33%</div>
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

      {/* ── Pack History ── */}
      {history.length > 0 && (
        <div className="pack-history">
          <div className="history-hud">
            <span className="hud-label">PACK HISTORY</span>
            <span className="hud-sep">/</span>
            <span className="hud-value">LAST {history.length} PACKS</span>
          </div>

          <div className="history-list">
            {history.map((pack, i) => {
              const packNum = packsOpened - i
              const hits = pack.filter(c => ['rare', 'mythic'].includes(c.rarity))
              const foils = pack.filter(c => c.isFoil)
              return (
                <div key={i} className="history-entry">
                  <span className="history-num">#{packNum}</span>
                  <div className="history-cards">
                    {hits.map((card, j) => {
                      const rc = RARITY_CONFIG[card.rarity]
                      const isFoilHit = foils.some(f => f.name === card.name)
                      return (
                        <span key={j} className="history-card" style={{ color: rc.colour }}>
                          {isFoilHit && '✦ '}{card.name}
                        </span>
                      )
                    })}
                    {/* Foil hits that aren't rare/mythic */}
                    {foils
                      .filter(f => !hits.find(h => h.name === f.name))
                      .map((card, j) => (
                        <span key={`f${j}`} className="history-card" style={{ color: 'var(--cyan)' }}>
                          ✦ {card.name}
                        </span>
                      ))
                    }
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

    </div>
  )
}
