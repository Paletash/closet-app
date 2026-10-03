// Offline UI regression test. Build with https://outfitme.test + test-public-key first.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
const { chromium } = await import(process.env.OUTFITME_PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.env.OUTFITME_BROWSER_CHANNEL ? { channel: process.env.OUTFITME_BROWSER_CHANNEL } : {}) })
const output = process.env.OUTFITME_QA_OUTPUT || 'qa-output'
await fs.mkdir(output, { recursive: true })
const user = { id: '11111111-1111-4111-8111-111111111111', email: 'qa@example.test', aud: 'authenticated', role: 'authenticated', user_metadata: { nombre: 'Prueba' } }
const profile = { id: user.id, nombre: 'Prueba', estilo: 'casual', onboarding_completado: true }
const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now()/1000)+3600, role: 'authenticated' })).toString('base64url')}.test`
const session = { access_token: token, refresh_token: 'test-refresh', expires_in: 3600, expires_at: Math.floor(Date.now()/1000)+3600, token_type: 'bearer', user }
const clothes = []
const outfits = []
const relations = []
const runtimeErrors = []
let savedPayload
let aiMode = 'fallback'
let failSave = false
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="#f5f3ff"/><path d="M120 90L170 65H230L280 90L330 180L280 210L265 170V420H135V170L120 210L70 180Z" fill="#6c63ff"/></svg>'
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' })
const page = await context.newPage()
page.on('pageerror', error => runtimeErrors.push(error.message))
await context.route('**/*', async route => {
  const url = new URL(route.request().url())
  if (url.hostname === '127.0.0.1') return route.continue()
  if (url.hostname !== 'outfitme.test') return route.abort()
  const request = route.request()
  const body = () => request.postDataJSON()
  const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(data) })
  if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' } })
  if (url.pathname.includes('/auth/v1/token')) return reply(session)
  if (url.pathname.includes('/auth/v1/logout')) return reply({})
  if (url.pathname.includes('/auth/v1/user')) return reply(user)
  if (url.pathname.includes('/storage/v1/object/sign/')) {
    if (request.method() === 'POST') return reply({ signedURL: url.pathname.replace('/storage/v1', '') + '?token=test' })
    return route.fulfill({ contentType: 'image/svg+xml', body: svg })
  }
  if (url.pathname.includes('/storage/v1/object/')) return reply({ Key: url.pathname.split('/object/')[1], Id: randomUUID() })
  if (url.pathname.includes('/functions/v1/generar-outfit')) return reply(aiMode === 'fallback'
    ? { fallback: true, error: 'Offline test' }
    : { prendas_seleccionadas: clothes.map(item => item.id), razon: 'Tus prendas reales combinan por color.', tip_estilo: 'Lleva la camisa abierta.' })
  const table = url.pathname.split('/rest/v1/')[1]
  if (table === 'profiles') {
    if (request.method() === 'PATCH') Object.assign(profile, body())
    return reply(profile)
  }
  if (table === 'prendas') {
    if (request.method() === 'POST') {
      const item = { ...body(), id: randomUUID(), creado_en: new Date().toISOString(), estado: 'activa', sucia: false, veces_usado: 0 }
      clothes.unshift(item)
      return reply(item, 201)
    }
    return reply(clothes)
  }
  if (table === 'outfits') {
    if (request.method() === 'POST') {
      if (failSave) { failSave = false; return reply({ message: 'Simulated save failure' }, 500) }
      savedPayload = body()
      const outfit = { ...savedPayload, id: randomUUID(), creado_en: new Date().toISOString() }
      outfits.unshift(outfit)
      return reply(outfit, 201)
    }
    return reply(outfits.map(outfit => ({ ...outfit, outfit_prendas: relations.filter(relation => relation.outfit_id === outfit.id).map(relation => ({ prendas: clothes.find(item => item.id === relation.prenda_id) })) })))
  }
  if (table === 'outfit_prendas') { if (request.method() === 'POST') relations.push(...body()); return reply([]) }
  if (['historial_usos','viajes','wishlist','looks_del_dia'].includes(table)) return reply([])
  throw new Error(`Unexpected mock request: ${request.method()} ${url.pathname}`)
})
try {
  await page.goto('http://127.0.0.1:4173/')
  await page.getByPlaceholder('tu@email.com').fill(user.email)
  await page.getByPlaceholder('••••••••').fill('test-password')
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
  await page.getByRole('heading', { name: 'Tu primer outfit, con tu propia ropa' }).waitFor()
  await page.screenshot({ path: `${output}/inicio-movil.png`, fullPage: true, animations: 'disabled' })
  await page.getByRole('link', { name: 'Agregar mis prendas' }).click()
  await page.locator('input[type=file][multiple]').setInputFiles(['camisa','pantalon','zapatos'].map(name => ({ name: `${name}.svg`, mimeType: 'image/svg+xml', buffer: Buffer.from(svg) })))
  await page.getByText('Después de esta quedan 2 fotos por revisar.').waitFor()
  for (const [index, category] of ['superior','inferior','calzado'].entries()) {
    await page.getByLabel('Categoría *', { exact: true }).selectOption(category)
    await page.getByRole('button', { name: index < 2 ? 'Guardar y revisar la siguiente' : 'Guardar prenda', exact: true }).click()
    if (index === 0) await page.getByText('Después de esta quedan 1 fotos por revisar.').waitFor()
    if (index === 1) await page.getByRole('button', { name: 'Guardar prenda', exact: true }).waitFor()
  }
  await page.waitForURL('**/closet')
  assert.equal(clothes.length, 3)
  assert.ok(clothes.every(item => item.foto_url.startsWith('storage://')))
  await page.goto('http://127.0.0.1:4173/outfit/generate')
  await page.getByRole('button', { name: 'Generar con IA', exact: true }).click()
  await page.getByText('Combinación local', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Guardar', exact: true }).click()
  await page.getByText('¡Outfit guardado!', { exact: true }).waitFor()
  assert.equal(savedPayload.generado_por_ia, false)
  assert.equal(savedPayload.user_id, user.id)
  await page.screenshot({ path: `${output}/outfit-movil.png`, fullPage: true, animations: 'disabled' })
  await page.getByRole('button', { name: 'Modo Swipe (Comparador)', exact: true }).click()
  await page.getByRole('button', { name: 'Guardar outfit en favoritos', exact: true }).waitFor()
  await page.screenshot({ path: `${output}/comparador-movil.png`, fullPage: true, animations: 'disabled' })
  failSave = true
  const card = page.locator('.touch-none').last()
  const cardBox = await card.boundingBox()
  await page.mouse.move(cardBox.x + 80, cardBox.y + 120)
  await page.mouse.down()
  await page.mouse.move(cardBox.x + 220, cardBox.y + 120, { steps: 8 })
  await page.mouse.up()
  await page.getByText('No se pudo completar la acción. Puedes intentarlo de nuevo.', { exact: true }).waitFor()
  await page.waitForFunction(() => [...document.querySelectorAll('.touch-none')].some(card => new DOMMatrix(getComputedStyle(card).transform).m41 === 0))
  await page.getByRole('button', { name: 'Guardar outfit en favoritos', exact: true }).click()
  await page.getByText('Outfit guardado en favoritos', { exact: true }).waitFor()
  assert.equal(savedPayload.es_favorito, true)
  assert.equal(savedPayload.generado_por_ia, false)
  assert.equal(savedPayload.user_id, user.id)
  await page.goto('http://127.0.0.1:4173/outfits')
  await page.locator('img').first().waitFor()
  await page.waitForFunction(() => [...document.querySelectorAll('img')].some(image => image.complete && image.naturalWidth > 0 && image.src.includes('/object/sign/')))
  assert.equal(outfits.length, 2)
  aiMode = 'success'
  await page.goto('http://127.0.0.1:4173/outfit/generate')
  await page.getByRole('button', { name: 'Generar con IA', exact: true }).click()
  await page.getByText('Tus prendas reales combinan por color.', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Guardar', exact: true }).click()
  await page.getByText('¡Outfit guardado!', { exact: true }).waitFor()
  assert.equal(savedPayload.generado_por_ia, true)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.screenshot({ path: `${output}/outfit-escritorio.png`, fullPage: true, animations: 'disabled' })
  await page.goto('http://127.0.0.1:4173/profile')
  const deleteButton = page.getByRole('button', { name: 'Eliminar mi cuenta', exact: true })
  if (await deleteButton.isEnabled()) {
    await deleteButton.click()
    assert.equal(await page.getByRole('button', { name: 'Eliminar permanentemente', exact: true }).isDisabled(), true)
  } else await page.getByText('La eliminación de cuenta aún no está habilitada.', { exact: false }).waitFor()
  await page.getByRole('button', { name: 'Cerrar Sesión', exact: true }).click()
  await page.waitForURL('**/login')
  assert.deepEqual(runtimeErrors, [])
  console.log('UI PASS: mobile onboarding guide, 3-photo import, private image display, fallback, save, failed swipe retry, favorites, AI provenance, deletion gate and logout. All external requests mocked.')
} finally { await browser.close() }
