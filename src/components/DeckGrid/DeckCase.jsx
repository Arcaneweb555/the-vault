import { MANA_CONFIG, getColourBacklight } from '../../utils/manaConfig'
import './DeckGrid.css'

export default function DeckCase({ deck, index, isSelected, onClick }) {
  const colours = deck.colours.map(c => MANA_CONFIG[c]).filter(Boolean)
  const backlight = getColourBacklight(deck.colours)
  const primaryColour = colours[0]?.hex || '#00d4ff'

  return (
    <button
      className={`deck-case ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{
        '--backlight': backlight,
        '--primary-colour': primaryColour,
        animationDelay: `${index * 80}ms`
      }}
      aria-label={`${deck.name} — ${deck.theme}`}
    >
      <div className="case-body">
        <div className="case-backlight" />
        <div className="case-edge case-edge-top" />
        <div className="case-edge case-edge-bottom" />
        <div className="case-edge case-edge-left" />
        <div className="case-edge case-edge-right" />

        <div className="case-interior">
          <div className="card-stack">
            <div className="card-shadow card-s3" />
            <div className="card-shadow card-s2" />
            <div className="card-shadow card-s1" />
            <div className="card-front">
              <div className="card-front-pattern" />
              <div className="card-front-icon">❖</div>
            </div>
          </div>
          <div className="case-mist" />
        </div>

        <div className="case-reflection" />
      </div>

      <div className="case-info">
        <div className="case-colours">
          {colours.map(c => (
            <span
              key={c.symbol}
              className="mana-pip"
              style={{ '--pip-colour': c.hex }}
              title={c.name}
            />
          ))}
        </div>
        <div className="case-name">{deck.name}</div>
        <div className="case-sub">{deck.theme}</div>
      </div>

      {isSelected && <div className="case-select-ring" />}
    </button>
  )
}