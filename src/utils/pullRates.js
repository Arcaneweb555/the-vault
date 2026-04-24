/**
 * Pull rate constants for MTG booster pack simulation.
 */

export const PLAY_BOOSTER = {
  key: 'play',
  label: 'Play Booster',
  description: '14 playable cards + token/art slot, with wildcards and foil',
  totalCards: 14,
  rareSlots: 1,
  uncommonSlots: 3,
  commonSlots: 6,
  wildcardSlots: 1,
  landSlots: 1,
  bonusSlots: 2,
  mythicChance: 0.135,
  foilChance: 0.33,
}

export const DRAFT_BOOSTER = {
  key: 'draft',
  label: 'Draft Booster',
  description: '15 cards - classic limited format',
  totalCards: 15,
  rareSlots: 1,
  uncommonSlots: 3,
  commonSlots: 10,
  landSlots: 1,
  mythicChance: 0.125,
  foilChance: 0.2,
}

export const COLLECTOR_BOOSTER = {
  key: 'collector',
  label: 'Collector Booster',
  description: '15 cards - rare-heavy, premium treatments, nearly all foil',
  totalCards: 15,
  rareSlots: 5,
  uncommonSlots: 4,
  commonSlots: 5,
  specialSlots: 1,
  mythicChance: 0.25,
  foilChance: 1,
}

/** @type {{ [packType: string]: Object }} */
export const PULL_RATES = {
  play: PLAY_BOOSTER,
  draft: DRAFT_BOOSTER,
  collector: COLLECTOR_BOOSTER,
}

export const RARITY_CONFIG = {
  mythic: {
    label: 'Mythic Rare',
    colour: '#ff6b00',
    glow: 'rgba(255, 107, 0, 0.5)',
    dim: 'rgba(255, 107, 0, 0.12)',
  },
  rare: {
    label: 'Rare',
    colour: '#ffb800',
    glow: 'rgba(255, 184, 0, 0.4)',
    dim: 'rgba(255, 184, 0, 0.08)',
  },
  uncommon: {
    label: 'Uncommon',
    colour: '#b0c8e8',
    glow: 'rgba(176, 200, 232, 0.3)',
    dim: 'rgba(176, 200, 232, 0.06)',
  },
  common: {
    label: 'Common',
    colour: '#5a7080',
    glow: 'rgba(90, 112, 128, 0.2)',
    dim: 'rgba(90, 112, 128, 0.04)',
  },
  land: {
    label: 'Land',
    colour: '#5a7080',
    glow: 'rgba(90, 112, 128, 0.2)',
    dim: 'rgba(90, 112, 128, 0.04)',
  },
}
