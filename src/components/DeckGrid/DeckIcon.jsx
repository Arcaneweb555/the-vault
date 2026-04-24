import { getDeckSymbolAsset, getDeckSymbolCode, getDeckSymbolGlow } from '../../utils/deckIcons'

export default function DeckIcon({ deck }) {
  if (!deck) return null

  const symbolCode = getDeckSymbolCode(deck)
  const symbolAsset = getDeckSymbolAsset(deck)
  const glow = getDeckSymbolGlow(deck)

  return (
    <img
      src={symbolAsset}
      alt={symbolCode}
      className="deck-icon"
      style={{
        '--icon-primary': glow.primary,
        '--icon-secondary': glow.secondary,
      }}
    />
  )
}
