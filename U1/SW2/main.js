// Registrar el service worker
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js")
    .then((reg) => console.log("SW registrado." , reg))
    .catch((err) => console.log ("Error al registrar el SW", err));
}

// Botón para verificar el estado del SW
document.getElementById("check").addEventListener("click", () => {
    if (navigator.serviceWorker.controller) {
        alert("El Service Worker está activo y controlando la página.");
    } else {
        alert("El Service Worker aún no está activo.");
    }
});

// Pedir permiso de notificación
if (Notification.permission === 'default') {
    Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
            console.log("Permiso de notificación concedido.");
        } else {
            console.log("Permiso de notificación denegado.");
        }
    });
}

// Botón para lanzar notificación local
document.getElementById('btnNotification').addEventListener("click", () => {
    if(navigator.serviceWorker.controller){
        navigator.serviceWorker.controller.PostMessage("mostrar-notificación");
    } else {
        alert("El Service Worker aún no está activo.");
    }
});
