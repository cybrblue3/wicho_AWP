// Nombre de la cache
const CACHE_NAME = 'Media-PWA-v1';

// Archivos que se almacenarán en cache
// Rutas relativas a /U2/, porque sw.js vive en /U2/
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-192.png',
  'icons/maskable-512.png'
];

// Evento que se ejecuta cuando el SW se instala por primera vez
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Evento que se ejecuta cuando el SW se activa
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    );
    self.clients.claim();
  })());
});

// Evento que intercepta todas las peticiones de la aplicación
self.addEventListener('fetch', (event) => {
  const req = event.request;

  event.respondWith((async () => {
    // Primero intenta devolver desde cache
    const cached = await caches.match(req);
    if (cached) return cached;

    // Si no hay cache, intenta ir a la red
    try {
      const fresh = await fetch(req);

      // Cachea solo respuestas GET exitosas
      if (req.method === 'GET' && fresh.status === 200) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
      }

      return fresh;
    } catch (err) {
      // Si la red falla, devuelve lo que haya en cache o un error
      return cached || Response.error();
    }
  })());
});
