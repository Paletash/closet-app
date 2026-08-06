
const NEUTRAL_COLORS = ['negro', 'blanco', 'gris', 'beige', 'azul_marino']

/**
 * Calcula un "score de versatilidad" base para una prenda.
 * Las prendas neutrales, multi-estilo y muy usadas obtienen mayor puntaje
 * ya que son ideales para un armario cápsula.
 */
function calculateVersatility(item) {
  let score = 0
  // Bono por color neutral (combina con casi todo)
  if (NEUTRAL_COLORS.includes(item.color_principal)) score += 2
  
  // Bono por múltiples estilos
  if (item.estilos && item.estilos.length > 0) {
    score += (item.estilos.length * 0.5)
  }
  
  // Bono por uso (favoritos del usuario)
  if (item.veces_usado) {
    score += Math.min(item.veces_usado * 0.1, 3) // Cap a 3 puntos
  }
  
  // Bono por ser atemporal
  if (item.temporadas && item.temporadas.includes('todas')) {
    score += 1.5
  }
  
  return score
}

/**
 * Genera un armario cápsula seleccionando las prendas más versátiles
 * y distribuyéndolas lógicamente por categoría.
 */
export function generateCapsule(clothes, options = {}) {
  const { targetSize = 30, temporada = null } = options
  
  // Filtrar por temporada si se especifica
  let available = clothes
  if (temporada) {
    available = available.filter(item => 
      !item.temporadas?.length || 
      item.temporadas.includes(temporada) || 
      item.temporadas.includes('todas')
    )
  }

  // Calcular puntaje de versatilidad
  const scoredItems = available.map(item => ({
    ...item,
    vScore: calculateVersatility(item)
  }))

  // Agrupar por categoría
  const groups = { superior: [], inferior: [], calzado: [], chamarra: [], accesorio: [] }
  for (const item of scoredItems) {
    if (groups[item.categoria]) {
      groups[item.categoria].push(item)
    }
  }

  // Ordenar cada grupo de más a menos versátil
  Object.keys(groups).forEach(cat => {
    groups[cat].sort((a, b) => b.vScore - a.vScore)
  })

  // Definir distribución ideal basada en el tamaño objetivo
  // Proporción aproximada: 33% tops, 23% bottoms, 16% calzado, 14% chamarras, 14% accesorios
  const factor = targetSize / 30
  const targets = {
    superior: Math.max(1, Math.round(10 * factor)),
    inferior: Math.max(1, Math.round(7 * factor)),
    calzado: Math.max(1, Math.round(5 * factor)),
    chamarra: Math.max(0, Math.round(4 * factor)),
    accesorio: Math.max(0, Math.round(4 * factor)),
  }

  const capsule = []
  const excluded = []

  // Seleccionar prendas respetando los targets (o tomando todas si hay menos)
  Object.keys(targets).forEach(cat => {
    const target = targets[cat]
    const items = groups[cat]
    
    capsule.push(...items.slice(0, target))
    excluded.push(...items.slice(target))
  })

  // Calcular métricas del capsule
  const tops = capsule.filter(i => i.categoria === 'superior').length
  const bottoms = capsule.filter(i => i.categoria === 'inferior').length
  const shoes = capsule.filter(i => i.categoria === 'calzado').length
  
  // Una estimación realista de combinaciones (no todos los tops van con todos los bottoms, asumimos 70% de compatibilidad)
  const combinations = Math.round(tops * bottoms * shoes * 0.7)

  // Recopilar cobertura
  const styles = new Set()
  const seasons = new Set()
  capsule.forEach(item => {
    item.estilos?.forEach(s => styles.add(s))
    item.temporadas?.forEach(s => seasons.add(s))
  })

  return {
    capsule,
    excluded,
    stats: {
      combinations: Math.max(0, combinations),
      stylesCovered: Array.from(styles),
      seasonsCovered: Array.from(seasons),
      totalValue: capsule.reduce((sum, item) => sum + (typeof item.precio === 'number' ? item.precio : 0), 0)
    }
  }
}
