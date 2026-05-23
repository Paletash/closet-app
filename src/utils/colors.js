// Color compatibility rules for outfit generation
// Based on color theory: neutrals, analogous, complementary, and monochromatic

const NEUTRAL_COLORS = ['negro', 'blanco', 'gris', 'beige']

// Color wheel positions (simplified)
const COLOR_WHEEL = {
  rojo: 0,
  coral: 15,
  naranja: 30,
  amarillo: 60,
  olivo: 80,
  verde: 120,
  azul: 210,
  azul_marino: 230,
  morado: 270,
  rosa: 330,
  vino: 345,
  cafe: 25,
}

/**
 * Check if a color is neutral (goes with everything)
 */
export function isNeutral(color) {
  return NEUTRAL_COLORS.includes(color)
}

/**
 * Get hue distance between two colors (0-180)
 */
function hueDistance(color1, color2) {
  const h1 = COLOR_WHEEL[color1]
  const h2 = COLOR_WHEEL[color2]
  if (h1 === undefined || h2 === undefined) return 0
  const diff = Math.abs(h1 - h2)
  return Math.min(diff, 360 - diff)
}

/**
 * Check if two colors are compatible
 * Returns a score: 0 (incompatible) to 1 (perfect match)
 */
export function colorCompatibility(color1, color2) {
  if (!color1 || !color2) return 0.5

  // Same color = monochromatic (good)
  if (color1 === color2) return 0.8

  // Neutral + anything = great
  if (isNeutral(color1) || isNeutral(color2)) return 0.9

  // Both neutral = perfect
  if (isNeutral(color1) && isNeutral(color2)) return 1

  const distance = hueDistance(color1, color2)

  // Analogous (close colors, < 40°)
  if (distance < 40) return 0.75

  // Complementary (opposite, ~180°)
  if (distance > 150 && distance < 210) return 0.85

  // Triadic (~120° apart)
  if (distance > 100 && distance < 140) return 0.7

  // Everything else
  if (distance > 40 && distance < 100) return 0.4

  return 0.5
}

/**
 * Check style compatibility
 */
export function styleCompatibility(styles1, styles2) {
  if (!styles1?.length || !styles2?.length) return 0.5

  const compatible = {
    casual: ['casual', 'urbano'],
    formal: ['formal'],
    urbano: ['casual', 'urbano'],
    deportivo: ['deportivo'],
  }

  for (const s1 of styles1) {
    for (const s2 of styles2) {
      if (compatible[s1]?.includes(s2)) return 1
      if (s1 === s2) return 1
    }
  }

  return 0.2
}

/**
 * Map occasion to compatible styles
 */
export function ocasionToEstilos(ocasion) {
  const map = {
    casual: ['casual', 'urbano'],
    trabajo: ['formal', 'casual'],
    fiesta: ['urbano', 'formal'],
    cita: ['casual', 'formal', 'urbano'],
    deporte: ['deportivo'],
  }
  return map[ocasion] || ['casual']
}
