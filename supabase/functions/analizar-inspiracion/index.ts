/// <reference path="../deno.d.ts" />
// supabase/functions/analizar-inspiracion/index.ts
// Edge Function: Analiza una foto de inspiración y extrae categorías, colores y estilos
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { requireUser, readJson, enforceQuota, failure, HttpError } from '../_shared/http.ts'
import { validateInspiration } from '../_shared/visionValidation.js'

// Declare Deno to satisfy TypeScript language server in any IDE configuration
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const user = await requireUser(req)
    const { imagen_base64, mime_type = 'image/jpeg' } = await readJson(req)
    if (typeof imagen_base64 !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(imagen_base64) || !['image/jpeg','image/png','image/webp'].includes(mime_type)) throw new HttpError(400, 'Imagen inválida.')
    await enforceQuota(user, 'analizar-inspiracion')

    if (!imagen_base64) {
      return new Response(
        JSON.stringify({ error: 'No se recibió imagen' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')
    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API key de OpenRouter no configurada en los Secrets de Supabase' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const prompt = `Analiza esta foto de moda/inspiración e identifica las prendas principales visibles.
    
Para CADA prenda importante que veas (por ejemplo: la camiseta, los pantalones, los zapatos, una chamarra), extrae su categoría, color y estilo.

CATEGORÍAS VÁLIDAS:
- "superior"
- "inferior"
- "calzado"
- "chamarra"
- "accesorio"

COLORES VÁLIDOS:
"negro", "blanco", "gris", "beige", "azul", "azul_marino", "rojo", "verde", "amarillo", "naranja", "rosa", "morado", "cafe", "vino", "olivo", "coral"

ESTILOS VÁLIDOS:
"casual", "formal", "urbano", "deportivo"

Responde ÚNICAMENTE con un JSON válido, siguiendo esta estructura exacta:
{
  "prendas_detectadas": [
    {
      "categoria": "superior",
      "color": "blanco",
      "estilo": "casual"
    },
    {
      "categoria": "inferior",
      "color": "azul",
      "estilo": "casual"
    }
  ],
  "estilo_general": "casual"
}`

    const models = [
      ...(Deno.env.get('OPENROUTER_VISION_MODEL') ? [Deno.env.get('OPENROUTER_VISION_MODEL')] : []),
      "openrouter/free"
    ]

    let response = null
    let lastError = ""
    let successfulModel = ""

    for (const model of models) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          signal: AbortSignal.timeout(12000),
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://outfitme.vercel.app",
            "X-Title": "OutfitMe - Analizar Inspiración"
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${mime_type};base64,${imagen_base64}`
                    }
                  }
                ]
              }
            ],
            temperature: 0.2,
            max_tokens: 500,
          })
        })

        if (res.ok) {
          response = res
          successfulModel = model
          break
        } else {
          await res.body?.cancel()
          lastError = `Modelo ${model} devolvió estado ${res.status}`
          console.warn(lastError)
        }
      } catch (err: any) {
        lastError = `Error de fetch para el modelo ${model}: ${err?.message || err}`
        console.error(lastError)
      }
    }

    if (!response) {
      return new Response(
        JSON.stringify({ error: 'No se pudo analizar la foto. Inténtalo de nuevo.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return new Response(
        JSON.stringify({ error: `La IA (${successfulModel}) no devolvió contenido.` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let resultado
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      resultado = JSON.parse(jsonStr)
    } catch {
      return new Response(
        JSON.stringify({ error: `La respuesta de la IA no tiene el formato JSON esperado.` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify(validateInspiration(resultado)),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return failure(error)
  }
})
