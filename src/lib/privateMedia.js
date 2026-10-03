import { supabase } from './supabase'
import { parseMediaReference } from './mediaReference'

const signed = new Map()
let generation = 0
export function clearPrivateMedia() { generation++; signed.clear() }

export async function resolvePhoto(value) {
  const reference = parseMediaReference(value, import.meta.env.VITE_SUPABASE_URL)
  if (!reference) return value?.startsWith('storage:') ? '' : value
  const key = `${reference.bucket}/${reference.path}`
  const cached = signed.get(key)
  if (cached && cached.expires > Date.now() + 30000) return cached.url
  const current = generation
  const { data, error } = await supabase.storage.from(reference.bucket).createSignedUrl(reference.path, 300)
  if (error || current !== generation) throw new Error('No se pudo cargar la foto privada.')
  signed.set(key, { url: data.signedUrl, expires: Date.now() + 300000 })
  return data.signedUrl
}

export async function deletePhoto(value) {
  const reference = parseMediaReference(value, import.meta.env.VITE_SUPABASE_URL)
  if (!reference) return
  const { error } = await supabase.storage.from(reference.bucket).remove([reference.path])
  if (error) throw error
  signed.delete(`${reference.bucket}/${reference.path}`)
}
