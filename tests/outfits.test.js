import test from 'node:test'
import assert from 'node:assert/strict'
import { generateOutfits } from '../src/lib/outfitEngine.js'
import { eligibleClothes, missingCategories, validateOutfitSelection } from '../src/lib/outfitValidation.js'
import { generateCapsule } from '../src/lib/capsuleEngine.js'

const wardrobe = [
  { id: 'top', categoria: 'superior', subcategoria: 'camisa', color_principal: 'blanco', estilos: ['casual'] },
  { id: 'bottom', categoria: 'inferior', subcategoria: 'jeans', color_principal: 'azul', estilos: ['casual'] },
  { id: 'shoes', categoria: 'calzado', subcategoria: 'tenis', color_principal: 'blanco', estilos: ['casual'] },
]
test('validates complete outfits against the actual available wardrobe', () => {
  assert.deepEqual(validateOutfitSelection(['top','bottom','shoes'], wardrobe), wardrobe)
  for (const ids of [['top','top','shoes'], ['top','bottom'], ['top','bottom','unknown']]) {
    assert.throws(() => validateOutfitSelection(ids, wardrobe))
  }
  assert.throws(() => validateOutfitSelection(['top','bottom','shoes'], wardrobe.map(item => ({ ...item, sucia: true }))))
})
test('season and availability apply equally to remote and local recommendations', () => {
  assert.deepEqual(eligibleClothes([{ id: 1, temporadas: ['invierno'] }, { id: 2, temporadas: ['todas'] }, { id: 3, estado: 'en_venta' }, { id: 4, sucia: true }], 'verano').map(item => item.id), [2])
  assert.deepEqual(missingCategories(wardrobe.slice(0, 2)), ['calzado'])
})
test('local engine preserves photos and never offers dirty or archived clothing', () => {
  const clothes = [...wardrobe.map(item => ({ ...item, foto_url: `storage://prendas-fotos/u/${item.id}.jpg` })),
    { ...wardrobe[0], id: 'dirty', sucia: true }, { ...wardrobe[1], id: 'donated', estado: 'donada' }]
  const before = JSON.stringify(clothes)
  const { outfits, error } = generateOutfits(clothes, {}, 3, { temperatura: 0 })
  assert.equal(error, null)
  assert.ok(outfits.length > 0)
  for (const outfit of outfits) {
    assert.ok(!outfit.prendaIds.includes('dirty') && !outfit.prendaIds.includes('donated'))
    for (const item of outfit.items) assert.equal(item.foto_url, clothes.find(original => original.id === item.id).foto_url)
    assert.ok(outfit.razon)
  }
  assert.equal(JSON.stringify(clothes), before)
})
test('empty closets return actionable missing categories', () => {
  assert.deepEqual(generateOutfits([]).missing, { superior: true, inferior: true, calzado: true })
})
test('capsules exclude sold and donated items', () => {
  const result = generateCapsule([...wardrobe, { ...wardrobe[0], id: 'sold', estado: 'en_venta' }])
  assert.ok(!result.capsule.some(item => item.id === 'sold'))
})
