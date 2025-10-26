const CACHE_NAME = 'wich0clock-cache-v1';
const cacheAssets = [
  'index.html',
  'mechanical.html',
  'quartz.html',
  'digital.html',
  'styles.css',
  'logo.png',
  'img1.jpg', 
  'img2.jpg', 
  'img3.jpg',
  'Hamilton.png',
  'main.js',
  'sw.js' 
];

// Install: Precache required assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(cacheAssets))
      .catch(err => console.error('Caching error:', err))
  );
});

// Activate: Cleanup old cache versions
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: Network-first, fallback to cache, dynamically cache successful responses
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return; // Only cache GET requests
  event.respondWith(
    fetch(event.request)
      .then(networkRes => {
        // Clone the response immediately!
        let responseClone = networkRes.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return networkRes; // Return the original response to the browser
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request)
          .then(cachedRes => cachedRes || caches.match('index.html'));
      })
  );
}); 

// Listen for notification trigger from the client
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'notify') {
    let type = event.data.type || '';
    let title = 'Wich0\'clock Reminder';
    let body = 'Thanks for choosing Wich0\'clock!';
    if (type === 'mechanical') body = 'Get the latest news about mechanical watches!';
    if (type === 'quartz') body = 'Don\'t miss our quartz watch specials!';
    if (type === 'digital') body = 'Check out all digital deals and retro designs!';
    self.registration.showNotification(title, {
      body,
      icon: 'logo.png', // Use your logo here
      badge: 'logo.png', // Badge for Windows notification
      vibrate: [200, 100, 200],
    });
  }
});