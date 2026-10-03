export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}
export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
}
export function failure(error: unknown) {
  return json({ error: error instanceof HttpError ? error.message : 'No se pudo completar la solicitud.' }, error instanceof HttpError ? error.status : 502)
}
export async function requireUser(req: Request) {
  if (req.method !== 'POST') throw new HttpError(405, 'Método no permitido.')
  const authorization = req.headers.get('Authorization') || ''
  if (!authorization.startsWith('Bearer ')) throw new HttpError(401, 'Inicia sesión para continuar.')
  const url = Deno.env.get('SUPABASE_URL')!
  const apikey = Deno.env.get('SUPABASE_ANON_KEY')!
  const response = await fetch(`${url}/auth/v1/user`, { headers: { Authorization: authorization, apikey }, signal: AbortSignal.timeout(8000) })
  if (!response.ok) throw new HttpError(401, 'Tu sesión expiró. Vuelve a iniciar sesión.')
  const user = await response.json()
  if (!user.id) throw new HttpError(401, 'Sesión inválida.')
  return { id: user.id as string, url, headers: { Authorization: authorization, apikey, 'Content-Type': 'application/json' } }
}
export async function readJson(req: Request, maxBytes = 6_000_000) {
  if (!req.headers.get('Content-Type')?.includes('application/json')) throw new HttpError(415, 'Envía datos JSON.')
  const reader = req.body?.getReader()
  if (!reader) throw new HttpError(400, 'Faltan datos.')
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.length
    if (size > maxBytes) { await reader.cancel(); throw new HttpError(413, 'La imagen es demasiado grande.') }
    chunks.push(value)
  }
  const body = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length }
  try {
    const parsed = JSON.parse(new TextDecoder().decode(body))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Expected object')
    return parsed
  } catch { throw new HttpError(400, 'Datos inválidos.') }
}
export async function enforceQuota(user: Awaited<ReturnType<typeof requireUser>>, action: string) {
  const response = await fetch(`${user.url}/rest/v1/rpc/consume_ai_quota`, {
    method: 'POST', headers: user.headers, body: JSON.stringify({ action_name: action }), signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new HttpError(503, 'El servicio todavía no está disponible. Puedes continuar de forma manual.')
  if (await response.json() !== true) throw new HttpError(429, 'Llegaste al límite por hora. Inténtalo más tarde.')
}
