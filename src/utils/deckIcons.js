/**
 * Deck Icon System
 * Maps deck themes to icon types and provides SVG definitions
 */

// Theme to icon type mapping
const THEME_TO_ICON = {
  // Tribal
  'Vampire Tribal': 'fangs',
  'Vampire Control': 'fangs',
  'Zombie Tribal': 'skull',
  'Zombie Mill': 'skull',
  'Elf Tribal': 'leaf',
  'Elf Mana Storm': 'leaf',
  'Elf Tokens': 'leaf',
  'Dragon Tribal': 'dragon',
  'Five-Color Dragons': 'dragon',
  'Dinosaur Tribal': 'claw',
  'Goblin Tribal': 'fireball',
  'Sliver Tribal': 'shard',
  'Merfolk Tribal': 'wave',
  'Ninja Tribal': 'star',
  'Cat Tribal': 'paw',
  'Defender Tribal': 'shield',
  'Hydra Tribal': 'snake',
  
  // Sacrifice/Aristocrats
  'Aristocrats': 'crown',
  'Aristocrats Drain': 'crown',
  'Sacrifice Engine': 'flame',
  'Sacrifice Combo': 'flame',
  'Sacrifice Counters': 'flame',
  'Sacrifice Fling': 'flame',
  'Golgari Sacrifice': 'flame',
  'Tokens Aristocrats': 'crown',
  'Dethrone Sacrifice': 'crown',
  
  // Voltron
  'Voltron': 'sword',
  'Voltron Shroud': 'sword',
  'Stompy Voltron': 'sword',
  'Enchantress Voltron': 'aura',
  'Land Voltron': 'mountain',
  
  // Spellslinger
  'Drake Spellslinger': 'bolt',
  'Draw Spellslinger': 'mage',
  'Flash Spellslinger': 'flash',
  'Heroic Spellslinger': 'bolt',
  'Magecraft Storm': 'mage',
  
  // Combat
  'Warrior Beatdown': 'axe',
  'Spirit Combat': 'ghost',
  'Human Synergy': 'shield',
  'Human Landfall': 'mountain',
  'Four-Color Aggro': 'bolt',
  
  // Combo/Storm
  'Artifact Combo': 'gear',
  'Big Mana Combo': 'gem',
  'Cost Reduction Storm': 'tornado',
  'Creature Storm': 'tornado',
  'Eldrazi Storm': 'shard',
  'Elf Mana Storm': 'leaf',
  'Treasure Storm': 'gem',
  'Creature Blink': 'flash',
  'Undying Combo': 'infinity',
  'Phyrexian Combo': 'shard',
  
  // Control/Stax
  'Control Stax': 'lock',
  'Connive Control': 'eye',
  'Lifegain Control': 'heart',
  'Slug Control': 'lock',
  'Flicker Stax': 'flash',
  'Mana Stax': 'lock',
  'Discard Stax': 'X',
  
  // Mill/Graveyard
  'Horror Mill': 'skull',
  'Mill Control': 'wave',
  'Mill Theft': 'wave',
  'Zombie Mill': 'skull',
  'Graveyard Value': 'grave',
  'Graveyard Recursion': 'grave',
  'Reanimator': 'grave',
  
  // Spellslinger/Burn
  'Burn & Draw': 'bolt',
  'Drake Spellslinger': 'bolt',
  'Token Burn': 'flame',
  
  // Tokens
  'Elf Tokens': 'leaf',
  'Equipment Tokens': 'sword',
  'Populate Tokens': 'crown',
  'Spellslinger Tokens': 'mage',
  'Tokens & Counters': 'star',
  
  // Landfall
  'Landfall Combo': 'mountain',
  'Landfall Draw': 'mountain',
  'Landfall Elementals': 'mountain',
  'Human Landfall': 'mountain',
  'Extra Lands': 'mountain',
  
  // Other
  'Cascade Chaos': 'tornado',
  'Group Hug': 'heart',
  'Wheel Engine': 'gear',
  'Superfriends': 'star',
  'Clone & Copy': 'mirror',
  'Creature Blink': 'flash',
  'ETB Drain': 'drain',
  'Experience Counters': 'eye',
  'Extra Turns Storm': 'hourglass',
  'Faerie Artifacts': 'moon',
  'Five-Color Goodstuff': 'gem',
  'Five-Color Legends': 'crown',
  'Flash Value': 'flash',
  'Hosts of Mordor': 'shard',
  'Hydra Tribal': 'snake',
  'Legendary Matters': 'crown',
  'Legendary Tribal': 'crown',
  'Library Bottom': 'book',
  'Madness Cycling': 'cyclone',
  'Mana Dorks Combo': 'leaf',
  'Mutant Menace': 'shard',
  'Sultai Goodstuff': 'wave',
  'Toughness Matters': 'shield',
  'Treasure Storm': 'gem',
  'Tyranid Swarm': 'claw',
  'Dwarf Treasure': 'gem',
  'Angel Dragon Demon': 'wing',
  'Counter Swarm': 'eye',
};

// Get icon type for a deck theme
export const getIconType = (theme) => {
  return THEME_TO_ICON[theme] || 'gem'; // Default to gem
};

// SVG icon definitions - these are paths that will be split
// Icons are designed to be splittable vertically or in a custom pattern
export const ICON_PATHS = {
  fangs: {
    path: 'M8,2 Q6,4 5,8 Q5,10 8,12 Q11,10 11,8 Q10,4 8,2 M5,8 L3,10 M11,8 L13,10',
    viewBox: '0 0 16 16'
  },
  skull: {
    path: 'M8,1 Q4,1 3,5 L3,8 Q3,11 5,12 L5,14 L11,14 L11,12 Q13,11 13,8 L13,5 Q12,1 8,1 M6,4 Q6,5 5,5 Q4,5 4,4 Q4,3 5,3 Q6,3 6,4 M12,4 Q12,5 11,5 Q10,5 10,4 Q10,3 11,3 Q12,3 12,4 M8,10 Q7,10 6,9 Q6,8 8,8 Q10,8 10,9 Q9,10 8,10 Z',
    viewBox: '0 0 16 16'
  },
  dragon: {
    path: 'M12,2 L14,3 L13,5 L14,7 Q12,9 10,9 L9,12 L7,10 L5,11 L4,8 Q2,7 1,5 L2,3 Z',
    viewBox: '0 0 16 14'
  },
  sword: {
    path: 'M8,1 L7,5 L5,8 L4,12 L5,14 Q5,14 8,14 Q11,14 11,14 L10,10 L10,5 L9,1 Z',
    viewBox: '0 0 14 14'
  },
  flame: {
    path: 'M8,0 Q6,2 6,5 Q6,7 7,8 Q5,9 5,11 Q5,13 7,14 Q8,15 8,15 Q9,15 9,14 Q11,13 11,11 Q11,9 9,8 Q10,7 10,5 Q10,2 8,0',
    viewBox: '0 0 16 16'
  },
  crown: {
    path: 'M2,8 L3,3 L5,5 L8,2 L11,5 L13,3 L14,8 L13,10 L3,10 Z M3,11 L13,11 L13,13 L3,13 Z',
    viewBox: '0 0 16 14'
  },
  star: {
    path: 'M8,1 L10,6 L15,6 L11,10 L13,15 L8,11 L3,15 L5,10 L1,6 L6,6 Z',
    viewBox: '0 0 16 16'
  },
  gear: {
    path: 'M8,2 L9,4 L11,3 L11,5 L13,6 L11,7 L11,9 L9,8 L8,10 L7,8 L5,9 L5,7 L3,6 L5,5 L5,3 L7,4 Z M8,6 Q9,6 9,7 Q9,8 8,8 Q7,8 7,7 Q7,6 8,6',
    viewBox: '0 0 16 16'
  },
  shield: {
    path: 'M8,1 L3,3 L3,7 Q3,12 8,14 Q13,12 13,7 L13,3 Z M8,4 L8,12 Q5,10 5,7 L5,4 Z',
    viewBox: '0 0 16 16'
  },
  bolt: {
    path: 'M8,1 L6,6 L10,6 L5,14 L7,9 L3,9 Z',
    viewBox: '0 0 14 14'
  },
  grave: {
    path: 'M6,2 L6,10 Q6,12 8,12 Q10,12 10,10 L10,2 Q8,1 6,2 M7,5 L7,9 M9,5 L9,9',
    viewBox: '0 0 16 14'
  },
  gem: {
    path: 'M8,1 L11,5 L11,11 Q8,14 8,14 Q8,14 5,11 L5,5 Z M5,5 L11,5 M8,5 L8,14',
    viewBox: '0 0 16 16'
  },
  wave: {
    path: 'M2,6 Q4,4 6,6 T10,6 T14,6 L14,14 L2,14 Z',
    viewBox: '0 0 16 16'
  },
  aura: {
    path: 'M8,2 Q6,2 5,4 Q3,3 2,5 Q2,7 4,8 Q3,10 5,11 Q6,13 8,13 Q10,13 11,11 Q13,10 12,8 Q14,7 14,5 Q13,3 11,4 Q10,2 8,2 M8,5 L8,10',
    viewBox: '0 0 16 14'
  },
  mountain: {
    path: 'M4,14 L8,6 L12,14 Z M1,14 L5,8 L8,12 L11,8 L15,14',
    viewBox: '0 0 16 14'
  },
  axe: {
    path: 'M5,2 L7,4 L7,11 L6,14 L10,14 L9,11 L9,4 L11,2 Z',
    viewBox: '0 0 16 14'
  },
  leaf: {
    path: 'M8,1 Q5,2 4,5 Q3,8 5,10 Q8,12 8,12 Q8,12 11,10 Q13,8 12,5 Q11,2 8,1 M8,3 L8,10',
    viewBox: '0 0 16 14'
  },
  claw: {
    path: 'M8,2 L9,6 L8,8 L7,6 Z M5,4 L5,8 L4,10 M8,8 L8,12 L7,14 M11,4 L11,8 L12,10',
    viewBox: '0 0 16 16'
  },
  paw: {
    path: 'M8,5 L9,1 Q9,0 8,0 Q7,0 7,1 L8,5 M4,7 L2,4 Q1,3 1,4 Q1,5 2,6 L6,7 M12,7 L14,4 Q15,3 15,4 Q15,5 14,6 L10,7 M6,9 L6,14 L10,14 L10,9 Q8,11 8,11 Q8,11 6,9',
    viewBox: '0 0 16 16'
  },
  infinity: {
    path: 'M4,7 Q2,7 2,5 Q2,3 4,3 Q6,3 6,5 Q6,7 4,7 M12,7 Q10,7 10,5 Q10,3 12,3 Q14,3 14,5 Q14,7 12,7 M6,5 L10,5',
    viewBox: '0 0 16 10'
  },
  X: {
    path: 'M2,2 L14,14 M14,2 L2,14',
    viewBox: '0 0 16 16'
  },
  lock: {
    path: 'M5,6 L5,4 Q5,2 7,2 Q9,2 9,4 L9,6 L4,6 L4,13 Q4,14 5,14 L11,14 Q12,14 12,13 L12,7 Q12,6 11,6 L5,6 M7,9 L9,9',
    viewBox: '0 0 16 16'
  },
  eye: {
    path: 'M2,8 Q4,4 8,4 Q12,4 14,8 Q12,12 8,12 Q4,12 2,8 M8,6 Q9,6 9,8 Q9,10 8,10 Q7,10 7,8 Q7,6 8,6',
    viewBox: '0 0 16 14'
  },
  heart: {
    path: 'M8,12 Q4,9 2,7 Q0,5 1,3 Q2,1 4,1 Q5,1 6,2 Q7,1 8,1 Q9,1 10,2 Q11,1 12,1 Q14,1 15,3 Q16,5 14,7 Q12,9 8,12',
    viewBox: '0 0 16 14'
  },
  shard: {
    path: 'M8,1 L11,6 L8,11 L5,6 Z M8,3 L9,5 L8,7 L7,5 Z',
    viewBox: '0 0 16 14'
  },
  mirror: {
    path: 'M4,2 L12,2 L12,12 L4,12 Z M4,2 L12,12 M5,4 L11,10',
    viewBox: '0 0 16 14'
  },
  hourglass: {
    path: 'M4,1 L12,1 L10,5 L10,7 L10,11 L12,15 L4,15 L6,11 L6,7 L6,5 Z',
    viewBox: '0 0 16 16'
  },
  moon: {
    path: 'M2,8 Q2,4 5,2 Q8,0 11,2 Q9,4 9,8 Q9,12 11,14 Q8,16 5,14 Q2,12 2,8',
    viewBox: '0 0 14 16'
  },
  book: {
    path: 'M4,1 L4,14 L12,14 L12,1 Z M4,1 L8,1 L8,14 M5,3 L11,3 M5,5 L11,5 M5,7 L11,7',
    viewBox: '0 0 16 16'
  },
  cyclone: {
    path: 'M8,1 Q6,3 7,5 Q8,7 6,8 Q4,8 4,10 Q4,12 7,12 Q9,12 10,10 Q11,12 13,12 Q15,12 15,10 Q15,8 13,7',
    viewBox: '0 0 16 14'
  },
  fireball: {
    path: 'M8,1 Q5,2 4,5 Q3,6 4,8 Q5,10 8,11 Q11,10 12,8 Q13,6 12,5 Q11,2 8,1 M6,4 Q6,5 7,5 Q8,5 8,4 Q9,5 10,5 Q11,4 10,3 Q8,3 6,4 M8,7 Q7,7 6,8 Q8,9 10,8 Q9,7 8,7',
    viewBox: '0 0 16 12'
  },
  drain: {
    path: 'M8,1 L8,11 L6,13 L10,13 Z M5,3 L11,3 M5,5 L11,5 M5,7 L11,7',
    viewBox: '0 0 16 14'
  },
  flash: {
    path: 'M8,1 L6,4 L8,4 L4,12 L8,8 L6,8 L12,1 Z',
    viewBox: '0 0 14 14'
  },
  tornado: {
    path: 'M4,1 L12,2 L4,4 L11,6 L3,8 L10,10 L2,12',
    viewBox: '0 0 14 14'
  },
  mage: {
    path: 'M8,1 Q6,1 5,3 L5,5 L6,7 L4,9 L6,11 L5,13 L7,13 L8,11 L9,13 L11,13 L10,11 L12,9 L10,7 L11,5 L11,3 Q10,1 8,1 M8,3 L8,7',
    viewBox: '0 0 14 14'
  },
  ghost: {
    path: 'M5,1 L3,1 Q2,1 2,3 L2,9 Q2,11 5,12 L11,12 Q14,11 14,9 L14,3 Q14,1 13,1 L11,1 Q10,3 8,3 Q6,3 5,1 M5,7 Q5,8 6,8 Q7,8 7,7 Q9,7 9,8 Q9,8 10,8 Q11,8 11,7',
    viewBox: '0 0 16 14'
  },
  tornado: {
    path: 'M3,2 L13,3 L4,5 L12,7 L2,9 L11,11 L3,13',
    viewBox: '0 0 14 16'
  },
  wing: {
    path: 'M8,2 L6,6 L4,8 L6,10 L8,12 L10,10 L12,8 L10,6 Z M8,5 L7,7 L8,9 L9,7 Z',
    viewBox: '0 0 16 14'
  }
};

/**
 * Get split colors for an icon based on deck colors
 * Returns an object with color information for rendering
 */
export const getSplitColors = (colours) => {
  if (!colours || colours.length === 0) {
    return { primary: '#00d4ff', secondary: null };
  }
  
  if (colours.length === 1) {
    return { primary: colours[0], secondary: null };
  }
  
  // For multi-color, return primary and secondary
  return {
    primary: colours[0],
    secondary: colours[1]
  };
};
