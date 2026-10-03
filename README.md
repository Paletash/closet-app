# OutfitMe 🧥✨

OutfitMe es una PWA para organizar tu ropa y crear combinaciones mediante reglas locales o IA configurable. Esta revisión añade una guía al primer outfit, carga de hasta 20 fotos revisadas individualmente, contexto para la IA y soporte de fotos privadas.

**Antes de conectar esta revisión a producción, lee [el alcance y despliegue](docs/MEJORAS-Y-DESPLIEGUE.md).** La migración incluida endurece una base existente: no crea el esquema inicial completo. No se ha aplicado al servidor ni a la carpeta original.

## 🚀 Características Principales

- **Gestión de Clóset:** Agrega, edita y elimina prendas.
- **IA de Visión:** Sube una foto de tu prenda y la IA completará automáticamente la categoría, color y estilo.
- **Generador de Outfits:** Usa Gemini u OpenRouter, valida las prendas y recurre a reglas locales si el proveedor falla.
- **PWA (Progressive Web App):** Instalable en dispositivos móviles para una experiencia nativa.
- **Autenticación y Base de Datos:** Integración completa con Supabase (Auth, Storage, Database).
- **Rendimiento Optimizado:** Carga perezosa (Lazy Loading), división de código (Code Splitting) y compresión de imágenes en el cliente.

## 🛠️ Tecnologías

- **Frontend:** React 19, Vite, Tailwind CSS v4, Zustand.
- **Backend/BaaS:** Supabase (PostgreSQL, Auth, Storage, Edge Functions).
- **IA:** OpenRouter para visión; Gemini u OpenRouter para outfits. Modelos configurables en el servidor.
- **Iconos:** Lucide React.

## 📦 Configuración e Instalación Local

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd closet-app
```

### 2. Instalar dependencias
```bash
npm ci
```

### 3. Configurar variables de entorno
Copia `.env.example` como `.env.local` y añade la configuración pública de un Supabase de pruebas. Nunca uses claves de proveedores ni service-role en variables `VITE_`:
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

### 4. Configurar Supabase Edge Functions (Opcional, para IA)
Antes de desplegar funciones, revisa y aplica en pruebas la migración de políticas y cuotas según la guía. Configura los secretos solo en el servidor. Ejemplo para un proyecto de pruebas ya validado:
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

## Verificación

Usa Node 24 para ejecutar también las pruebas que importan TypeScript.

```sh
npm run lint
npm test
npm run build
```

La prueba `scripts/smoke.mjs` requiere Playwright y un navegador instalado. Usa una compilación con `VITE_SUPABASE_URL=https://outfitme.test` y `VITE_SUPABASE_ANON_KEY=test-public-key`, servida en `http://127.0.0.1:4173`. Todas las peticiones externas se simulan. No publiques esa compilación.

Variables del script: `OUTFITME_PLAYWRIGHT_MODULE` (paquete o URL del módulo), `OUTFITME_BROWSER_CHANNEL` (por ejemplo `msedge`), `OUTFITME_QA_OUTPUT` (capturas). Por defecto usa `playwright`, Chromium y `qa-output/`.

Las funciones requieren validación adicional con Deno y Supabase real de pruebas; las pruebas locales de sintaxis no sustituyen ese paso.
