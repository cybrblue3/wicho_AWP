let registration = null;

function resgister_sw() {
    if('serviceWorker' in navigator) {
        window.navigator.serviceWorker.register('./sw.js', {scope: './'})
        .then(res => {
            registration = res;
            console.log("Service Worker Successfully Registered.");
        })
        .catch(err => {
            console.log("Could Not Register Service Worker.");
        });
    }
}
function unresgister_sw() {
    navigator.serviceWorker.getRegistrations()
    .then(registrations => {
        registrations.forEach(registration => {
            registration.unregister();
            console.log("Service Worker Unregistered.");
        })
    })
    .catch(err => {
        console.log("Could Not Unregister Service Worker.");
    });
}

window.addEventListener('click',() => {
    fetch('./rocket.jpg')
        .then(res => console.log('From script.js: ', res));
});

resgister_sw();
// unresgister_sw();