export const MANA_CONFIG = {
  W: { symbol: 'W', name: 'White',      hex: '#f7e47d' },
  U: { symbol: 'U', name: 'Blue',       hex: '#4dc8ff' },
  B: { symbol: 'B', name: 'Black',      hex: '#d46bff' },
  R: { symbol: 'R', name: 'Red',        hex: '#ff6f4e' },
  G: { symbol: 'G', name: 'Green',      hex: '#5fffa8' },
  C: { symbol: 'C', name: 'Colourless', hex: '#94c9ff' },
}

export function getColourBacklight(colours) {
  if (!colours || colours.length === 0) return 'rgba(0, 212, 255, 0.4)'
  if (colours.length >= 4) return 'rgba(255, 184, 0, 0.42)'
  if (colours.length === 1) {
    const c = MANA_CONFIG[colours[0]]
    return c ? hexToRgba(c.hex, 0.4) : 'rgba(0, 212, 255, 0.4)'
  }
  const a = MANA_CONFIG[colours[0]]?.hex || '#00d4ff'
  return hexToRgba(a, 0.35)
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}