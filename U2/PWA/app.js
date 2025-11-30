// App principal
let stream = null; // MediaStream actual de la cámara
let currentFacing = 'environment'; // User = frontal y Environment = trasera (Corregido 'enviroment')
let mediaRecorder = null; // Instancia de mediarecorder para audio
let chunks = []; // Buffers para audio grabado
let beforeInstallEvent = null; // Evento diferido para mostrar el boton de instalacion 

// Accesos rápidos al DOM
const $ = (sel) => document.querySelector(sel); // Corregido 'sell' por 'sel'
const video = $('#video'); // Etiqueta donde se muestra el video
const canvas = $('#canvas'); // Contenedor de capturar fotos
const photos = $('#photos'); // Corregido '$photos' por '#photos'
const audios = $('#audio');
const btnStartCam = $('#btnStartCam');
const btnStopCam = $('#btnStopCam'); // Faltaba definir esta variable usada más abajo
const btnFlip = $('#btnFlip'); // Corregido 'btnFLip' a 'btnFlip' por consistencia
const btnTorch = $('#btnTorch');
const btnShot = $('#btnShot');
const videoDevice = $('#videoDevice'); // Select para dispositivos
const btnStartRec = $('#btnStartRec');
const btnStopRec = $('#btnStopRec');
const recStatus = $('#recStatus');
const btnInstall = $('#btnInstall');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    beforeInstallEvent = e;
    btnInstall.hidden = false;
});

btnInstall.addEventListener('click' , async () =>{
    if(!beforeInstallEvent) return;
    beforeInstallEvent.prompt();
    await beforeInstallEvent.userChoice;
    btnInstall.hidden = true;  // OCULTA EL BOTON TRAS LA DECISION
    beforeInstallEvent = null; // Eso limpia la referencia
});


async function listVideoInputs() { // Corregido 'liatVideoInputs'
    try {
        // Pide al navegador todos los dispositivos multimedia
        // Corregido: mediaDevices (plural) y enumerateDevices (plural)
        const devices = await navigator.mediaDevices.enumerateDevices(); 
        
        // Filtra solo entrada de videos
        const cams = devices.filter(d => d.kind === 'videoinput');

        // Vacía el select y lo rellena con las cámaras detectadas
        videoDevice.innerHTML = ''; // Corregido 'videoDevices' (no existía) a 'videoDevice'
        
        cams.forEach((d, i) => {
            const opt = document.createElement('option');
            opt.value = d.deviceId;
            opt.textContent = d.label || `Cámara ${i+1}`;
            // deviceId que usaremos para getUserMedia
            videoDevice.appendChild(opt);
        });
    } catch(err){
        console.warn('No se pudo enumerar dispositivos.', err);
    }
};


async function startCam(constraints = {}) { // Corregido 'starCam' y 'constrains'
    // Verifica el soporte de mediaDevices a través de HTTPS
    if (!('mediaDevices' in navigator)){ // Corregido 'mediaDevice'
        alert('Este navegador no soporta el acceso a cámara / Micrófono');
        return;
    }
    try {
        // Solicita el stream de video (más cualquier constraint extra recibido)
        stream = await navigator.mediaDevices.getUserMedia({ // Corregido 'mediaDevice'
            video: { facingMode: currentFacing, ...constraints },
            audio: false
        });

        // Enlaza el stream al video para previsualizar
        video.srcObject = stream;

        // Habilitar los controles relacionados 
        btnStopCam.disabled = false;
        btnShot.disabled = false;
        btnFlip.disabled = false;
        btnTorch.disabled = false;

        // Actualiza el listado de cámaras disponibles
        await listVideoInputs(); // Corregido nombre de función
    } catch (err){
         alert('No se pudo iniciar la cámara: ' + err.message);
         console.error(err);
    }
}

function stopCam(){
    // Detiene todas las pistas del stream de video y libera la cámara
    if(stream) { stream.getTracks().forEach(t => t.stop()); }
    stream = null;
    video.srcObject = null;

    // Deshabilita controles de cámara
    btnStopCam.disabled = true;
    btnShot.disabled = true;
    btnFlip.disabled = true;
    btnTorch.disabled = true;
}


// Botones de control de cámara
// Corregido 'btnStarCam' (no definido) por 'btnStartCam'
btnStartCam.addEventListener('click', () => startCam()); 
btnStopCam.addEventListener('click', stopCam);

btnFlip.addEventListener('click', async () => {
    // Alterna entre cámara frontal y trasera
    currentFacing = (currentFacing === 'environment') ? 'user' : 'environment';
    stopCam();
    await startCam(); // Faltaban paréntesis ()
});

videoDevice.addEventListener('change', async (e) =>{
    // Cambia a un device específico elegido en el select
    const id = e.target.value;
    stopCam();
    await startCam({ deviceId: { exact: id } });
})

btnTorch.addEventListener('click', async () =>{
    // Algunas plataformas permiten activar la linterna con applyconstraints
    try{
        const [track] = stream ? stream.getVideoTracks() : [];
        if(!track) return;
        const cts = track.getConstraints();
        // Alterna el estado del torch de forma simple (usando naive toggle)
        const torch = !(cts.advanced && cts.advanced[0]?.torch);
        await track.applyConstraints({ advanced: [{ torch }] });
    } catch (err){
        alert('La linterna no es compatible con este dispositivo / navegador')
    }
});

btnShot.addEventListener('click', () => {
    // Configura el canvas al tamaño del video
    if(!stream) return;
    
    // Ajusta el tamaño del canvas
    // Corregido 'videowidth' a 'videoWidth' (CamelCase es obligatorio aquí)
    const w = video.videoWidth || 1280; // Cambié 't' por 'w' (width) por lógica
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;

    // Dibuja el fotograma actual del video en el canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);

    // Exporta el contenido del canvas a BLOB y lo muestra o descarga
    canvas.toBlob((blob) => {
        // Faltaba crear la URL del blob
        const url = URL.createObjectURL(blob); 

        // Enlace de descarga
        const a = document.createElement('a');
        a.href = url;
        a.download = foto-`${Date.now()}`.png;
        a.textContent = 'Descargar foto'; // Corregido 'Descarhar'
        a.className = 'btn';

        // Miniatura
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Foto capturada';
        img.style.width = '100%';

        // Envoltura push a la galería
        const wrap = document.createElement('div');
        wrap.appendChild(img);
        wrap.appendChild(a);
        
        // Corregido 'photo' (no definido) a 'photos' (la variable del DOM)
        photos.prepend(wrap); 
    }, 'image/png');
});