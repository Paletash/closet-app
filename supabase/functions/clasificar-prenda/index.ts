/// <reference path="../deno.d.ts" />
// supabase/functions/clasificar-prenda/index.ts
// Edge Function: Clasifica una prenda de ropa usando IA de Visión (OpenRouter)
// Recibe una imagen en base64 y devuelve categoría, subcategoría, color y estilo detectados
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { requireUser, readJson, enforceQuota, failure, HttpError } from '../_shared/http.ts'
import { validateClassification } from '../_shared/visionValidation.js'

// Declare Deno to satisfy TypeScript language server in any IDE configuration
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const user = await requireUser(req)
    const { imagen_base64, mime_type = 'image/jpeg' } = await readJson(req)
    if (typeof imagen_base64 !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(imagen_base64) || !['image/jpeg','image/png','image/webp'].includes(mime_type)) throw new HttpError(400, 'Imagen inválida.')
    await enforceQuota(user, 'clasificar-prenda')

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

    // Vision prompt with strict category mapping
    const prompt = `Analiza esta foto de una prenda de ropa y clasifícala.

CATEGORÍAS VÁLIDAS (usa EXACTAMENTE estos valores):
- "superior" → para playeras, camisas, polos, blusas, hoodies, tank tops
- "inferior" → para pantalones, jeans, joggers, shorts, faldas, bermudas
- "calzado" → para tenis, zapatos, botas, sandalias, mocasines
- "chamarra" → para chamarras, abrigos, chalecos, blazers, sudaderas con cierre, suéteres
- "accesorio" → para gorras, relojes, lentes, bufandas, cinturones, bolsas, mochilas

SUBCATEGORÍAS VÁLIDAS por categoría:
- superior: "playera", "camisa", "polo", "blusa", "hoodie", "tank top"
- inferior: "pantalón", "jeans", "jogger", "short", "falda", "bermuda"
- calzado: "tenis", "zapatos", "botas", "sandalias", "mocasines"
- chamarra: "chamarra", "abrigo", "chaleco", "blazer", "sudadera", "sueter"
- accesorio: "gorra", "reloj", "lentes", "bufanda", "cinturón", "bolsa", "mochila"

COLORES VÁLIDOS (usa EXACTAMENTE estos valores):
"negro", "blanco", "gris", "beige", "azul", "azul_marino", "rojo", "verde", "amarillo", "naranja", "rosa", "morado", "cafe", "vino", "olivo", "coral"

ESTILOS VÁLIDOS:
"casual", "formal", "urbano", "deportivo"

Responde ÚNICAMENTE con un JSON válido (sin markdown, sin explicación):
{
  "categoria": "valor_exacto",
  "subcategoria": "valor_exacto",
  "color_principal": "valor_exacto",
  "estilos": ["estilo1"],
  "confianza": 0.95
}`

    // Multi-model fallback sequence for maximum robustness
    const models = [
      ...(Deno.env.get('OPENROUTER_VISION_MODEL') ? [Deno.env.get('OPENROUTER_VISION_MODEL')] : []),
      "openrouter/free"
    ]

    let response = null
    let lastError = ""
    let successfulModel = ""

    for (const model of models) {
      try {
        console.log(`Intentando clasificar prenda con el modelo: ${model}`)
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          signal: AbortSignal.timeout(12000),
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://outfitme.vercel.app",
            "X-Title": "OutfitMe - Clasificación de Prenda"
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
            max_tokens: 300,
          })
        })

        if (res.ok) {
          response = res
          successfulModel = model
          console.log(`Clasificación exitosa con el modelo: ${model}`)
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
        JSON.stringify({ error: 'No se pudo clasificar la prenda. Puedes completar sus datos manualmente.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return new Response(
        JSON.stringify({ error: `La IA (${successfulModel}) no devolvió contenido en la respuesta.` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse the JSON response (handle potential markdown wrapping)
    let resultado
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      resultado = JSON.parse(jsonStr)
    } catch {
      console.error(`Formato de respuesta inválido (${successfulModel})`)
      return new Response(
        JSON.stringify({ error: `La respuesta de la IA no tiene el formato JSON esperado.` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    resultado = validateClassification(resultado)

    // Agregar el modelo exitoso al resultado para feedback visual si se desea
    resultado.modelo_usado = successfulModel

    return new Response(
      JSON.stringify(resultado),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return failure(error)
  }
})
