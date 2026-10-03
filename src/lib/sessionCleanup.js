export async function clearPersonalCaches() {
  if ('caches' in globalThis) {
    const keys = await caches.keys()
    await Promise.all(keys.filter(key => ['supabase-api', 'supabase-images'].includes(key)).map(key => caches.delete(key)))
  }
  if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('outfitme_weather')
  if (typeof localStorage !== 'undefined') {
    for (const key of ['outfitme_notif_enabled', 'outfitme_last_morning_notif', 'outfitme_notif_dismiss_time', 'outfitme_visit_count']) {
      localStorage.removeItem(key)
    }
  }
}
