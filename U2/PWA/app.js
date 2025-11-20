//app principal
let stream = null; //Mediastream actual de la camara
let currentFacing = 'environment'; // User = frontal y enviroment = trasera
let mediaRecorder = null; //Instancia de mediarecorder para audio 
let chunks = []; //Buffers para audio grabado
let beforeInstallEvent = null; //Evento diferido para mostrar el boton de instalacion

//Accesos rapidos al DOM
const $ = (sel) => document.querySelector(sel);
const video = $('#video'); //etiqueta video donde se muestra el string
const canvas = $('#canvas'); //contenedor de capturar fotos
const photos = $('#photos'); //contenedor de fotos capturadas
const audios = $('#audios'); //contenedor para audios grabados
const btnStartCam = $('#btnStartCam'); //boton iniciar camara
const btnStopCam = $('#btnStopCam'); //boton detener camara
const btnFlip = $('#btnFlip'); //boton alternar camara
const btnTorch = $('#btnTorch'); //boton para linterna
const btnShot = $('#btnShot'); //boton para tomar foto
const videoDevices = $('#videoDevices'); //select para camaras disponibles
const btnStartRec = $('#btnStartRec'); //boton iniciar grabacion audio
const btnStopRec = $('#btnStopRec'); //boton detener grabacion audio
const btnStatus = $('#recStatus'); //indicador del estado de grabacion
const btnInstall = $('#btnInstall'); //boton para instalar la PWA

//instalacion de la PWA (A2HS)
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); //evita que el navegador muestre el prompt por defecto
    beforeInstallEvent = e; //guarda el evento para lanzarlo manualmente
    btnInstall.hidden = false; //muestra el boton de instalacion
});

btnInstall.addEventListener('click', async () => {
    if (!beforeInstallEvent) return; //si no hay evento almacenado no hacemos nada
    beforeInstallEvent.prompt(); //dispara el dialogo de instalacion
    await beforeInstallEvent.userChoice; //espera la eleccion del usuario
    btnInstall.hidden = true; //oculta el boton tras la decision
    beforeInstallEvent = null; //limpia la referencia
});

//camara listado y control
async function listVideoInputs () {
    try {
        //pide al navegador todos los dispositivos multimedia
        const devices = await navigator.mediaDevices.enumerateDevices();
        //filtro solo entradas de video
        const cams = devices.filter(d => d.kind === 'videoinput');
        //vacia el select y lo rrellena con las camaras detectadas
        videoDevices.innerHTML = '';
        cams.forEach((d,i) => {
            const opt = document.createElement('option');
            opt.value = d.deviceId;
            opt.textContent = d.label || `Camara ${i + 1}`;
            videoDevices.appendChild(opt);
            //deviceide que usaremos para getusermedia
            videoDevices.appendChild(opt);
        });
    }
    catch (err) {
        console.warn('No se pudo enumerar dispositivos:', err);
    }
}

async function startCam(constraints = {}) {
    //Verifica el soporte de mediaDevices a traves de HTTPS
    if (!('mediaDevices' in navigatorv)) {
        alert('Este navegador no soporta el acceso a camara/Microfono');
        return;
    }
    try {
        //Solicita el stream de video (mas cualquier constraint extra recibido)
        stream = await navigator.mediaDevices.getUserMedia({
            video: {facingMode: currentFacing, ...constraints },
            audio: false
        });

        //Enlaza el stream al select de video para previsualizar
        video.srcObject = stream;

        //Habilitar los controles relacionados
        btnStopCam.disable = false;
        btnShot.disable = false;
        btnFlip.disable = false;
        btnTorch.disable = false;

        //Actualiza el listado de camaras disponibles
        await listVideoInputs();
    } catch (err) {
        alert('No se pudo iniciar la camara: ' + err.message);
        console.error(err);
    }
}

function stopCam(){
    //Detiene todas las pistas del stream de video y libera la camara
    if (stream) { stream.getTracks(). forEach(t => t.stop()); }
    stream = null;
    video.srcObject = null;

    //Desabilita controles de camara
    btnStopCam.disable = true;
    btnShot.disable = true;
    btnFlip.disable = true;
    btnTorch.disable = true;
}

//Botones de control de camara
btnStartCam.addEventListener('click', () => startCam());
btnStopCam.addEventListener('click', stopCam);

btnFlip.addEventListener('click', async () => {
    //Alterna entre camara frontal y trasera y reinicia el stream
    currentFacing = (currentFacing === 'environment') ? 'user' : 'environment';
    stopCam();
    await startCam;
});

videoDevices.addEventListener('change', async (e) => {
    //Cambia a un deviceid especifico elegido en el select
    const id = e.target.value;
    stopCam();
    await startCam({ deviceid: {exact: id} });
});

btnTorch.addEventListener('click', async () => {
    //Algunas plataformas permiten activar la linterna con applyConstraints
    try {
        const [track] = stream ? stream.getVideoTracks() : [];
        if (!track) return;
        const cts = track.getConstraints();
        //Alterna el estado del torch de forma simple (Usando naive toggle)
        const torch = !(cts.advanced && cts.advanced[0]?.torch);
        await track.applyConstraints({ advanced: [{ torch}] });
    } catch (err) {
        alert('La linterna no es compartible con este dispositivo/navegador.');
    }
});