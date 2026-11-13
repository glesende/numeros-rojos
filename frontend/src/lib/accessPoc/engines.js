// Motores de la PoC de accesos. Todo corre en el navegador: ninguna imagen ni vector facial sale de acá.
// Los modelos faciales se sirven desde nuestro dominio (/poc-modelos-facial), sin CDN ni APIs externas.

export const MODELS_URI = '/poc-modelos-facial';
export const ATTEMPT_TIMEOUT_MS = 5000;
export const PRESENCE_DIFF_THRESHOLD = 12; // diferencia media (0-255) entre cuadro y fondo
export const PRESENCE_FRAMES = 2;

export async function openCamera(facingMode) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Este navegador no permite usar la cámara (se requiere HTTPS).');
  }
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
  });
}

export function stopStream(stream) {
  stream?.getTracks().forEach((t) => t.stop());
}

/** Cuadro chico en gris (32x24) para detectar presencia con costo despreciable. */
export function grabSmallGray(video, canvas) {
  canvas.width = 32;
  canvas.height = 24;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(video, 0, 0, 32, 24);
  const { data } = ctx.getImageData(0, 0, 32, 24);
  const gray = new Float32Array(32 * 24);
  for (let i = 0; i < gray.length; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }
  return gray;
}

// ── QR ────────────────────────────────────────────────────────────────────────

let nativeDetector = null;

export async function createQrEngine(preferred) {
  if (preferred !== 'jsqr' && 'BarcodeDetector' in window) {
    try {
      const formats = await window.BarcodeDetector.getSupportedFormats();
      if (formats.includes('qr_code')) {
        nativeDetector = nativeDetector || new window.BarcodeDetector({ formats: ['qr_code'] });
        return {
          name: 'BarcodeDetector',
          async detect(video) {
            const found = await nativeDetector.detect(video);
            return found.length ? found[0].rawValue : null;
          },
        };
      }
    } catch { /* cae a jsQR */ }
  }
  const { default: jsQR } = await import('jsqr');
  const canvas = document.createElement('canvas');
  return {
    name: 'jsQR',
    async detect(video) {
      const scale = Math.min(1, 640 / (video.videoWidth || 640));
      const w = Math.round(video.videoWidth * scale);
      const h = Math.round(video.videoHeight * scale);
      if (!w || !h) return null;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, w, h);
      const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
      return code ? code.data : null;
    },
  };
}

// ── Facial ────────────────────────────────────────────────────────────────────

let faceapiPromise = null;

/** Carga face-api (lazy) y los modelos locales; hace una inferencia de calentamiento. */
export async function loadFaceEngine() {
  if (!faceapiPromise) {
    faceapiPromise = (async () => {
      const faceapi = await import('@vladmandic/face-api');
      try { await faceapi.tf.setBackend('webgl'); } catch { /* usa el backend por defecto */ }
      await faceapi.tf.ready();
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URI),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODELS_URI),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URI),
      ]);
      // Calentamiento: la primera inferencia compila shaders y distorsionaría las mediciones.
      const warm = document.createElement('canvas');
      warm.width = 320;
      warm.height = 240;
      for (let i = 0; i < 2; i++) await describeFace(faceapi, warm);
      return faceapi;
    })().catch((e) => { faceapiPromise = null; throw e; });
  }
  const faceapi = await faceapiPromise;
  return { faceapi, backend: faceapi.tf.getBackend() };
}

const detectorOptions = (faceapi) => new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });

/** Devuelve el descriptor (Float32Array de 128) del rostro más evidente, o null. Vive solo en memoria. */
export async function describeFace(faceapi, input) {
  const r = await faceapi
    .detectSingleFace(input, detectorOptions(faceapi))
    .withFaceLandmarks(true)
    .withFaceDescriptor();
  return r ? r.descriptor : null;
}
