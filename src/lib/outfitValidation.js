export function eligibleClothes(clothes, season = '') {
  return clothes.filter(item => (item.estado || 'activa') === 'activa' && !item.sucia &&
    (!season || !item.temporadas?.length || item.temporadas.includes('todas') || item.temporadas.includes(season)))
}

export function missingCategories(clothes) {
  return ['superior', 'inferior', 'calzado'].filter(category => !clothes.some(item => item.categoria === category))
}

export function validateOutfitSelection(ids, clothes) {
  if (!Array.isArray(ids) || ids.length < 3 || ids.length > 5 || new Set(ids).size !== ids.length) {
    throw new Error('La recomendación no tiene una combinación completa y única.')
  }
  const available = new Map(eligibleClothes(clothes).map(item => [item.id, item]))
  const items = ids.map(id => available.get(id))
  if (items.some(item => !item) || missingCategories(items).length) {
    throw new Error('La recomendación contiene prendas no disponibles o está incompleta.')
  }
  for (const category of ['superior', 'inferior', 'calzado', 'chamarra']) {
    if (items.filter(item => item.categoria === category).length > 1) {
      throw new Error('La recomendación repite una categoría principal.')
    }
  }
  return items
}
