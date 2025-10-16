// Verificar si el navegador web soporta SW
if ("serviceWorker" in navigator) {

    // Llamar al método register para registrar un SW
    // El parámetro /sw.js es la ruta del archivo del SW
    navigator.serviceWorker
        .register("./sw.js")

        // "then" se ejecuta si el registro fue exitoso
        // "reg" es un objeto tipo serivceworker registration con información del SW
        .then((reg) => console.log("Service Worker registrado:",reg))

        // Catch se ejecuta si ocurre un error en el registro
        // Err contiene el mensaje o detalle del error
        .catch((error) => console.log("Error al registrar el SW: ,err"));
}      

// Agregamos un evento click al botón check
document.getElementById("check").addEventListener("click", () => 
    {
        // Verificar si el SW controla la página actual
        if (navigator.serviceWorker.controller){
            alert("El serive worker está activo y controlando la página.");
        } else {
            alert("El service worker aún no está activo.");
        }
});

// Área de notificación
if (Notification.permission === "default") {
    Notification.requestPermission().then((perm) =>{
        if (perm === "granted"){
            console.log("Permiso de Notificación concedido.");
        }
    });
}