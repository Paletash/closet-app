import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let sessionGeneration = 0
const requests = new Set()
export function cancelSessionRequests() {
  sessionGeneration++
  for (const controller of requests) controller.abort()
  requests.clear()
}

async function sessionFetch(input, options = {}) {
  const generation = sessionGeneration
  const controller = new AbortController()
  requests.add(controller)
  const signal = options.signal ? AbortSignal.any([options.signal, controller.signal]) : controller.signal
  try {
    const response = await fetch(input, { ...options, signal })
    // Consume before checking the generation so a previous user's response cannot
    // repopulate a store after an account change.
    const body = await response.arrayBuffer()
    if (generation !== sessionGeneration) throw new DOMException('Sesión cambiada', 'AbortError')
    return new Response(response.status === 204 ? null : body, {
      status: response.status, statusText: response.statusText, headers: response.headers,
    })
  } finally { requests.delete(controller) }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { fetch: sessionFetch } })
