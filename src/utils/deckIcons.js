/**
 * Mana Color Icon System
 * Maps mana colors to iconic symbols with glowing appearance
 * W: Sun, U: Water drop, B: Skull, R: Fire circle, G: Forest
 */

// Mana color to icon mapping
export const COLOUR_TO_ICON = {
  'W': 'sun',      // White: Sun
  'U': 'droplet',  // Blue: Water drop
  'B': 'skull',    // Black: Skull
  'R': 'fireball', // Red: Fire circle
  'G': 'forest'    // Green: Forest
};

/**
 * Get icon types for deck colors in order
 * Returns array of icon types for rendering
 */
export const getIconsForColours = (colours) => {
  return colours.map(c => COLOUR_TO_ICON[c] || 'sun');
};

// SVG icon definitions - solid glowing symbols
export const ICON_PATHS = {
  sun: {
    // Sunburst with 8 rays
    path: 'M8,1 L9,3.5 L11,2 L10,4.5 L12.5,4 L10.5,5.5 L12,7.5 L9.5,6.5 L9.5,9 L8,6.5 L5.5,7.5 L7,5.5 L5,4.5 L7.5,4 L6.5,2 L8.5,3.5 Z M8,5 Q8.5,5 8.5,5.5 Q8.5,6 8,6 Q7.5,6 7.5,5.5 Q7.5,5 8,5',
    viewBox: '0 0 16 14',
    fill: true
  },
  droplet: {
    // Water droplet - smooth teardrop
    path: 'M8,1 Q10,3 10,5.5 Q10,8.5 8,11 Q6,8.5 6,5.5 Q6,3 8,1 Z M8,4 Q8.8,4.8 8.8,5.5 Q8.8,6.5 8,6.5 Q7.2,6.5 7.2,5.5 Q7.2,4.8 8,4',
    viewBox: '0 0 16 14',
    fill: true
  },
  skull: {
    // Skull with eye sockets
    path: 'M8,1 Q5,1.5 4,4 L4,7 Q4,9 5.5,10 L5.5,12 L10.5,12 L10.5,10 Q12,9 12,7 L12,4 Q11,1.5 8,1 Z M5.5,4.5 Q5.5,5.5 6.2,5.5 Q6.8,5.5 6.8,4.5 Q6.8,3.5 6.2,3.5 Q5.5,3.5 5.5,4.5 M11.2,4.5 Q11.2,5.5 10.5,5.5 Q9.8,5.5 9.8,4.5 Q9.8,3.5 10.5,3.5 Q11.2,3.5 11.2,4.5 M8,8 Q7.2,8.5 8,9 Q8.8,8.5 8,8',
    viewBox: '0 0 16 14',
    fill: true
  },
  fireball: {
    // Fire circle with flame top
    path: 'M8,1.5 Q6,2.5 5,4.5 Q4,6.5 4,8.5 Q4,11 6,12.5 Q8,13.5 8,13.5 Q8,13.5 10,12.5 Q12,11 12,8.5 Q12,6.5 11,4.5 Q10,2.5 8,1.5 Z M7,5 Q6.5,5.5 7,6.5 Q7.5,5.5 8,6 Q8.5,5.5 9,6.5 Q9.5,5.5 9,5 Q8,4.5 7,5 Z M8,8.5 Q7,8.5 6.5,9.5 Q7,10 8,10 Q9,10 9.5,9.5 Q9,8.5 8,8.5',
    viewBox: '0 0 16 14',
    fill: true
  },
  forest: {
    // Dense forest tree
    path: 'M8,1 L11,5 L10,5 L12,8.5 L11,8.5 L12,11.5 L4,11.5 L5,8.5 L4,8.5 L6,5 L5,5 Z M6.5,6.5 L9.5,6.5 L8,9 Z M7,10 L9,10 L8.5,11.5',
    viewBox: '0 0 16 13',
    fill: true
  }
};

/**
 * Get split colors for rendering
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
