import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, requireUser, readJson, HttpError, json, failure } from '../_shared/http.ts'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const user = await requireUser(req)
    const body = await readJson(req, 1024)
    if (body.confirmacion !== 'ELIMINAR') throw new HttpError(400, 'Confirma la eliminación de tu cuenta.')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!serviceKey) throw new HttpError(503, 'La eliminación de cuenta no está configurada.')
    // The target always comes from the verified JWT, never from the request body.
    const headers = { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, 'Content-Type': 'application/json' }
    const readiness = await fetch(`${user.url}/rest/v1/rpc/delete_personal_records`, { method: 'POST', headers: user.headers, body: JSON.stringify({ dry_run: true }), signal: AbortSignal.timeout(10000) })
    if (!readiness.ok) throw new HttpError(503, 'La eliminación de cuenta todavía no está disponible.')
    const storage = async (bucket: string, prefix: string): Promise<void> => {
      const files: string[] = []
      const folders: string[] = []
      for (let offset = 0; ; offset += 100) {
        const response = await fetch(`${user.url}/storage/v1/object/list/${bucket}`, { method: 'POST', headers, body: JSON.stringify({ prefix, limit: 100, offset, sortBy: { column: 'name', order: 'asc' } }), signal: AbortSignal.timeout(10000) })
        if (!response.ok) throw new Error('Storage unavailable')
        const entries = await response.json()
        for (const entry of entries) {
          if (typeof entry.name !== 'string' || !entry.name || entry.name === '.' || entry.name === '..' || /[\\/]/.test(entry.name)) throw new Error('Invalid storage entry')
          const path = `${prefix}/${entry.name}`
          if (!path.startsWith(`${user.id}/`)) throw new Error('Invalid storage path')
          if (entry.id) files.push(path); else folders.push(path)
        }
        if (entries.length < 100) break
      }
      for (const folder of folders) await storage(bucket, folder)
      for (let start = 0; start < files.length; start += 100) {
        const response = await fetch(`${user.url}/storage/v1/object/${bucket}`, { method: 'DELETE', headers, body: JSON.stringify({ prefixes: files.slice(start, start + 100) }), signal: AbortSignal.timeout(10000) })
        if (!response.ok) throw new Error('Storage deletion failed')
      }
    }
    for (const bucket of ['prendas-fotos', 'avatares']) await storage(bucket, user.id)
    const purge = await fetch(`${user.url}/rest/v1/rpc/delete_personal_records`, { method: 'POST', headers: user.headers, body: JSON.stringify({ dry_run: false }), signal: AbortSignal.timeout(10000) })
    if (!purge.ok) throw new Error('Record deletion failed')
    const response = await fetch(`${user.url}/auth/v1/admin/users/${user.id}`, { method: 'DELETE', headers, signal: AbortSignal.timeout(10000) })
    if (!response.ok) throw new Error('Account deletion failed')
    return json({ success: true })
  } catch (error) { return failure(error) }
})
