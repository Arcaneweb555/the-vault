import { ICON_PATHS } from '../../utils/deckIcons'
import { MANA_CONFIG } from '../../utils/manaConfig'

export default function DeckIcon({ iconType, colours = [] }) {
  const iconDef = ICON_PATHS[iconType]
  if (!iconDef) return null

  // Convert colour codes to hex
  const colourHexes = colours
    .map(c => MANA_CONFIG[c]?.hex)
    .filter(Boolean)

  const isPrimaryOnly = colourHexes.length <= 1
  const primaryColour = colourHexes[0] || '#00d4ff'
  const secondaryColour = colourHexes[1] || null

  return (
    <svg
      viewBox={iconDef.viewBox}
      className="deck-icon"
      style={{
        '--icon-primary': primaryColour,
        '--icon-secondary': secondaryColour || primaryColour
      }}
    >
      {isPrimaryOnly ? (
        // Single color icon
        <path
          d={iconDef.path}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="icon-stroke primary"
        />
      ) : (
        // Split color icon - two halves
        <>
          {/* Split into left and right halves using clipPath */}
          <defs>
            <clipPath id="leftHalf">
              <rect
                x={parseInt(iconDef.viewBox.split(' ')[0])}
                y={parseInt(iconDef.viewBox.split(' ')[1])}
                width={parseInt(iconDef.viewBox.split(' ')[2]) / 2}
                height={parseInt(iconDef.viewBox.split(' ')[3])}
              />
            </clipPath>
            <clipPath id="rightHalf">
              <rect
                x={
                  parseInt(iconDef.viewBox.split(' ')[0]) +
                  parseInt(iconDef.viewBox.split(' ')[2]) / 2
                }
                y={parseInt(iconDef.viewBox.split(' ')[1])}
                width={parseInt(iconDef.viewBox.split(' ')[2]) / 2}
                height={parseInt(iconDef.viewBox.split(' ')[3])}
              />
            </clipPath>
          </defs>

          {/* Left half with primary color */}
          <path
            d={iconDef.path}
            fill="none"
            stroke="var(--icon-primary)"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            clipPath="url(#leftHalf)"
            className="icon-stroke primary"
          />

          {/* Right half with secondary color */}
          <path
            d={iconDef.path}
            fill="none"
            stroke="var(--icon-secondary)"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            clipPath="url(#rightHalf)"
            className="icon-stroke secondary"
          />

          {/* Full outline for definition */}
          <path
            d={iconDef.path}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />
        </>
      )}
    </svg>
  )
}
