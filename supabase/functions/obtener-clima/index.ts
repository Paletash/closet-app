// supabase/functions/obtener-clima/index.ts
// Edge Function: Obtiene el clima actual usando OpenWeatherMap API
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
    const { lat, lon } = await req.json()

    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ error: 'Coordenadas no proporcionadas' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const API_KEY = Deno.env.get('OPENWEATHER_API_KEY')
    if (!API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API key de clima no configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`

    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenWeatherMap error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Error al obtener el clima' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()

    const resultado = {
      temperatura: Math.round(data.main.temp),
      sensacion_termica: Math.round(data.main.feels_like),
      temp_min: Math.round(data.main.temp_min),
      temp_max: Math.round(data.main.temp_max),
      humedad: data.main.humidity,
      descripcion: data.weather[0].description,
      icono: data.weather[0].icon,
      icono_id: data.weather[0].id,
      ciudad: data.name,
    }

    return new Response(
      JSON.stringify(resultado),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
