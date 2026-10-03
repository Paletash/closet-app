// Retire caches created by older releases, including on already-installed PWAs.
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all(['supabase-api', 'supabase-images'].map(name => caches.delete(name))))
})
