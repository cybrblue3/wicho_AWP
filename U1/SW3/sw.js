self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open('v3')
        .then(cache => {
            cache.addAll([
                './',       //EL punto y slash hacen referencia al index.html             
                './script.js',
                './rocket.jpg'
            ]);
            console.log("Assets cached.");
        })
        .catch(err => console.log("Could not cache."))
    )
});
// this is  a sample comment!
self.addEventListener('fetch', event => {
    console.log("INTERCEPTED");

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                console.log("V3 the request: ", event.request);
                console.log("V3 got the response...", response);

                // **1st   from cache or fetched if not
                // return response || fetch(event.request);

                // **2nd target specific request object and respond with different data but same type
                // if (event.request.url === 'https://127.0.0.1:5500/rocket.jpg') {
                //     return fetch('https://unsplash.com/es/fotos/rayo-de-luz-cerca-del-cuerpo-de-agua--p-KCm6xB9I');
                // } else {
                //     return response;
                // }

                // **3rd target specific request object and repond with different data but same type; save response to cache
                // if (event.request.url === 'https://127.0.0.1:5500/rocket.jpg') {
                //     return fetch('https://unsplash.com/es/fotos/rayo-de-luz-cerca-del-cuerpo-de-agua--p-KCm6xB9I')
                //         .then(res => {
                //             return caches.open('v1')
                //             .then(cache => {
                //                 cache.put(event.request, res.clone());
                //                 return res;
                //             })
                //         });
                // } else {
                //     return response;
                // }

                // **4th return other site (MUST BE NON CORS-BLOCKED) instead of the initial index.html
                // return fetch('https://www.perplexity.ai/')   //****BAD EXMPL
                return fetch('https://jsonplaceholder.typicode.com/todos/1')  //****GOOD EXMPL
                // **5th return an empty RESPONSE object or a RESPONSE object with data inside
                // return new Response('Hola, esta es una nueva respuesta!!!');

            })
            .catch(err => {
                console.log("Could not find matching request.");
                return null;
            })
    );
});


// Delete cache with code
// self.addEventListener('activate', event => {
//     event.waitUntil(
//         caches.keys()
//         .then(keys => {
//             keys.forEach(key => {
//                 if (key === 'v3') caches.delete(key);
//             });
//         })
//     );
// });