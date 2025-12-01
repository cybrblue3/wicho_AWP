// App principal
let stream = null;                 // MediaStream actual de la cámara
let currentFacing = 'environment'; // 'user' = frontal, 'environment' = trasera
let mediaRecorder = null;          // Instancia de MediaRecorder para audio
let chunks = [];                   // Buffers para audio grabado
let beforeInstallEvent = null;     // Evento diferido para mostrar el botón de instalación
let isRingtonePlaying = false;     // Estado del tono de llamada

// Accesos rápidos al DOM
const $ = (sel) => document.querySelector(sel);

const video = $('#video');             // Etiqueta donde se muestra el video
const canvas = $('#canvas');           // Contenedor para capturar fotos
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

const btnVibrar = $('#btnVibrar');
const btnRingtone = $('#btnRingtone');

const btnInstall = $('#btnInstall');

// Audio para el ringtone (ajusta ruta/nombre si hace falta)
const ringtone = new Audio('/U2/assets/ringtone.mp3');

// ------------------- PWA Install -------------------
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  beforeInstallEvent = e;
  if (btnInstall) btnInstall.hidden = false;
});

btnInstall?.addEventListener('click', async () => {
  if (!beforeInstallEvent) return;
  beforeInstallEvent.prompt();
  await beforeInstallEvent.userChoice;
  btnInstall.hidden = true;
  beforeInstallEvent = null;
});

// ------------------- Listado de cámaras -------------------
async function listVideoInputs() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter(d => d.kind === 'videoinput');

    if (!videoDevices) return;

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

// ------------------- Cámara: iniciar / detener -------------------
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

// ------------------- Botones de control de cámara -------------------
btnStartCam?.addEventListener('click', () => startCam());
btnStopCam?.addEventListener('click', stopCam);

btnFlip?.addEventListener('click', async () => {
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

// ------------------- Micrófono: grabar, listar, reproducir, descargar -------------------
async function startRecording() {
  if (!navigator.mediaDevices) {
    alert('Este navegador no soporta el acceso al micrófono');
    return;
  }

  try {
    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

    mediaRecorder = new MediaRecorder(audioStream);
    chunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);

      const wrapper = document.createElement('div');
      wrapper.className = 'audio-item';

      const audioEl = document.createElement('audio');
      audioEl.controls = true;
      audioEl.src = url;

      const link = document.createElement('a');
      link.href = url;
      link.download = `audio-${Date.now()}.webm`;
      link.textContent = 'Descargar audio';

      wrapper.appendChild(audioEl);
      wrapper.appendChild(link);

      audios?.prepend(wrapper);
    };

    mediaRecorder.start();
    if (btnStartRec) btnStartRec.disabled = true;
    if (btnStopRec) btnStopRec.disabled = false;
    if (recStatus) recStatus.textContent = 'Grabando...';

  } catch (err) {
    alert('No se pudo acceder al micrófono: ' + err.message);
    console.error(err);
  }
}

function stopRecording() {
  if (!mediaRecorder) return;

  mediaRecorder.stop();
  mediaRecorder.stream.getTracks().forEach(t => t.stop());

  if (btnStartRec) btnStartRec.disabled = false;
  if (btnStopRec) btnStopRec.disabled = true;
  if (recStatus) recStatus.textContent = 'Grabación detenida';
}

btnStartRec?.addEventListener('click', startRecording);
btnStopRec?.addEventListener('click', stopRecording);

// ------------------- Vibración -------------------
btnVibrar?.addEventListener('click', () => {
  if (!navigator.vibrate) {
    alert('La vibración no es compatible con este dispositivo / navegador');
    return;
  }

  // Vibrar 200ms, parar 100ms, vibrar 200ms
  navigator.vibrate([200, 100, 200]);
});

// ------------------- Ringtone (tono de llamada) -------------------
btnRingtone?.addEventListener('click', async () => {
  try {
    if (!isRingtonePlaying) {
      await ringtone.play();
      isRingtonePlaying = true;
      btnRingtone.textContent = 'Detener tono';
    } else {
      ringtone.pause();
      ringtone.currentTime = 0;
      isRingtonePlaying = false;
      btnRingtone.textContent = 'Reproducir tono';
    }
  } catch (err) {
    console.error('Error al reproducir tono:', err);
  }
});

// ------------------- Registro del Service Worker -------------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/U2/sw.js')
      .catch(err => console.error('SW registration failed', err));
  });
}
