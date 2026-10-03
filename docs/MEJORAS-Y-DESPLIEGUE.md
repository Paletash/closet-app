# Revisión OutfitMe — 3 de octubre de 2026

## Estado y alcance

Preparada sobre el commit `1f2b1c7`, en una copia aislada. No se modificó la carpeta original ni se desplegó ningún cambio remoto. No se copiaron credenciales. Las pruebas de navegador usan respuestas simuladas, no cuentas ni fotos reales.

Primera entrega de correcciones y mejoras inspiradas en el recorrido de Closfi: llegar pronto al primer outfit, incorporar fotos con menos pasos y explicar la recomendación. No copia su diseño, marca ni materiales.

## Qué cambia

- Inicio guiado con tres prendas: superior, inferior y calzado; después, generar y guardar. Onboarding con varios estilos preferidos.
- Hasta 20 fotos por lote, revisadas y guardadas individualmente. No separa múltiples prendas dentro de una foto.
- Contexto libre para el estilista, preferencias, temporada y validación de prendas disponibles. Excluye ropa sucia, archivada, vendida o donada.
- Gemini y OpenRouter usan sus propios endpoints y claves. El servidor consulta el inventario del usuario y valida los IDs. Ante fallo usa reglas locales y lo comunica.
- Origen IA/local correcto al guardar; se elimina el porcentaje fijo de compatibilidad de las tarjetas. Se muestra la explicación y el consejo recibidos.
- Comparador: favoritos con argumentos correctos, collage para compartir, reintento de tarjetas y botones accesibles sobre la navegación móvil.
- Limpieza de stores/cachés personales al salir, cancelación de peticiones de la sesión anterior y retirada del caché de datos autenticados y fotos del service worker.
- Referencias `storage://` y enlaces firmados de cinco minutos, renovados mientras se muestra la imagen. Reconoce antiguas URLs del propio Supabase. **Cambiar el frontend por sí solo no convierte en privadas las fotos existentes**: hay que activar políticas y buckets privados.
- Exportación JSON de registros y referencias de fotos; no incluye los archivos de imagen.
- Eliminación de cuenta preparada, con confirmación escrita y deshabilitada por defecto hasta validarla. Puede fallar parcialmente entre almacenamiento, registros y Auth: requiere reintento y comprobación.
- Página informativa de datos, enlaces desde acceso/registro/perfil y clima bajo petición del usuario.
- Correcciones de fecha del calendario, refresco de outfits/viajes, errores de imágenes, formulario de perfil y confirmación de email; limpieza de lint y pruebas automatizadas.

## Qué NO incluye

- Eliminación de fondo, separación de varias prendas en una foto o probador virtual.
- Calendario de planificación futura: el calendario existente registra usos.
- Widget nativo, notificaciones con la app cerrada, compras, pagos o mercado entre usuarios. Reventa sigue siendo gestión de estado y texto para anunciar prendas.
- Auditoría integral de seguridad, cumplimiento legal ni garantía de calidad/disponibilidad de los modelos.

## Activación segura

No ejecutes la migración a ciegas. No se conoce el esquema remoto completo, sus triggers, permisos, restricciones o políticas actuales.

1. **Respaldo y pruebas.** Exporta esquema/datos y conserva las fotos. Usa una base de pruebas con dos cuentas desechables. Revisa las nueve tablas esperadas, sus columnas y relaciones. La migración no añade todas las columnas del producto.
2. **Almacenamiento.** Confirma los buckets `prendas-fotos` y `avatares`, y objetos bajo `UUID-del-usuario/...`. La migración no crea buckets ausentes. Otras rutas antiguas necesitan una migración propia sin perder archivos.
3. **Políticas.** Revisa `supabase/migrations/202610030001_privacy_and_quota.sql`. Añade políticas restrictivas de propietario para limitar políticas permisivas previas y pone los dos buckets privados. Puede afectar usos compartidos ajenos al repositorio. No se debe repetir manualmente tras aplicarla.
4. **Cuotas.** Crea `consume_ai_quota`: por usuario/hora, 30 outfits, 60 clasificaciones, 30 búsquedas por inspiración y 120 consultas de clima. Son límites iniciales, no un presupuesto global ni protección completa frente al abuso. Ajusta según costes. Las funciones rechazan el servicio si falta la cuota.
5. **Secretos.** Configura en Supabase `OPENROUTER_API_KEY` para visión y opcionalmente generación. `GEMINI_API_KEY` habilita generación con Gemini y tiene preferencia si ambas existen. Modelos opcionales: `GEMINI_MODEL`, `OPENROUTER_TEXT_MODEL`, `OPENROUTER_VISION_MODEL`. Verifica disponibilidad, coste y términos. `OPENWEATHER_API_KEY` habilita clima. Nunca expongas `SUPABASE_SERVICE_ROLE_KEY` al navegador.
6. **Funciones.** Comprueba con Deno y despliega en pruebas `generar-outfit`, `clasificar-prenda`, `analizar-inspiracion`, `obtener-clima` y, tras revisar su alcance, `eliminar-cuenta`. No desactives autenticación para resolver errores; el código además valida la sesión explícitamente.
7. **Cliente y privacidad.** Compila con variables públicas reales del entorno de pruebas. Completa `VITE_PRIVACY_CONTACT` con un correo atendido. La página informativa no sustituye un aviso de privacidad completo y revisado.
8. **Eliminación.** Mantén `VITE_ACCOUNT_DELETION_ENABLED=false` hasta validar borrado, reintento y fallos con cuentas desechables. Después habilita `true` y recompila. Revisa tablas/buckets externos: el servicio solo cubre los aquí descritos.
9. **Producción.** Coordina cliente, funciones, migración y actualización de PWA. Clientes antiguos no entienden `storage://` y dejarán de mostrar fotos al privatizar los buckets. Usa una ventana controlada y comprueba el nuevo service worker. No reabras buckets automáticamente para resolver incompatibilidades.

## Comprobaciones antes de publicar

- Con cuentas A y B, usando tokens de usuario: A puede leer/escribir sus filas y fotos, pero no las de B, ni vincular prendas de B a sus outfits/viajes. Probar SELECT, INSERT, UPDATE y DELETE, no solo la interfaz.
- Sin sesión o con JWT vencido, las funciones rechazan antes de contactar al proveedor. URLs públicas antiguas deben dejar de mostrar fotos tras privatizar. Los enlaces firmados ya emitidos pueden funcionar hasta caducar.
- Fotos antiguas/nuevas, renovación de enlaces, avatar, collage, salida y cambio de cuenta. La app no puede borrar en general la caché HTTP del navegador; los enlaces firmados no son DRM.
- Cuotas concurrentes, proveedor caído, claves ausentes, JSON inválido, IDs inventados y respuestas lentas; reglas locales disponibles como alternativa.
- Confirmación de email y recuperación de contraseña con las URLs autorizadas del proyecto.
- Exportación de más de 500 filas. Es paginada, no un snapshot transaccional; evita cambios concurrentes durante una exportación importante.
- Borrado de una cuenta de prueba con más de 100 fotos y carpetas, sin afectar a la segunda. Verificar Auth, registros y objetos. Simular fallo entre pasos y reintentar. No borra copias conservadas por proveedores externos.
- Si falla la limpieza de un archivo al eliminar prenda/look/avatar, revisar objetos huérfanos. Hay aviso de error, pero no cola persistente de limpieza.
- Android/iOS reales y PWA instalada. La prueba local cubre Edge Chromium con tamaños móvil/escritorio y bloquea service workers; no certifica esas plataformas.

## Próxima etapa de producto

Medir finalización de las primeras tres prendas, tiempo hasta primer outfit guardado y fallos/fallback. Después: eliminación de fondo opcional conservando el original, planificación semanal y, con pruebas de fidelidad y costes, un prototipo de probador virtual. Estas etapas no forman parte de esta entrega.
