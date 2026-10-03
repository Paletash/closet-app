import test from 'node:test'
import assert from 'node:assert/strict'
import { requireUser, readJson, enforceQuota, failure } from '../supabase/functions/_shared/http.ts'

test('functions reject unauthenticated calls before contacting providers', async () => {
  await assert.rejects(requireUser(new Request('https://local.test', { method: 'POST' })), error => error.status === 401)
  await assert.rejects(requireUser(new Request('https://local.test')), error => error.status === 405)
})
test('body parser bounds streamed input and rejects malformed JSON', async () => {
  const request = body => new Request('https://local.test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
  assert.deepEqual(await readJson(request('{"ok":true}')), { ok: true })
  await assert.rejects(readJson(request('{broken}')), error => error.status === 400)
  await assert.rejects(readJson(request('null')), error => error.status === 400)
  await assert.rejects(readJson(request('[]')), error => error.status === 400)
  await assert.rejects(readJson(request('123456'), 3), error => error.status === 413)
})
test('quota denial and unknown errors do not leak provider details', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => new Response('false', { status: 200 })
  try {
    await assert.rejects(enforceQuota({ url: 'https://local.test', headers: {}, id: 'test' }, 'generar-outfit'), error => error.status === 429)
    const result = failure(new Error('secret-provider-details'))
    assert.equal(result.status, 502)
    assert.ok(!(await result.text()).includes('secret-provider-details'))
  } finally { globalThis.fetch = original }
})
