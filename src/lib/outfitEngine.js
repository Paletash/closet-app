import {
  colorCompatibility,
  styleCompatibility,
  ocasionToEstilos,
  subcategoriaClash,
  subcategoriaSynergy,
} from '../utils/colors'

/**
 * OutfitEngine v2.0 - Motor Profesional de Combinación de Outfits
 *
 * Genera combinaciones basándose en 6 pilares:
 * 1. Compatibilidad de colores (teoría del color + paletas curadas)
 * 2. Compatibilidad de estilos (matrix de afinidad)
 * 3. Sinergia de subcategorías (reglas de moda real)
 * 4. Adaptación climática (temperatura + descripción del clima)
 * 5. Diversidad de uso (prioriza prendas menos usadas)
 * 6. Anti-repetición (evita sugerir el mismo outfit dos veces)
 *
 * Genera explicaciones automáticas ("razón" y "tip de estilo")
 * sin necesidad de IA externa.
 */

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function groupByCategory(clothes) {
  const groups = { superior: [], inferior: [], calzado: [], chamarra: [], accesorio: [] }
  for (const item of clothes) {
    if (groups[item.categoria]) {
      groups[item.categoria].push(item)
    }
  }
  return groups
}

function filterBySeason(clothes, temporada) {
  if (!temporada) return clothes
  return clothes.filter(
    (item) =>
      !item.temporadas?.length ||
      item.temporadas.includes(temporada) ||
      item.temporadas.includes('todas')
  )
}

function filterByOcasion(clothes, ocasion) {
  if (!ocasion) return clothes
  const compatibleStyles = ocasionToEstilos(ocasion)
  return clothes.filter(
    (item) =>
      !item.estilos?.length ||
      item.estilos.some((s) => compatibleStyles.includes(s))
  )
}

// ═══════════════════════════════════════════════════════════
// SCORING SYSTEM (Multi-criterio)
// ═══════════════════════════════════════════════════════════

/**
 * Puntuación de compatibilidad de colores del outfit completo
 * Evalúa TODOS los pares de prendas
 */
function scoreColors(items) {
  if (items.length < 2) return 0.5

  let total = 0
  let comparisons = 0
  let hasClash = false

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const score = colorCompatibility(items[i].color_principal, items[j].color_principal)
      if (score < 0.2) hasClash = true
      total += score
      comparisons++
    }
  }

  const avg = comparisons > 0 ? total / comparisons : 0.5

  // Si hay un clash de colores, penalizar el outfit entero
  if (hasClash) return avg * 0.5

  // Bonus: si hay max 3 colores distintos (regla de los 3 colores)
  const uniqueColors = new Set(items.map(i => i.color_principal).filter(Boolean))
  if (uniqueColors.size <= 3) return Math.min(avg + 0.05, 1)

  // Más de 4 colores distintos → penalización leve
  if (uniqueColors.size >= 5) return avg * 0.85

  return avg
}

/**
 * Puntuación de compatibilidad de estilos
 */
function scoreStyles(items) {
  if (items.length < 2) return 0.5

  let total = 0
  let comparisons = 0

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      total += styleCompatibility(items[i].estilos, items[j].estilos)
      comparisons++
    }
  }

  return comparisons > 0 ? total / comparisons : 0.5
}

/**
 * Detecta clashes de subcategorías (combinaciones que un estilista evitaría)
 */
function hasSubcategoriaClash(items) {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (subcategoriaClash(
        items[i].subcategoria, items[i].categoria,
        items[j].subcategoria, items[j].categoria
      )) {
        return true
      }
    }
  }
  return false
}

/**
 * Puntuación climática
 * Evalúa si el outfit es apropiado para la temperatura actual
 */
function scoreClimate(items, weather) {
  if (!weather?.temperatura) return 0.5

  const temp = weather.temperatura
  const hasJacket = items.some(i => i.categoria === 'chamarra')
  const hasTankTop = items.some(i => i.subcategoria === 'Tank top')
  const hasShort = items.some(i => ['Short', 'Bermuda'].includes(i.subcategoria))
  const hasHoodie = items.some(i => ['Hoodie', 'Sudadera'].includes(i.subcategoria))
  const hasSandals = items.some(i => i.subcategoria === 'Sandalias')
  const hasBoots = items.some(i => i.subcategoria === 'Botas')

  // Hace calor (>25°C)
  if (temp > 25) {
    let score = 0.6
    if (hasTankTop || hasShort) score += 0.15
    if (hasSandals) score += 0.1
    if (hasJacket || hasHoodie) score -= 0.3 // Chamarra con calor = mal
    if (hasBoots) score -= 0.15
    return Math.max(0.1, Math.min(1, score))
  }

  // Templado (15-25°C)
  if (temp >= 15 && temp <= 25) {
    let score = 0.7
    if (hasTankTop && !hasJacket) score -= 0.1 // Tank top sin capa = podría tener frío
    return Math.max(0.1, Math.min(1, score))
  }

  // Frío (<15°C)
  if (temp < 15) {
    let score = 0.5
    if (hasJacket || hasHoodie) score += 0.25
    if (hasBoots) score += 0.1
    if (hasTankTop) score -= 0.3 // Tank top con frío = mal
    if (hasShort) score -= 0.25
    if (hasSandals) score -= 0.2
    return Math.max(0.1, Math.min(1, score))
  }

  return 0.5
}

/**
 * Puntuación de diversidad de uso
 * Prioriza prendas que el usuario ha usado menos veces
 */
function scoreDiversity(items) {
  const useCounts = items.map(i => i.veces_usado ?? 0)
  if (useCounts.length === 0) return 0.5

  const maxUse = Math.max(...useCounts, 1)
  // Mientras menos se hayan usado, mayor el score
  const avg = useCounts.reduce((a, b) => a + b, 0) / useCounts.length
  return Math.max(0.3, 1 - (avg / (maxUse * 2)))
}

/**
 * Puntuación final compuesta
 */
function scoreOutfit(items, weather = null) {
  // Si tiene un clash de subcategorías, descartarlo con penalización severa
  if (hasSubcategoriaClash(items)) return 0.1

  const colorScore    = scoreColors(items)
  const styleScore    = scoreStyles(items)
  const synergyBonus  = subcategoriaSynergy(items)
  const climateScore  = scoreClimate(items, weather)
  const diversityScore = scoreDiversity(items)

  // Pesos de cada criterio
  const weights = weather
    ? { color: 0.30, style: 0.20, climate: 0.20, diversity: 0.15, synergy: 0.15 }
    : { color: 0.35, style: 0.25, climate: 0.0,  diversity: 0.20, synergy: 0.20 }

  const baseScore =
    colorScore     * weights.color +
    styleScore     * weights.style +
    climateScore   * weights.climate +
    diversityScore * weights.diversity +
    synergyBonus   * weights.synergy

  return Math.min(1, Math.max(0, baseScore))
}

// ═══════════════════════════════════════════════════════════
// SMART COMBINATION GENERATOR
// ═══════════════════════════════════════════════════════════

/**
 * Genera todas las combinaciones posibles (con límite inteligente)
 * y las evalúa para devolver las mejores
 */
function generateCandidates(groups, weather, maxCandidates = 200) {
  const candidates = []

  // Limitar cada grupo para evitar explosión combinatoria
  const tops = groups.superior.slice(0, 8)
  const bottoms = groups.inferior.slice(0, 8)
  const shoes = groups.calzado.slice(0, 6)
  const jackets = groups.chamarra || []

  for (const top of tops) {
    for (const bottom of bottoms) {
      for (const shoe of shoes) {
        const baseItems = [top, bottom, shoe]

        // Evaluar combinación base (sin chamarra ni accesorio)
        const baseScore = scoreOutfit(baseItems, weather)

        // Solo considerar si la base es decente (>0.3)
        if (baseScore > 0.3) {
          candidates.push({
            items: baseItems,
            score: baseScore,
            prendaIds: baseItems.map(i => i.id),
          })
        }

        // Probar con cada chamarra
        for (const jacket of jackets.slice(0, 4)) {
          const withJacket = [...baseItems, jacket]
          const jScore = scoreOutfit(withJacket, weather)
          if (jScore > 0.35) {
            candidates.push({
              items: withJacket,
              score: jScore,
              prendaIds: withJacket.map(i => i.id),
            })
          }
        }

        if (candidates.length >= maxCandidates) break
      }
      if (candidates.length >= maxCandidates) break
    }
    if (candidates.length >= maxCandidates) break
  }

  // Ordenar por score y devolver los mejores
  candidates.sort((a, b) => b.score - a.score)
  return candidates
}

/**
 * Selecciona los mejores outfits, asegurando diversidad
 * (no repite la misma prenda superior en dos outfits seguidos)
 */
function selectDiverseOutfits(candidates, count) {
  const selected = []
  const usedTops = new Set()
  const usedBottoms = new Set()

  for (const candidate of candidates) {
    if (selected.length >= count) break

    const topId = candidate.items.find(i => i.categoria === 'superior')?.id
    const bottomId = candidate.items.find(i => i.categoria === 'inferior')?.id

    // Intentar no repetir la misma prenda superior o inferior
    if (selected.length > 0 && usedTops.has(topId) && usedBottoms.has(bottomId)) continue

    selected.push(candidate)
    if (topId) usedTops.add(topId)
    if (bottomId) usedBottoms.add(bottomId)
  }

  // Si no alcanzamos el count con diversidad, rellenar con los mejores restantes
  if (selected.length < count) {
    for (const candidate of candidates) {
      if (selected.length >= count) break
      if (!selected.includes(candidate)) {
        selected.push(candidate)
      }
    }
  }

  return selected
}

// ═══════════════════════════════════════════════════════════
// AUTO-EXPLANATION GENERATOR
// ═══════════════════════════════════════════════════════════

const COLOR_LABELS = {
  negro: 'negro', blanco: 'blanco', gris: 'gris', beige: 'beige',
  azul: 'azul', azul_marino: 'azul marino', rojo: 'rojo', verde: 'verde',
  amarillo: 'amarillo', naranja: 'naranja', rosa: 'rosa', morado: 'morado',
  cafe: 'café', vino: 'vino', olivo: 'olivo', coral: 'coral',
}

function generateExplanation(outfit) {
  const items = outfit.items
  const colors = [...new Set(items.map(i => COLOR_LABELS[i.color_principal] || i.color_principal).filter(Boolean))]
  const styles = [...new Set(items.flatMap(i => i.estilos || []))]
  const categories = items.map(i => i.subcategoria || i.categoria).filter(Boolean)
  const score = outfit.score

  // ── Razón ──
  const reasons = []

  // Explicar colores
  if (colors.length <= 2) {
    reasons.push(`Paleta minimalista de ${colors.join(' y ')} que proyecta elegancia`)
  } else if (colors.length === 3) {
    reasons.push(`Combinación equilibrada de ${colors.join(', ')} siguiendo la regla de los 3 colores`)
  } else {
    reasons.push(`Mix creativo de ${colors.join(', ')}`)
  }

  // Explicar estilo
  if (styles.includes('formal') && styles.includes('casual')) {
    reasons.push('fusiona lo formal con lo casual para un look smart-casual')
  } else if (styles.includes('formal')) {
    reasons.push('mantiene una línea formal y pulida')
  } else if (styles.includes('urbano')) {
    reasons.push('con un toque urbano y contemporáneo')
  } else if (styles.includes('deportivo')) {
    reasons.push('cómodo y funcional para el movimiento')
  } else {
    reasons.push('relajado y versátil para el día a día')
  }

  // Explicar prendas clave
  const hasJacket = items.find(i => i.categoria === 'chamarra')
  if (hasJacket) {
    reasons.push(`la ${(hasJacket.subcategoria || 'chamarra').toLowerCase()} agrega estructura al look`)
  }

  const razon = reasons[0].charAt(0).toUpperCase() + reasons[0].slice(1) +
    (reasons.length > 1 ? ', ' + reasons.slice(1).join(' y ') : '') + '.'

  // ── Tip de estilo ──
  const tips = []

  if (score >= 0.8) {
    tips.push(
      'Remanga las mangas para un aire más desenfadado.',
      'Añade un reloj minimalista para elevar el outfit.',
      'Lleva los colores claros arriba y oscuros abajo para estilizar la silueta.',
    )
  } else if (score >= 0.6) {
    tips.push(
      'Un cinturón del mismo tono que el calzado unificará todo el look.',
      'Enrolla el bajo del pantalón para mostrar el calzado y dar un toque moderno.',
      'Prueba meter la parte delantera de la camisa/playera dentro del pantalón para definir la cintura.',
    )
  } else {
    tips.push(
      'Juega con accesorios (gorra, reloj, bufanda) para darle personalidad.',
      'Si te sientes inseguro con esta combinación, añade una prenda neutra (negra, blanca o gris) como capa.',
      'Recuerda: la confianza es el mejor accesorio. Luce lo que te haga sentir bien.',
    )
  }

  // Tip específico por categoría
  if (categories.includes('Blazer')) {
    tips.push('Dobla las mangas del blazer hasta el antebrazo para un look más relajado pero pulido.')
  }
  if (categories.includes('Hoodie') && categories.includes('Jeans')) {
    tips.push('Unos tenis blancos completarían este look streetwear a la perfección.')
  }
  if (categories.includes('Camisa') && categories.includes('Jeans')) {
    tips.push('Este es un look smart-casual perfecto para una primera cita o un brunch.')
  }

  const tip_estilo = tips[Math.floor(Math.random() * tips.length)]

  return { razon, tip_estilo }
}

// ═══════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════

/**
 * Generate outfit suggestions
 *
 * @param {Array} clothes - All user's clothes
 * @param {Object} params - { ocasion, temporada }
 * @param {number} count - Number of suggestions to generate
 * @param {Object} weather - Optional weather data { temperatura, descripcion }
 * @returns {{ outfits, error, missing }}
 */
export function generateOutfits(clothes, params = {}, count = 3, weather = null) {
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

  // Generate and evaluate all viable candidates
  const candidates = generateCandidates(groups, weather)

  if (candidates.length === 0) {
    return {
      outfits: [],
      error: 'No se encontraron combinaciones compatibles con los filtros seleccionados.',
      missing: null,
    }
  }

  // Select diverse top outfits
  const topOutfits = selectDiverseOutfits(candidates, count)

  // Enrich with explanations
  for (const outfit of topOutfits) {
    const { razon, tip_estilo } = generateExplanation(outfit)
    outfit.razon = razon
    outfit.tip_estilo = tip_estilo
  }

  return {
    outfits: topOutfits,
    error: null,
    missing: null,
  }
}
