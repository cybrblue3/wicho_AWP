// App principal
let stream = null;                 // MediaStream actual de la cámara
let currentFacing = 'environment'; // 'user' = frontal, 'environment' = trasera
let mediaRecorder = null;          // Instancia de MediaRecorder para audio (pendiente)
let chunks = [];                   // Buffers para audio grabado
let beforeInstallEvent = null;     // Evento diferido para mostrar el botón de instalación

// Accesos rápidos al DOM
const $ = (sel) => document.querySelector(sel);

const video = $('#video');           // Etiqueta donde se muestra el video
const canvas = $('#canvas');         // Contenedor para capturar fotos
const photos = $('#photos');
const audios = $('#audios');
const btnStartCam = $('#btnStartCam');
const btnStopCam = $('#btnStopCam');
const btnFlip = $('#btnFlip');
const btnTorch = $('#btnTorch');
const btnShot = $('#btnShot');
const videoDevices = $('#videoDevices'); // Select para dispositivos de video
const btnStartRec = $('#btnStartRec');
const btnStopRec = $('#btnStopRec');
const recStatus = $('#recStatus');
const btnInstall = $('#btnInstall');

// ----- PWA Install -----
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  beforeInstallEvent = e;
  if (btnInstall) btnInstall.hidden = false;
});

btnInstall?.addEventListener('click', async () => {
  if (!beforeInstallEvent) return;
  beforeInstallEvent.prompt();
  await beforeInstallEvent.userChoice;
  btnInstall.hidden = true;   // Oculta el botón tras la decisión
  beforeInstallEvent = null;  // Limpia la referencia
});

// ----- Listado de cámaras -----
async function listVideoInputs() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter(d => d.kind === 'videoinput');

    if (!videoDevices) return;

    // Vacía el select y lo rellena con las cámaras detectadas
    videoDevices.innerHTML = '';
    cams.forEach((d, i) => {
      const opt = document.createElement('option');
      opt.value = d.deviceId;
      opt.textContent = d.label || `Cámara ${i + 1}`;
      videoDevices.appendChild(opt);
    });
  } catch (err) {
    console.warn('No se pudo enumerar dispositivos.', err);
  }
}

// ----- Cámara: iniciar / detener -----
async function startCam(constraints = {}) {
  if (!('mediaDevices' in navigator)) {
    alert('Este navegador no soporta el acceso a cámara / micrófono');
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: currentFacing, ...constraints },
      audio: false
    });

    if (video) video.srcObject = stream;

    if (btnStopCam) btnStopCam.disabled = false;
    if (btnShot) btnShot.disabled = false;
    if (btnFlip) btnFlip.disabled = false;
    if (btnTorch) btnTorch.disabled = false;

    await listVideoInputs();
  } catch (err) {
    alert('No se pudo iniciar la cámara: ' + err.message);
    console.error(err);
  }
}

function stopCam() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
  }
  stream = null;
  if (video) video.srcObject = null;

  if (btnStopCam) btnStopCam.disabled = true;
  if (btnShot) btnShot.disabled = true;
  if (btnFlip) btnFlip.disabled = true;
  if (btnTorch) btnTorch.disabled = true;
}

// ----- Botones de control de cámara -----
btnStartCam?.addEventListener('click', () => startCam());
btnStopCam?.addEventListener('click', stopCam);

btnFlip?.addEventListener('click', async () => {
  // Alterna entre cámara frontal y trasera
  currentFacing = (currentFacing === 'environment') ? 'user' : 'environment';
  stopCam();
  await startCam();
});

videoDevices?.addEventListener('change', async (e) => {
  const id = e.target.value;
  stopCam();
  await startCam({ deviceId: { exact: id } });
});

btnTorch?.addEventListener('click', async () => {
  try {
    const [track] = stream ? stream.getVideoTracks() : [];
    if (!track) return;

    const cts = track.getConstraints();
    const torch = !(cts.advanced && cts.advanced[0]?.torch);

    await track.applyConstraints({ advanced: [{ torch }] });
  } catch (err) {
    alert('La linterna no es compatible con este dispositivo / navegador');
  }
});

btnShot?.addEventListener('click', () => {
  if (!stream || !video || !canvas || !photos) return;

  const w = video.videoWidth || 1280;
  const h = video.videoHeight || 720;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, w, h);

  canvas.toBlob((blob) => {
    if (!blob) return;

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `foto-${Date.now()}.png`;
    a.textContent = 'Descargar foto';
    a.className = 'btn';

    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Foto capturada';
    img.style.width = '100%';

    const wrap = document.createElement('div');
    wrap.appendChild(img);
    wrap.appendChild(a);

    photos.prepend(wrap);
  }, 'image/png');
});

// ----- TODO: Audio, vibración y tonos -----
// Aquí más adelante puedes implementar:
// - MediaRecorder para audio (btnStartRec / btnStopRec / audios)
// - navigator.vibrate para vibración
// - Reproducción de tono con <audio> o Audio()

// ----- Registro del Service Worker -----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/U2/sw.js')
      .catch(err => console.error('SW registration failed', err));
  });
}
