// Nombre del caché actual (identificador único)
const CACHE_NAME =  "mi-app-cache-v1";

// Listar los archivos que se guardarán en caché
const urlsToCache = [
    './', //ruta de la raíz
    './index.html', //documento raíz
    './styles.css', // hoja de estilos
    './app.js', // script del cliente
    './logo.png' // logotipo de canvas
];

// Evento de instalación ( Se dispara cuando se instala el sw)
self.addEventListener("install", (event) => {
    console.log("SW: Instalado");
    /* event.waitUntil() asegura que la instalación espere hasta que se complete la promise() 
    de cachear los archivos*/
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("SW: Archivos cacheados");

            /* cahe.addAll() agrega todos los archivos de urlstocache al cache final */
            return cache.addAll(urlsToCache)
        })
    );

    // Mostrar notificación en sistema
    self.registration.showNotification("Service Worker activo.",
        {
            body: "El cache inicial se configuró correctamente.",
            icon: "logo.png"
        });
});

// Evento de activación (se dispara cuando el SW toma el control).
self.addEventListener("activate", (event) => {
    console.log("SW: Activado");

    event.waitUntil(
        // caches.keys() obtiene todos los nombres de caches almacenados
        caches.keys().then((cacheNames) => 
            // Promises.all() espera a que se eliminen todos los caches viejos
            Promise.all(
                cacheNames.map((cache) => {
                    // Si el cache no coincide con el actual, se elimina
                    if (cache !== CACHE_NAME) {
                        console.log("SW: Cache viejo eliminado");
                        return caches.delete(cache);
                    }
                })
            )
        )
    );

});

// Evento de interceptación de peticiones (Para cada vez que la app pida un recurso)
self.addEventListener("fetch", (event) => {
    event.respondWith(
        // caches.match() busca un recurso ya en caché
        caches.match(event.request).then((response) => {
        // si está en caché, se devuelve una copia guardada
        // si no está en caché, se hace una petición normal a la red con fetch()
            return response || fetch(event.request);
        })
    );
});