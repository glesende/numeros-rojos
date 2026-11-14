// Motores QR y facial del benchmark de laboratorio (#373). Solo los usa frontend/bench; no forman parte del sitio.
// Los modelos faciales los sirve Vite desde frontend/bench/modelos.

export const MODELS_URI = '/bench/modelos';

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
