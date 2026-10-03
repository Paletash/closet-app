import test from 'node:test'
import assert from 'node:assert/strict'
import { validateClassification, validateInspiration } from '../supabase/functions/_shared/visionValidation.js'

test('classification returns only bounded recognized fields', () => {
  assert.throws(() => validateClassification(null))
  assert.throws(() => validateClassification({ categoria: 'inventada' }))
  assert.deepEqual(validateClassification({ categoria: 'superior', estilos: 'not-an-array', confianza: 99, extra: 'ignored' }), {
    categoria: 'superior', subcategoria: null, color_principal: null, estilos: [], confianza: 1,
  })
})
test('inspiration rejects malformed collections and discards unknown categories', () => {
  assert.throws(() => validateInspiration({ prendas_detectadas: 'bad' }))
  assert.deepEqual(validateInspiration({ prendas_detectadas: [null, { categoria: 'inventada' }, { categoria: 'superior', color: 'blanco', estilo: 'casual' }] }).prendas_detectadas,
    [{ categoria: 'superior', color: 'blanco', estilo: 'casual' }])
})
