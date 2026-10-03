import { Link } from 'react-router-dom'

export default function PrivacyPage() {
  const contact = import.meta.env.VITE_PRIVACY_CONTACT
  return <main className="max-w-2xl mx-auto p-6 text-text space-y-5">
    <Link to="/" className="text-primary underline">Volver a OutfitMe</Link>
    <h1 className="text-2xl font-bold">Cómo usa OutfitMe tus datos</h1>
    <p>Tu cuenta, preferencias, prendas, outfits, registros y fotos se guardan en Supabase para que puedas usarlos desde tus dispositivos.</p>
    <h2 className="font-semibold">Fotos y recomendaciones</h2>
    <p>Al elegir clasificar una prenda o buscar por una foto, esa imagen se envía a OpenRouter y al proveedor del modelo que procesa la solicitud. Cuando generas outfits con IA, se envían los atributos de las prendas, tus preferencias y el contexto que escribes a Google Gemini u OpenRouter. Las combinaciones locales se calculan en tu navegador.</p>
    <p>Las fotos se conservan como las subes, con compresión para reducir su tamaño. No hay un probador virtual ni se modifica tu cuerpo. Evita subir datos personales innecesarios en las imágenes o el contexto.</p>
    <h2 className="font-semibold">Ubicación y almacenamiento</h2>
    <p>El clima es opcional. Si lo activas, se usan tus coordenadas para consultar OpenWeatherMap. La sesión y los ajustes de tema se conservan en el navegador. Las recomendaciones pueden fallar o necesitar ajustes.</p>
    <h2 className="font-semibold">Control de tus datos</h2>
    <p>En Mi Perfil puedes exportar tus registros. La eliminación de la cuenta y las fotos requiere que el administrador habilite el servicio; mientras tanto, usa el contacto de privacidad para solicitarla. Los proveedores externos tienen sus propias políticas de conservación; OutfitMe no puede prometer su eliminación inmediata.</p>
    {contact && <p>Contacto para privacidad: <a className="text-primary underline" href={`mailto:${contact}`}>{contact}</a></p>}
    <p className="text-sm text-text-muted">Esta página explica el funcionamiento del producto. Consulta también las políticas de <a className="underline" href="https://supabase.com/privacy" rel="noreferrer" target="_blank">Supabase</a>, <a className="underline" href="https://openrouter.ai/privacy" rel="noreferrer" target="_blank">OpenRouter</a>, <a className="underline" href="https://policies.google.com/privacy" rel="noreferrer" target="_blank">Google</a> y <a className="underline" href="https://openweather.co.uk/privacy-policy" rel="noreferrer" target="_blank">OpenWeather</a>.</p>
  </main>
}
