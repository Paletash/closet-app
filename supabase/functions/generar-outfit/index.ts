// supabase/functions/generar-outfit/index.ts
// Edge Function: Genera sugerencias de outfit usando OpenRouter API (Llama 3.3 70B)
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
    const { prendas, ocasion, clima, estilo_usuario } = await req.json()

    if (!prendas || prendas.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No se recibieron prendas' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')
    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API key no configurada', fallback: true }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
- Si hay clima, adapta la sugerencia a la temperatura

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta (sin markdown, sin explicación extra):
{
  "prendas_seleccionadas": ["id1", "id2", "id3"],
  "razon": "Explicación breve en español de por qué estas prendas combinan bien",
  "tip_estilo": "Un consejo corto en español de cómo usar este outfit"
}`

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://outfitme.vercel.app",
        "X-Title": "OutfitMe"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Error al contactar la IA', fallback: true }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'La IA no generó respuesta', fallback: true }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse the JSON response (handle potential markdown wrapping)
    let resultado
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      resultado = JSON.parse(jsonStr)
    } catch {
      console.error('Failed to parse AI response:', content)
      return new Response(
        JSON.stringify({ error: 'Respuesta inválida de la IA', fallback: true }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify(resultado),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message, fallback: true }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
