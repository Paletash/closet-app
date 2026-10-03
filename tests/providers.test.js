import test from 'node:test'
import assert from 'node:assert/strict'
import { providerRequest, parseProviderResult } from '../supabase/functions/_shared/outfitProvider.js'

test('an OpenRouter key is never sent to Google', () => {
  const request = providerRequest({ openrouterKey: 'router-test-secret' }, 'outfit')
  assert.equal(new URL(request.url).hostname, 'openrouter.ai')
  assert.equal(request.headers.Authorization, 'Bearer router-test-secret')
  assert.ok(!request.url.includes('router-test-secret'))
})
test('Gemini authenticates by header and supports configurable models', () => {
  const request = providerRequest({ geminiKey: 'google-test-secret', openrouterKey: 'router', geminiModel: 'test-model' }, 'outfit')
  assert.equal(request.headers['x-goog-api-key'], 'google-test-secret')
  assert.equal(request.headers.Authorization, undefined)
  assert.ok(request.url.endsWith('/test-model:generateContent'))
  assert.ok(!request.url.includes('google-test-secret'))
  assert.equal(providerRequest({}, ''), null)
})
test('server rejects hallucinated or duplicated IDs even if provider returns valid JSON', () => {
  const inventory = [{ id: '1', categoria: 'superior' }, { id: '2', categoria: 'inferior' }, { id: '3', categoria: 'calzado' }]
  const response = ids => ({ choices: [{ message: { content: JSON.stringify({ prendas_seleccionadas: ids, razon: 'Colores neutros', tip_estilo: 'Combina' }) } }] })
  assert.deepEqual(parseProviderResult(response(['1','2','3']), 'openrouter', inventory).prendas_seleccionadas, ['1','2','3'])
  assert.throws(() => parseProviderResult(response(['1','2','4']), 'openrouter', inventory))
  assert.throws(() => parseProviderResult(response(['1','1','3']), 'openrouter', inventory))
  assert.throws(() => parseProviderResult(response(['1','2','3']), 'openrouter', inventory.map(item => ({ ...item, estado: 'donada' }))))
})
