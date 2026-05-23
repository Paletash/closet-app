import { colorCompatibility, styleCompatibility, ocasionToEstilos } from '../utils/colors'

/**
 * OutfitEngine - Motor de sugerencias de outfits por reglas simples
 *
 * Genera combinaciones de prendas basándose en:
 * 1. Categorías requeridas (top + bottom + calzado)
 * 2. Compatibilidad de colores (teoría del color)
 * 3. Compatibilidad de estilos
 * 4. Filtro por temporada y ocasión
 */

/**
 * Group clothes by category
 */
function groupByCategory(clothes) {
  const groups = { superior: [], inferior: [], calzado: [], chamarra: [], accesorio: [] }
  for (const item of clothes) {
    if (groups[item.categoria]) {
      groups[item.categoria].push(item)
    }
  }
  return groups
}

/**
 * Filter clothes by season
 */
function filterBySeason(clothes, temporada) {
  if (!temporada) return clothes
  return clothes.filter(
    (item) =>
      !item.temporadas?.length ||
      item.temporadas.includes(temporada) ||
      item.temporadas.includes('todas')
  )
}

/**
 * Filter clothes by compatible styles for an occasion
 */
function filterByOcasion(clothes, ocasion) {
  if (!ocasion) return clothes
  const compatibleStyles = ocasionToEstilos(ocasion)
  return clothes.filter(
    (item) =>
      !item.estilos?.length ||
      item.estilos.some((s) => compatibleStyles.includes(s))
  )
}

/**
 * Calculate outfit score based on color and style compatibility
 */
function scoreOutfit(items) {
  if (items.length < 2) return 0

  let totalScore = 0
  let comparisons = 0

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const cScore = colorCompatibility(
        items[i].color_principal,
        items[j].color_principal
      )
      const sScore = styleCompatibility(
        items[i].estilos,
        items[j].estilos
      )
      totalScore += cScore * 0.6 + sScore * 0.4
      comparisons++
    }
  }

  return comparisons > 0 ? totalScore / comparisons : 0
}

/**
 * Shuffle array (Fisher-Yates)
 */
function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Generate outfit suggestions
 *
 * @param {Array} clothes - All user's clothes
 * @param {Object} params - { ocasion, temporada }
 * @param {number} count - Number of suggestions to generate
 * @returns {Array} - Array of outfit suggestions, sorted by score
 */
export function generateOutfits(clothes, params = {}, count = 3) {
  const { ocasion, temporada } = params

  // Filter clothes
  let filtered = [...clothes]
  if (temporada) filtered = filterBySeason(filtered, temporada)
  if (ocasion) filtered = filterByOcasion(filtered, ocasion)

  // Group by category
  const groups = groupByCategory(filtered)

  // Need at least a superior, inferior, and shoes
  if (groups.superior.length === 0 || groups.inferior.length === 0 || groups.calzado.length === 0) {
    return {
      outfits: [],
      error: 'Necesitas al menos 1 superior, 1 inferior y 1 par de calzado para generar un outfit.',
      missing: {
        superior: groups.superior.length === 0,
        inferior: groups.inferior.length === 0,
        calzado: groups.calzado.length === 0,
      },
    }
  }

  const outfits = []
  const seen = new Set()
  const maxAttempts = 100

  for (let attempt = 0; attempt < maxAttempts && outfits.length < count; attempt++) {
    const superior = shuffle(groups.superior)[0]
    const inferior = shuffle(groups.inferior)[0]
    const calzado = shuffle(groups.calzado)[0]

    // Create unique key to avoid duplicates
    const key = [superior.id, inferior.id, calzado.id].sort().join('-')
    if (seen.has(key)) continue
    seen.add(key)

    const items = [superior, inferior, calzado]

    // Optionally add chamarra
    if (groups.chamarra.length > 0 && Math.random() > 0.4) {
      const chamarra = shuffle(groups.chamarra)[0]
      items.push(chamarra)
    }

    // Optionally add accessory
    if (groups.accesorio.length > 0 && Math.random() > 0.6) {
      const accesorio = shuffle(groups.accesorio)[0]
      items.push(accesorio)
    }

    const score = scoreOutfit(items)

    outfits.push({
      items,
      score,
      prendaIds: items.map((i) => i.id),
    })
  }

  // Sort by score (highest first)
  outfits.sort((a, b) => b.score - a.score)

  return {
    outfits: outfits.slice(0, count),
    error: null,
    missing: null,
  }
}
