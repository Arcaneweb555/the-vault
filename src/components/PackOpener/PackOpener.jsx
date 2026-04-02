import './PackOpener.css'

export default function PackOpener() {
  return (
    <div className="pack-opener-page">
      <div className="pack-hud-bar">
        <span className="hud-label">PACK SIMULATOR</span>
        <span className="hud-sep">/</span>
        <span className="hud-value">MTG // PLAY BOOSTER</span>
      </div>

      <div className="pack-coming-soon">
        <div className="pack-icon">◈</div>
        <div className="pack-title">PACK SIMULATOR</div>
        <div className="pack-sub">Coming in next build — realistic pull rates, rarity animations, session tracking.</div>
        <div className="pack-stats-preview">
          <div className="stat-block">
            <div className="stat-value">~13.5%</div>
            <div className="stat-label">MYTHIC RATE</div>
          </div>
          <div className="stat-block">
            <div className="stat-value">~33%</div>
            <div className="stat-label">FOIL RATE</div>
          </div>
          <div className="stat-block">
            <div className="stat-value">14</div>
            <div className="stat-label">CARDS / PACK</div>
          </div>
        </div>
      </div>
    </div>
  )
}