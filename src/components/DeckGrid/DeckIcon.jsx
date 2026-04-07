import { ICON_PATHS, COLOUR_TO_ICON } from '../../utils/deckIcons'
import { MANA_CONFIG } from '../../utils/manaConfig'

export default function DeckIcon({ colours = [] }) {
  if (!colours || colours.length === 0) return null

  // Get icon types for each colour
  const iconTypes = colours.map(c => COLOUR_TO_ICON[c]).filter(Boolean)
  if (iconTypes.length === 0) return null

  // For now, use the first icon (we'll replace single/split rendering logic)
  const iconType = iconTypes[0]
  const iconDef = ICON_PATHS[iconType]
  if (!iconDef) return null

  // Convert colour codes to hex
  const colourHexes = colours
    .map(c => MANA_CONFIG[c]?.hex)
    .filter(Boolean)

  const isPrimaryOnly = colourHexes.length <= 1
  const primaryColour = colourHexes[0] || '#00d4ff'
  const secondaryColour = colourHexes[1] || null

  // For filled icons with glow effect
  return (
    <svg
      viewBox={iconDef.viewBox}
      className="deck-icon"
      style={{
        '--icon-primary': primaryColour,
        '--icon-secondary': secondaryColour || primaryColour,
        '--icon-fill': iconDef.fill ? 'currentColor' : 'none'
      }}
    >
      {isPrimaryOnly ? (
        // Single color - solid fill
        <path
          d={iconDef.path}
          fill={iconDef.fill ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={iconDef.fill ? '0' : '1.2'}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="icon-path primary"
          style={{ color: primaryColour }}
        />
      ) : (
        // Multi-color split - left and right halves
        <>
          <defs>
            <clipPath id={`leftHalf-${iconType}`}>
              <rect
                x="0"
                y="0"
                width={parseInt(iconDef.viewBox.split(' ')[2]) / 2}
                height={parseInt(iconDef.viewBox.split(' ')[3])}
              />
            </clipPath>
            <clipPath id={`rightHalf-${iconType}`}>
              <rect
                x={parseInt(iconDef.viewBox.split(' ')[2]) / 2}
                y="0"
                width={parseInt(iconDef.viewBox.split(' ')[2]) / 2}
                height={parseInt(iconDef.viewBox.split(' ')[3])}
              />
            </clipPath>
          </defs>

          {/* Left half with primary color */}
          <path
            d={iconDef.path}
            fill={iconDef.fill ? 'var(--icon-primary)' : 'none'}
            stroke="var(--icon-primary)"
            strokeWidth={iconDef.fill ? '0' : '1.2'}
            strokeLinecap="round"
            strokeLinejoin="round"
            clipPath={`url(#leftHalf-${iconType})`}
            className="icon-path primary"
          />

          {/* Right half with secondary color */}
          <path
            d={iconDef.path}
            fill={iconDef.fill ? 'var(--icon-secondary)' : 'none'}
            stroke="var(--icon-secondary)"
            strokeWidth={iconDef.fill ? '0' : '1.2'}
            strokeLinecap="round"
            strokeLinejoin="round"
            clipPath={`url(#rightHalf-${iconType})`}
            className="icon-path secondary"
          />

          {/* Subtle outline to define edges of split */}
          <path
            d={iconDef.path}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.4"
          />
        </>
      )}
    </svg>
  )
}
