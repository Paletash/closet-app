# OutfitMe 🧥✨

OutfitMe es una aplicación web progresiva (PWA) moderna para digitalizar y gestionar tu clóset. Utiliza Inteligencia Artificial (Llama 3/Qwen) para clasificar automáticamente tus prendas mediante visión por computadora y generar recomendaciones de outfits diarios basados en el clima y la ocasión.

## 🚀 Características Principales

- **Gestión de Clóset:** Agrega, edita y elimina prendas.
- **IA de Visión:** Sube una foto de tu prenda y la IA completará automáticamente la categoría, color y estilo.
- **Generador de Outfits:** Crea combinaciones automáticamente mediante IA usando OpenRouter.
- **PWA (Progressive Web App):** Instalable en dispositivos móviles para una experiencia nativa.
- **Autenticación y Base de Datos:** Integración completa con Supabase (Auth, Storage, Database).
- **Rendimiento Optimizado:** Carga perezosa (Lazy Loading), división de código (Code Splitting) y compresión de imágenes en el cliente.

## 🛠️ Tecnologías

- **Frontend:** React 19, Vite, Tailwind CSS v4, Zustand.
- **Backend/BaaS:** Supabase (PostgreSQL, Auth, Storage, Edge Functions).
- **IA:** OpenRouter API (Llama 3.2 Vision, Qwen 2.5 VL, Gemma 3).
- **Iconos:** Lucide React.

## 📦 Configuración e Instalación Local

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd closet-app
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto y añade tus credenciales de Supabase:
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

### 4. Configurar Supabase Edge Functions (Opcional, para IA)
Para habilitar el reconocimiento por foto y la generación de outfits, debes configurar los secretos en tu proyecto de Supabase:
```bash
supabase secrets set OPENROUTER_API_KEY=tu_clave_de_openrouter
supabase functions deploy clasificar-prenda
supabase functions deploy generar-outfit
```

### 5. Iniciar servidor de desarrollo
```bash
npm run dev
```
Abre [http://localhost:5173](http://localhost:5173) en tu navegador para ver la aplicación.

## 🔧 Build de Producción

Para compilar la aplicación para producción:
```bash
npm run build
```
Esto generará los archivos optimizados y los Service Workers de la PWA en la carpeta `dist`.
