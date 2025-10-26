// Nombre de caché
const cacheName = 'mi-cache-v2';

// Archivos que se guardarán en cache
const cacheAssets = [
    'index.html',
    'pagina1.html',
    'pagina2.html',
    'offline.html',
    'styles.css',
    'main.js',
    'icono.png',
    'service-worker.js'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    console.log('SW: Instalado');
    event.waitUntil(
        caches.open(cacheName).then((cache) => {
            console.log('SW: Cacheando Archivos...');
            return cache.addAll(cacheAssets);
        })
        .then(() => self.skipWaiting())
        .catch((err) => console.log('Error al cachear archivos:'
            , err))
    );
}); 

// Activación del Service Worker
self.addEventListener('activate', (event) => {
    console.log('SW: Activado');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== cacheName) {
                        console.log(`SW: ELiminando cache
                            antigua: ${cache}`);
                            return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Escuchar mensajes desde la página
self.addEventListener('message', (event) => {
    console.log('SW recibio:', event.data);
    if (event.data === 'mostrar-notificación') {
        self.ServiceWorkerRegistration.showNotification('Notificación Local.'
            , {
                body: 'Esta es una prueba de notificación sin servidor push.',
                icon: 'icono.png'
            });
    }
});

// Manejar peticiones de red con fallback offline
self.addEventListener('fetch', (event) => {
    // Ignorar peticiones innecesarias como extensiones o favicon
    if (
        event.request.url.includes('chrome-extesion') ||
        event.request.url.includes('favicon.ico')

    ) {
        return;
    }

    event.respondWith(
        fetch(event.request)
        .then((response) => {
            // Si la respuesta es válida, la devuelve y la guarda ne el caché dinámico.
            const clone = response.clone();
            caches.open(cacheName).then((cache) => cache.put(
                event.request, clone));
                return response;
        })
        .catch(() => {
            // Si no hay red, buscar en caché
            return caches.match(event.request).then((response) => 
                {
                if (response) {
                    console.log('SW: Recurso desde cache', event
                        .request.url);
                        return response;
                } else {
                    console.warn('SW: Mostrando página offline.')
                    ;
                    return caches.match('offline.html');
                }
            });
        })
    );
});
     