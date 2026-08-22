/// <reference path="../deno.d.ts" />
// supabase/functions/analizar-inspiracion/index.ts
// Edge Function: Analiza una foto de inspiración y extrae categorías, colores y estilos
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { imagen_base64 } = await req.json()

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
      "openrouter/free",
      "meta-llama/llama-3.2-11b-vision-instruct:free",
      "qwen/qwen2.5-vl-72b-instruct:free"
    ]

    let response = null
    let lastError = ""
    let successfulModel = ""

    for (const model of models) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
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
                      url: `data:image/jpeg;base64,${imagen_base64}`
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
          const errText = await res.text()
          lastError = `Modelo ${model} devolvió estado ${res.status}: ${errText}`
          console.warn(lastError)
        }
      } catch (err: any) {
        lastError = `Error de fetch para el modelo ${model}: ${err?.message || err}`
        console.error(lastError)
      }
    }

    if (!response) {
      return new Response(
        JSON.stringify({ error: `No se pudo analizar la foto. Errores: ${lastError}` }),
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
      JSON.stringify(resultado),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: `Error interno: ${error?.message || error}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
