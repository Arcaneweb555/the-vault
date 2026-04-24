import wSymbol from '../assets/mtgsymbols/W.png'
import uSymbol from '../assets/mtgsymbols/U.png'
import bSymbol from '../assets/mtgsymbols/B.png'
import rSymbol from '../assets/mtgsymbols/R.png'
import gSymbol from '../assets/mtgsymbols/G.png'
import cSymbol from '../assets/mtgsymbols/C.png'
import wuSymbol from '../assets/mtgsymbols/WU.png'
import wbSymbol from '../assets/mtgsymbols/WB.png'
import ubSymbol from '../assets/mtgsymbols/UB.png'
import urSymbol from '../assets/mtgsymbols/UR.png'
import brSymbol from '../assets/mtgsymbols/BR.png'
import bgSymbol from '../assets/mtgsymbols/BG.png'
import rwSymbol from '../assets/mtgsymbols/RW.png'
import rgSymbol from '../assets/mtgsymbols/RG.png'
import gwSymbol from '../assets/mtgsymbols/GW.png'
import gbSymbol from '../assets/mtgsymbols/GB.png'
import { MANA_CONFIG } from './manaConfig'

const COLOUR_ORDER = ['W', 'U', 'B', 'R', 'G', 'C']
const BASIC_LAND_TO_COLOUR = {
  Plains: 'W',
  'Snow-Covered Plains': 'W',
  Island: 'U',
  'Snow-Covered Island': 'U',
  Swamp: 'B',
  'Snow-Covered Swamp': 'B',
  Mountain: 'R',
  'Snow-Covered Mountain': 'R',
  Forest: 'G',
  'Snow-Covered Forest': 'G',
  Wastes: 'C',
  'Snow-Covered Wastes': 'C',
}

export const SYMBOL_ASSETS = {
  W: wSymbol,
  U: uSymbol,
  B: bSymbol,
  R: rSymbol,
  G: gSymbol,
  C: cSymbol,
  WU: wuSymbol,
  WB: wbSymbol,
  UB: ubSymbol,
  UR: urSymbol,
  BR: brSymbol,
  BG: bgSymbol,
  RW: rwSymbol,
  RG: rgSymbol,
  GW: gwSymbol,
  GB: gbSymbol,
}

function canonicalizePair(first, second) {
  if (SYMBOL_ASSETS[`${first}${second}`]) {
    return `${first}${second}`
  }

  if (SYMBOL_ASSETS[`${second}${first}`]) {
    return `${second}${first}`
  }

  return `${first}${second}`
}

function getCardColours(card) {
  const basicLandColour = BASIC_LAND_TO_COLOUR[card.name]
  if (basicLandColour) {
    return [basicLandColour]
  }

  if (Array.isArray(card.color_identity) && card.color_identity.length > 0) {
    return card.color_identity
  }

  return []
}

function getDeckColourWeights(deck) {
  const weights = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 }

  for (const card of deck.cards ?? []) {
    const colours = getCardColours(card)
    if (colours.length === 0) {
      continue
    }

    for (const colour of colours) {
      if (weights[colour] != null) {
        weights[colour] += card.quantity ?? 0
      }
    }
  }

  return weights
}

function sortColoursByWeight(weights) {
  return Object.entries(weights)
    .filter(([, count]) => count > 0)
    .sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1]
      }

      return COLOUR_ORDER.indexOf(a[0]) - COLOUR_ORDER.indexOf(b[0])
    })
    .map(([colour]) => colour)
}

export function getDeckSymbolCode(deck) {
  const weightedColours = sortColoursByWeight(getDeckColourWeights(deck))
  const weightedManaColours = weightedColours.filter((colour) => colour !== 'C')

  if (weightedManaColours.length === 0) {
    if (deck.iconSymbol && SYMBOL_ASSETS[deck.iconSymbol]) {
      return deck.iconSymbol
    }

    if (weightedColours.includes('C')) {
      return 'C'
    }

    if (Array.isArray(deck.colours) && deck.colours.length >= 2) {
      return canonicalizePair(deck.colours[0], deck.colours[1])
    }

    if (Array.isArray(deck.colours) && deck.colours.length === 1) {
      return deck.colours[0]
    }

    return 'C'
  }

  if (weightedManaColours.length === 1) {
    return weightedManaColours[0]
  }

  return canonicalizePair(weightedManaColours[0], weightedManaColours[1])
}

export function getDeckSymbolAsset(deck) {
  return SYMBOL_ASSETS[getDeckSymbolCode(deck)] ?? SYMBOL_ASSETS.C
}

export function getDeckSymbolGlow(deck) {
  const symbolCode = getDeckSymbolCode(deck)

  if (symbolCode.length === 1) {
    const colour = MANA_CONFIG[symbolCode]?.hex ?? '#00d4ff'
    return { primary: colour, secondary: colour }
  }

  const [first, second] = symbolCode.split('')
  return {
    primary: MANA_CONFIG[first]?.hex ?? '#00d4ff',
    secondary: MANA_CONFIG[second]?.hex ?? MANA_CONFIG[first]?.hex ?? '#00d4ff',
  }
}
