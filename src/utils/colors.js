// Color compatibility rules for outfit generation
// Based on professional color theory: neutrals, analogous, complementary, triadic, and monochromatic

const NEUTRAL_COLORS = ['negro', 'blanco', 'gris', 'beige']
const EARTH_TONES = ['cafe', 'beige', 'olivo', 'vino']
const WARM_COLORS = ['rojo', 'coral', 'naranja', 'amarillo', 'rosa', 'cafe', 'vino']
const COOL_COLORS = ['azul', 'azul_marino', 'verde', 'morado', 'olivo']

// Color wheel positions (simplified, 0-360 degrees)
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

// Paletas de color curadas (combinaciones probadas en moda profesional)
const CURATED_PALETTES = [
  // Clásicas
  ['negro', 'blanco'],
  ['azul_marino', 'blanco'],
  ['gris', 'azul_marino'],
  ['beige', 'azul_marino'],
  ['negro', 'gris'],
  // Tierra
  ['cafe', 'beige'],
  ['olivo', 'beige'],
  ['cafe', 'blanco'],
  ['vino', 'beige'],
  // Vibrantes
  ['azul_marino', 'rojo'],
  ['blanco', 'rojo'],
  ['negro', 'rojo'],
  ['gris', 'rosa'],
  ['azul_marino', 'amarillo'],
  ['blanco', 'azul'],
  // Tonos fríos
  ['azul', 'gris'],
  ['verde', 'negro'],
  ['morado', 'gris'],
  ['azul_marino', 'verde'],
  // Tonos cálidos
  ['naranja', 'azul_marino'],
  ['coral', 'blanco'],
  ['amarillo', 'gris'],
  ['rosa', 'azul_marino'],
]

// Combinaciones que un estilista profesional evitaría
const COLOR_CLASHES = [
  ['rojo', 'naranja'],
  ['rojo', 'rosa'],
  ['naranja', 'rosa'],
  ['verde', 'rojo'],     // Navidad
  ['morado', 'amarillo'], // Demasiado chillón
  ['verde', 'naranja'],
]

/**
 * Check if a color is neutral (goes with everything)
 */
export function isNeutral(color) {
  return NEUTRAL_COLORS.includes(color)
}

/**
 * Check if two colors are in the same temperature family
 */
export function sameTemperature(c1, c2) {
  return (WARM_COLORS.includes(c1) && WARM_COLORS.includes(c2)) ||
         (COOL_COLORS.includes(c1) && COOL_COLORS.includes(c2))
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
 * Check if a pair of colors is a known curated palette
 */
function isCuratedPalette(c1, c2) {
  return CURATED_PALETTES.some(
    ([a, b]) => (a === c1 && b === c2) || (a === c2 && b === c1)
  )
}

/**
 * Check if a pair of colors is a known clash
 */
function isClash(c1, c2) {
  return COLOR_CLASHES.some(
    ([a, b]) => (a === c1 && b === c2) || (a === c2 && b === c1)
  )
}

/**
 * Check if two colors are compatible (advanced)
 * Returns a score: 0 (incompatible) to 1 (perfect match)
 */
export function colorCompatibility(color1, color2) {
  if (!color1 || !color2) return 0.5

  // Known clash → penalizar fuerte
  if (isClash(color1, color2)) return 0.15

  // Paleta curada → prioridad máxima
  if (isCuratedPalette(color1, color2)) return 1.0

  // Ambos neutrales = siempre perfecto
  if (isNeutral(color1) && isNeutral(color2)) return 0.95

  // Un neutral + cualquier cosa = excelente
  if (isNeutral(color1) || isNeutral(color2)) return 0.9

  // Monocromático (mismo color)
  if (color1 === color2) return 0.75

  // Ambos tonos tierra
  if (EARTH_TONES.includes(color1) && EARTH_TONES.includes(color2)) return 0.85

  // Misma temperatura
  if (sameTemperature(color1, color2)) {
    const dist = hueDistance(color1, color2)
    if (dist < 30) return 0.8  // Muy cercanos, análogos
    if (dist < 60) return 0.65
    return 0.5
  }

  // Complementarios (opuestos en la rueda)
  const distance = hueDistance(color1, color2)
  if (distance > 150 && distance < 210) return 0.7

  // Triádicos (~120° apart)
  if (distance > 100 && distance < 140) return 0.6

  // Temperaturas mezcladas sin regla clara → riesgoso
  return 0.35
}

/**
 * Style compatibility matrix (avanzada)
 * Devuelve un score de 0 a 1
 */
export function styleCompatibility(styles1, styles2) {
  if (!styles1?.length || !styles2?.length) return 0.5

  const matrix = {
    casual:    { casual: 1.0, urbano: 0.85, formal: 0.3, deportivo: 0.25 },
    formal:    { casual: 0.3, urbano: 0.4, formal: 1.0, deportivo: 0.05 },
    urbano:    { casual: 0.85, urbano: 1.0, formal: 0.4, deportivo: 0.5 },
    deportivo: { casual: 0.25, urbano: 0.5, formal: 0.05, deportivo: 1.0 },
  }

  let bestScore = 0
  for (const s1 of styles1) {
    for (const s2 of styles2) {
      const score = matrix[s1]?.[s2] ?? 0.3
      if (score > bestScore) bestScore = score
    }
  }
  return bestScore
}

/**
 * Map occasion to compatible styles (con niveles de preferencia)
 */
export function ocasionToEstilos(ocasion) {
  const map = {
    casual:  ['casual', 'urbano'],
    trabajo: ['formal', 'casual'],
    fiesta:  ['urbano', 'formal'],
    cita:    ['casual', 'formal', 'urbano'],
    deporte: ['deportivo'],
  }
  return map[ocasion] || ['casual']
}

/**
 * Subcategoría compatibility matrix
 * Algunas subcategorías simplemente NO combinan (ej: sandalias con traje formal)
 */
export const SUBCATEGORIA_RULES = {
  // Formales: estas prendas se potencian juntas
  formal_top: ['Camisa', 'Polo', 'Blusa'],
  formal_bottom: ['Pantalón', 'Falda'],
  formal_shoes: ['Zapatos', 'Mocasines', 'Botas'],
  formal_layers: ['Blazer', 'Abrigo', 'Sueter'],

  // Casual: estas prendas se potencian juntas
  casual_top: ['Playera', 'Polo', 'Hoodie', 'Tank top', 'Blusa'],
  casual_bottom: ['Jeans', 'Jogger', 'Short', 'Bermuda', 'Pantalón'],
  casual_shoes: ['Tenis', 'Sandalias', 'Botas'],
  casual_layers: ['Chamarra', 'Sudadera', 'Sueter', 'Chaleco'],

  // Deportivo
  sport_top: ['Playera', 'Tank top'],
  sport_bottom: ['Jogger', 'Short'],
  sport_shoes: ['Tenis'],
}

/**
 * Check subcategory clashes (combinaciones que un estilista evitaría)
 */
export function subcategoriaClash(sub1, cat1, sub2, cat2) {
  // Sandalias con jogger/pantalón formal
  if (sub1 === 'Sandalias' && ['Jogger', 'Pantalón'].includes(sub2)) return true
  if (sub2 === 'Sandalias' && ['Jogger', 'Pantalón'].includes(sub1)) return true

  // Zapatos formales con shorts
  if (['Zapatos', 'Mocasines'].includes(sub1) && sub2 === 'Short') return true
  if (['Zapatos', 'Mocasines'].includes(sub2) && sub1 === 'Short') return true

  // Hoodie con blazer
  if ((sub1 === 'Hoodie' && sub2 === 'Blazer') || (sub2 === 'Hoodie' && sub1 === 'Blazer')) return true

  // Tank top con blazer
  if ((sub1 === 'Tank top' && sub2 === 'Blazer') || (sub2 === 'Tank top' && sub1 === 'Blazer')) return true

  return false
}

/**
 * Bonus de sinergia por subcategorías que combinan profesionalmente
 */
export function subcategoriaSynergy(items) {
  let bonus = 0
  const subs = items.map(i => i.subcategoria).filter(Boolean)

  // Camisa + Pantalón + Zapatos = look ejecutivo
  if (subs.includes('Camisa') && subs.includes('Pantalón') && subs.includes('Zapatos')) bonus += 0.15

  // Camisa + Jeans + Tenis = smart casual perfecto
  if (subs.includes('Camisa') && subs.includes('Jeans') && subs.includes('Tenis')) bonus += 0.12

  // Playera + Jeans + Tenis = clásico casual
  if (subs.includes('Playera') && subs.includes('Jeans') && subs.includes('Tenis')) bonus += 0.10

  // Polo + Pantalón + Mocasines = preppy
  if (subs.includes('Polo') && subs.includes('Pantalón') && subs.includes('Mocasines')) bonus += 0.12

  // Blazer + Camisa = upgrade automático
  if (subs.includes('Blazer') && subs.includes('Camisa')) bonus += 0.10

  // Hoodie + Jogger + Tenis = streetwear coherente
  if (subs.includes('Hoodie') && subs.includes('Jogger') && subs.includes('Tenis')) bonus += 0.10

  return Math.min(bonus, 0.2) // Cap máximo
}
