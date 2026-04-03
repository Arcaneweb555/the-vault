/**
 * Pull rate constants for MTG booster pack simulation.
 * Based on official Play Booster rates (2024+, post-ONE redesign).
 *
 * Sources:
 *   - Wizards of the Coast Play Booster FAQ
 *   - Community analysis: ~1 mythic per 7.4 packs, ~1 foil per 3 packs
 */

/** @type {{ [packType: string]: Object }} */
export const PULL_RATES = {
  play: {
    totalCards: 14,
    rareSlots: 1,       // 1 rare/mythic slot
    uncommonSlots: 3,   // 3 uncommon slots
    commonSlots: 6,     // 6 common slots
    wildcardSlots: 1,   // 1 wildcard (any rarity, foil check applies here)
    landSlots: 1,       // 1 basic land slot
    bonusSlots: 2,      // 2 extra commons to reach 14 total
    mythicChance: 0.135,  // ~13.5% — 1 in 7.4 packs
    foilChance: 0.33,     // ~33% — wildcard slot foil odds
  },
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
