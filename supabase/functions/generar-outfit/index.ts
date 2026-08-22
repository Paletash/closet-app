/// <reference path="../deno.d.ts" />
// supabase/functions/generar-outfit/index.ts
// Edge Function: Genera sugerencias de outfit usando Gemini / OpenRouter API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Declare Deno to satisfy the TypeScript compiler in standard VS Code configurations
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
    const { prendas, ocasion, clima, estilo_usuario } = await req.json()

    if (!prendas || prendas.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No se recibieron prendas' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('OPENROUTER_API_KEY')
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API key no configurada', fallback: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build the prompt
    const prendasResumen = prendas.map((p: any) => ({
      id: p.id,
      categoria: p.categoria,
      subcategoria: p.subcategoria,
      color: p.color_principal,
      estilos: p.estilos,
      temporadas: p.temporadas,
    }))

    const prompt = `Eres un estilista de moda experto. El usuario tiene estas prendas en su guardarropa:

${JSON.stringify(prendasResumen, null, 2)}

Necesita un outfit para: ${ocasion || 'uso diario'}
${clima ? `Clima actual: ${clima.temperatura}°C, ${clima.descripcion}` : ''}
${estilo_usuario ? `Su estilo preferido es: ${estilo_usuario}` : ''}

REGLAS:
- Selecciona entre 3 y 5 prendas que combinen bien juntas
- DEBES incluir al menos 1 prenda de categoría "superior", 1 de "inferior" y 1 de "calzado"
- Considera la compatibilidad de colores y estilos
- Si hay clima, adapta la sugerencia a la temperatura`

    // Timeout de 15 segundos para evitar que se quede cargando infinito
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                prendas_seleccionadas: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                  description: "Lista de IDs de las prendas seleccionadas"
                },
                razon: {
                  type: "STRING",
                  description: "Explicación breve en español de por qué estas prendas combinan bien"
                },
                tip_estilo: {
                  type: "STRING",
                  description: "Un consejo corto en español de cómo usar este outfit"
                }
              },
              required: ["prendas_seleccionadas", "razon", "tip_estilo"]
            }
          }
        })
      }
    )
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Error al contactar a Gemini', fallback: true, details: errorText }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    let content = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!content) {
      return new Response(
        JSON.stringify({ 
          error: 'La IA no generó respuesta', 
          fallback: true, 
          details: JSON.stringify(data) 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Limpiar etiquetas de razonamiento (como <think>...</think>) si el modelo las incluye en el content
    content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim()

    // Parse the JSON response (handle potential markdown wrapping)
    let resultado
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      resultado = JSON.parse(jsonStr)
    } catch {
      console.error('Failed to parse AI response:', content)
      return new Response(
        JSON.stringify({ error: 'Respuesta inválida de la IA', fallback: true, details: content }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify(resultado),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    const err = error as any
    
    // Si fue por el timeout
    if (err.name === 'AbortError') {
      return new Response(
        JSON.stringify({ error: 'La IA tardó demasiado en responder (Timeout)', fallback: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: err.message, fallback: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
