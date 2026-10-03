import test from 'node:test'
import assert from 'node:assert/strict'
import { parseMediaReference, mediaReference } from '../src/lib/mediaReference.js'
import { clearPersonalCaches } from '../src/lib/sessionCleanup.js'

const project = 'https://project.supabase.co'
test('legacy public photos and new private references resolve to the same object', () => {
  const expected = { bucket: 'prendas-fotos', path: 'user/ropa blanca.jpg' }
  assert.deepEqual(parseMediaReference(`${project}/storage/v1/object/public/prendas-fotos/user/ropa%20blanca.jpg`, project), expected)
  assert.deepEqual(parseMediaReference(mediaReference(expected.bucket, expected.path), project), expected)
  assert.equal(parseMediaReference('https://another-project.supabase.co/storage/v1/object/public/prendas-fotos/u/x.jpg', project), null)
  assert.equal(parseMediaReference('storage://unknown/user/x.jpg', project), null)
  assert.throws(() => mediaReference('avatares', '../other.jpg'))
})
test('logout purges only personal caches and local preferences', async () => {
  const removed = []
  const cleared = []
  globalThis.caches = { keys: async () => ['supabase-api','supabase-images','workbox-precache'], delete: async key => removed.push(key) }
  globalThis.sessionStorage = { removeItem: key => cleared.push(key) }
  globalThis.localStorage = { removeItem: key => cleared.push(key) }
  try {
    await clearPersonalCaches()
    assert.deepEqual(removed, ['supabase-api','supabase-images'])
    assert.ok(cleared.includes('outfitme_weather'))
    assert.ok(!cleared.includes('outfitme_theme'))
  } finally { delete globalThis.caches; delete globalThis.sessionStorage; delete globalThis.localStorage }
})
