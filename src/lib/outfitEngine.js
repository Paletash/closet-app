import {
  colorCompatibility,
  styleCompatibility,
  ocasionToEstilos,
  subcategoriaClash,
  subcategoriaSynergy,
} from '../utils/colors'

/**
 * OutfitEngine v3.0 - Motor Profesional de Combinación de Outfits
 *
 * Genera combinaciones basándose en 6 pilares:
 * 1. Compatibilidad de colores (teoría del color + paletas curadas)
 * 2. Compatibilidad de estilos (matrix de afinidad)
 * 3. Sinergia de subcategorías (reglas de moda real)
 * 4. Adaptación climática (temperatura + descripción del clima)
 * 5. Diversidad de uso (prioriza prendas menos usadas)
 * 6. Anti-repetición (evita sugerir el mismo outfit dos veces)
 *
 * v3.0: Shuffle aleatorio + jitter scoring + diversidad estricta
 */

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Fisher-Yates shuffle — mezcla un array in-place de forma uniforme
 */
function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

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
      if (subcategoriaClash(items[i].subcategoria, items[j].subcategoria)) {
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
    if (hasJacket || hasHoodie) score -= 0.3
    if (hasBoots) score -= 0.15
    return Math.max(0.1, Math.min(1, score))
  }

  // Templado (15-25°C)
  if (temp >= 15 && temp <= 25) {
    let score = 0.7
    if (hasTankTop && !hasJacket) score -= 0.1
    return Math.max(0.1, Math.min(1, score))
  }

  // Frío (<15°C)
  if (temp < 15) {
    let score = 0.5
    if (hasJacket || hasHoodie) score += 0.25
    if (hasBoots) score += 0.1
    if (hasTankTop) score -= 0.3
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
  const avg = useCounts.reduce((a, b) => a + b, 0) / useCounts.length
  return Math.max(0.3, 1 - (avg / (maxUse * 2)))
}

/**
 * Puntuación final compuesta con jitter aleatorio para romper empates
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

  // Jitter aleatorio ±5% para romper empates deterministas
  const jitter = (Math.random() - 0.5) * 0.10

  return Math.min(1, Math.max(0, baseScore + jitter))
}

// ═══════════════════════════════════════════════════════════
// SMART COMBINATION GENERATOR
// ═══════════════════════════════════════════════════════════

/**
 * Memoized color compatibility lookup.
 * Builds a Map keyed by "colorA|colorB" so each pair is computed at most once.
 */
function buildColorMemo(items) {
  const memo = new Map()
  const colors = [...new Set(items.map(i => i.color_principal).filter(Boolean))]
  for (let i = 0; i < colors.length; i++) {
    for (let j = i; j < colors.length; j++) {
      const key = colors[i] <= colors[j] ? `${colors[i]}|${colors[j]}` : `${colors[j]}|${colors[i]}`
      if (!memo.has(key)) {
        memo.set(key, colorCompatibility(colors[i], colors[j]))
      }
    }
  }
  return memo
}

function getColorCompat(memo, c1, c2) {
  if (!c1 || !c2) return 0.5
  const key = c1 <= c2 ? `${c1}|${c2}` : `${c2}|${c1}`
  if (memo.has(key)) return memo.get(key)
  const val = colorCompatibility(c1, c2)
  memo.set(key, val)
  return val
}

/**
 * Genera todas las combinaciones posibles (con límite inteligente)
 * y las evalúa para devolver las mejores.
 *
 * v3.1: Memoización de pares de color + poda temprana de clashes
 */
function generateCandidates(groups, weather, maxCandidates = 250) {
  const candidates = []

  // Pre-compute color compatibility memoization table
  const allItems = [
    ...(groups.superior || []),
    ...(groups.inferior || []),
    ...(groups.calzado || []),
    ...(groups.chamarra || []),
  ]
  const colorMemo = buildColorMemo(allItems)

  // Shuffle each group before limiting to vary candidates each time
  const tops = shuffle(groups.superior).slice(0, 10)
  const bottoms = shuffle(groups.inferior).slice(0, 10)
  const shoes = shuffle(groups.calzado).slice(0, 8)
  const jackets = shuffle(groups.chamarra || [])

  for (const top of tops) {
    for (const bottom of bottoms) {
      // ── EARLY PRUNING ──
      // If top+bottom have a critical color clash, skip ALL shoes for this pair
      const pairCompat = getColorCompat(colorMemo, top.color_principal, bottom.color_principal)
      if (pairCompat < 0.2) continue

      for (const shoe of shoes) {
        const baseItems = [top, bottom, shoe]

        // Evaluar combinación base (sin chamarra)
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
 * Selecciona los mejores outfits, asegurando diversidad REAL.
 *
 * v3.0: Diversidad estricta — evita repetir CUALQUIER prenda individual
 * entre outfits, con fallback gradual si no hay suficientes candidatos.
 */
function selectDiverseOutfits(candidates, count) {
  const selected = []
  const usedItemIds = new Set()

  // Fase 1: Estricta — ningún item repetido
  for (const candidate of candidates) {
    if (selected.length >= count) break

    const ids = candidate.items.map(i => i.id)
    const hasRepeat = ids.some(id => usedItemIds.has(id))

    if (!hasRepeat) {
      selected.push(candidate)
      ids.forEach(id => usedItemIds.add(id))
    }
  }

  // Fase 2: Relajada — permite 1 item repetido si no alcanzamos el count
  if (selected.length < count) {
    for (const candidate of candidates) {
      if (selected.length >= count) break
      if (selected.includes(candidate)) continue

      const ids = candidate.items.map(i => i.id)
      const repeatCount = ids.filter(id => usedItemIds.has(id)).length

      // Máximo 1 repetición permitida (ej: mismo zapato, distinto top+bottom)
      if (repeatCount <= 1) {
        selected.push(candidate)
        ids.forEach(id => usedItemIds.add(id))
      }
    }
  }

  // Fase 3: Fallback — rellenar con los mejores restantes sin restricción
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
// AUTO-EXPLANATION GENERATOR (v3.0 — pool expandido)
// ═══════════════════════════════════════════════════════════

const COLOR_LABELS = {
  negro: 'negro', blanco: 'blanco', gris: 'gris', beige: 'beige',
  azul: 'azul', azul_marino: 'azul marino', rojo: 'rojo', verde: 'verde',
  amarillo: 'amarillo', naranja: 'naranja', rosa: 'rosa', morado: 'morado',
  cafe: 'café', vino: 'vino', olivo: 'olivo', coral: 'coral',
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateExplanation(outfit) {
  const items = outfit.items
  const colors = [...new Set(items.map(i => COLOR_LABELS[i.color_principal] || i.color_principal).filter(Boolean))]
  const styles = [...new Set(items.flatMap(i => i.estilos || []))]
  const subs = items.map(i => i.subcategoria).filter(Boolean)
  const score = outfit.score

  // ── Razón ──
  const reasons = []

  // Explicar colores con variantes
  if (colors.length === 1) {
    reasons.push(pickRandom([
      `Look monocromático en ${colors[0]} que transmite cohesión y seguridad`,
      `Todo en ${colors[0]} para un efecto visual limpio y sofisticado`,
      `Paleta total ${colors[0]}: audaz y con personalidad`,
    ]))
  } else if (colors.length === 2) {
    reasons.push(pickRandom([
      `Paleta minimalista de ${colors.join(' y ')} que proyecta elegancia`,
      `Duo clásico de ${colors.join(' y ')}: equilibrado y fácil de llevar`,
      `${colors[0].charAt(0).toUpperCase() + colors[0].slice(1)} con ${colors[1]} es una combinación probada en moda`,
      `La armonía entre ${colors.join(' y ')} crea un look cohesivo y atemporal`,
    ]))
  } else if (colors.length === 3) {
    reasons.push(pickRandom([
      `Combinación equilibrada de ${colors.join(', ')} siguiendo la regla de los 3 colores`,
      `Trío armónico de ${colors.join(', ')} que aporta dinamismo sin saturar`,
      `${colors.join(', ')}: una paleta versátil que funciona en cualquier contexto`,
    ]))
  } else {
    reasons.push(pickRandom([
      `Mix creativo de ${colors.join(', ')} para un look expresivo`,
      `Paleta rica en ${colors.join(', ')} que demuestra confianza en el estilo`,
    ]))
  }

  // Explicar estilo con variantes
  if (styles.includes('formal') && styles.includes('casual')) {
    reasons.push(pickRandom([
      'fusiona lo formal con lo casual para un look smart-casual',
      'la mezcla formal/casual crea un equilibrio sofisticado pero accesible',
      'rompe la rigidez formal con toques casuales para un estilo moderno',
    ]))
  } else if (styles.includes('formal')) {
    reasons.push(pickRandom([
      'mantiene una línea formal y pulida',
      'transmite profesionalismo y atención al detalle',
      'ideal para proyectar autoridad y confianza',
    ]))
  } else if (styles.includes('urbano')) {
    reasons.push(pickRandom([
      'con un toque urbano y contemporáneo',
      'el estilo urbano le da personalidad y frescura',
      'un look street-style que se siente actual y auténtico',
    ]))
  } else if (styles.includes('deportivo')) {
    reasons.push(pickRandom([
      'cómodo y funcional para el movimiento',
      'athleisure: deportivo pero con estilo',
      'preparado para la acción sin sacrificar el look',
    ]))
  } else {
    reasons.push(pickRandom([
      'relajado y versátil para el día a día',
      'un look casual que funciona para cualquier plan',
      'comodidad ante todo, sin perder el estilo',
      'fácil de llevar y combinable con lo que ya tienes',
    ]))
  }

  // Explicar prendas clave
  const jacket = items.find(i => i.categoria === 'chamarra')
  if (jacket) {
    reasons.push(pickRandom([
      `la ${(jacket.subcategoria || 'chamarra').toLowerCase()} agrega estructura al look`,
      `la capa exterior en ${COLOR_LABELS[jacket.color_principal] || jacket.color_principal} eleva el conjunto`,
      `con la ${(jacket.subcategoria || 'chamarra').toLowerCase()} como pieza de transición`,
    ]))
  }

  const razon = reasons[0].charAt(0).toUpperCase() + reasons[0].slice(1) +
    (reasons.length > 1 ? ', ' + reasons.slice(1).join(' y ') : '') + '.'

  // ── Tip de estilo (pool expandido y contextual) ──
  const tips = []

  // Tips universales según score
  if (score >= 0.8) {
    tips.push(
      'Remanga las mangas para un aire más desenfadado.',
      'Añade un reloj minimalista para elevar el outfit.',
      'Lleva los colores claros arriba y oscuros abajo para estilizar la silueta.',
      'Un perfume que combine con la ocasión completa la experiencia del outfit.',
      'Lleva la confianza como accesorio principal — este look está bien armado.',
    )
  } else if (score >= 0.6) {
    tips.push(
      'Un cinturón del mismo tono que el calzado unificará todo el look.',
      'Enrolla el bajo del pantalón para mostrar el calzado y dar un toque moderno.',
      'Prueba meter la parte delantera de la playera dentro del pantalón (French tuck).',
      'Un accesorio pequeño (pulsera, anillo) puede hacer la diferencia.',
      'Si el outfit se siente plano, agrega textura con una bufanda o un suéter por encima.',
    )
  } else {
    tips.push(
      'Juega con accesorios (gorra, reloj, bufanda) para darle personalidad.',
      'Si te sientes inseguro, añade una prenda neutra (negra, blanca o gris) como capa.',
      'Recuerda: la confianza es el mejor accesorio. Luce lo que te haga sentir bien.',
      'A veces lo simple funciona mejor — no tengas miedo de lo básico.',
    )
  }

  // Tips contextuales por subcategoría
  if (subs.includes('Blazer')) {
    tips.push('Dobla las mangas del blazer hasta el antebrazo para un look más relajado pero pulido.')
  }
  if (subs.includes('Hoodie') && subs.includes('Jeans')) {
    tips.push('Unos tenis blancos completarían este look streetwear a la perfección.')
  }
  if (subs.includes('Camisa') && subs.includes('Jeans')) {
    tips.push('Este es un look smart-casual perfecto para una primera cita o un brunch.')
  }
  if (subs.includes('Playera') && subs.includes('Short')) {
    tips.push('Ideal para un día caluroso: cómodo, fresco y con estilo.')
  }
  if (subs.includes('Polo')) {
    tips.push('El polo es la prenda puente entre lo casual y lo elegante — úsalo a tu favor.')
  }
  if (subs.includes('Botas')) {
    tips.push('Las botas anclan visualmente el outfit — perfecto para climas frescos o looks con carácter.')
  }
  if (subs.includes('Chamarra') || subs.includes('Sudadera')) {
    tips.push('Deja la chamarra/sudadera abierta para mostrar la prenda de abajo y crear profundidad.')
  }
  if (subs.includes('Falda')) {
    tips.push('Juega con la proporción: si la falda es corta, arriba ve holgado; si es larga, arriba ajustado.')
  }
  if (subs.includes('Sandalias')) {
    tips.push('Las sandalias piden un look relajado — asegúrate de que el resto del outfit acompañe la vibra.')
  }

  const tip_estilo = pickRandom(tips)

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

