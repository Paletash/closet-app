// supabase/functions/clasificar-prenda/index.ts
// Edge Function: Clasifica una prenda de ropa usando IA de Visión (OpenRouter)
// Recibe una imagen en base64 y devuelve categoría, subcategoría, color y estilo detectados
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
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

    // Vision prompt with strict category mapping
    const prompt = `Analiza esta foto de una prenda de ropa y clasifícala.

CATEGORÍAS VÁLIDAS (usa EXACTAMENTE estos valores):
- "superior" → para playeras, camisas, polos, blusas, sweaters, hoodies, tank tops
- "inferior" → para pantalones, jeans, joggers, shorts, faldas, bermudas
- "calzado" → para tenis, zapatos, botas, sandalias, mocasines
- "chamarra" → para chamarras, abrigos, chalecos, blazers, sudaderas con cierre
- "accesorio" → para gorras, relojes, lentes, bufandas, cinturones, bolsas, mochilas

SUBCATEGORÍAS VÁLIDAS por categoría:
- superior: "playera", "camisa", "polo", "blusa", "sweater", "hoodie", "tank top"
- inferior: "pantalón", "jeans", "jogger", "short", "falda", "bermuda"
- calzado: "tenis", "zapatos", "botas", "sandalias", "mocasines"
- chamarra: "chamarra", "abrigo", "chaleco", "blazer", "sudadera"
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
      "openrouter/free",
      "meta-llama/llama-3.2-11b-vision-instruct:free",
      "qwen/qwen2.5-vl-72b-instruct:free"
    ]

    let response = null
    let lastError = ""
    let successfulModel = ""

    for (const model of models) {
      try {
        console.log(`Intentando clasificar prenda con el modelo: ${model}`)
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
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
                      url: `data:image/jpeg;base64,${imagen_base64}`
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
          const errText = await res.text()
          lastError = `Modelo ${model} devolvió estado ${res.status}: ${errText}`
          console.warn(lastError)
        }
      } catch (err) {
        lastError = `Error de fetch para el modelo ${model}: ${err.message}`
        console.error(lastError)
      }
    }

    if (!response) {
      return new Response(
        JSON.stringify({ error: `No se pudo clasificar la prenda. Errores de los modelos: ${lastError}` }),
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
      console.error(`Error al parsear respuesta de IA (${successfulModel}):`, content)
      return new Response(
        JSON.stringify({ error: `La respuesta de la IA no tiene el formato JSON esperado.` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate that returned values are within allowed options
    const validCategorias = ['superior', 'inferior', 'calzado', 'chamarra', 'accesorio']
    const validColores = ['negro', 'blanco', 'gris', 'beige', 'azul', 'azul_marino', 'rojo', 'verde', 'amarillo', 'naranja', 'rosa', 'morado', 'cafe', 'vino', 'olivo', 'coral']
    const validEstilos = ['casual', 'formal', 'urbano', 'deportivo']

    if (!validCategorias.includes(resultado.categoria)) {
      resultado.categoria = null
    }
    if (resultado.color_principal && !validColores.includes(resultado.color_principal)) {
      resultado.color_principal = null
    }
    if (resultado.estilos) {
      resultado.estilos = resultado.estilos.filter((e: string) => validEstilos.includes(e))
    }

    // Agregar el modelo exitoso al resultado para feedback visual si se desea
    resultado.modelo_usado = successfulModel

    return new Response(
      JSON.stringify(resultado),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error general en la Edge Function:', error)
    return new Response(
      JSON.stringify({ error: `Error interno de servidor: ${error.message}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
