import { useCallback, useEffect, useRef, useState } from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import QrGenerator from '../components/accessPoc/QrGenerator';
import ResultsPanel from '../components/accessPoc/ResultsPanel';
import BenchmarkResults from '../components/accessPoc/BenchmarkResults';
import ConclusionTable from '../components/accessPoc/ConclusionTable';
import { METHOD_LABEL, classify, euclidean, meanAbsDiff } from '../lib/accessPoc/stats';
import {
  ATTEMPT_TIMEOUT_MS, PRESENCE_DIFF_THRESHOLD, PRESENCE_FRAMES,
  openCamera, stopStream, grabSmallGray, createQrEngine, loadFaceEngine, describeFace,
} from '../lib/accessPoc/engines';

const COOLDOWN_MS = 1500;
const EMPTY_FRAMES = 3; // lecturas consecutivas sin código/rostro para dar la escena por vacía
const nextFrame = () => new Promise((r) => requestAnimationFrame(r));

/**
 * PoC (tarea #372): compara tiempos de decisión de lector QR vs reconocimiento facial.
 * Página oculta: no se enlaza desde ninguna parte. Todo corre en el navegador; no se envía ni se guarda
 * ninguna imagen ni vector facial (solo tiempos agregados en memoria de esta pestaña).
 */
export default function StadiumAccessPocPage() {
  usePageMeta({
    title: 'PoC accesos | Números Rojos',
    description: 'Prueba de concepto interna.',
    noindex: true,
  });

  const [consented, setConsented] = useState(false);
  const [method, setMethod] = useState('qr');
  const [facing, setFacing] = useState('environment');
  const [cameraOn, setCameraOn] = useState(false);
  const [trigger, setTrigger] = useState('presence');
  const [expected, setExpected] = useState('ok');
  const [seqN, setSeqN] = useState(20);
  const [seq, setSeq] = useState({ active: false, done: 0, total: 0 });
  const [qrChoice, setQrChoice] = useState('auto');
  const [threshold, setThreshold] = useState(0.6);
  const [phase, setPhase] = useState('idle'); // idle | clearing | armed | measuring | cooldown
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [last, setLast] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [validCodes, setValidCodes] = useState([]);
  const [refThumb, setRefThumb] = useState('');
  const [refReady, setRefReady] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const smallCanvas = useRef(null);
  const runRef = useRef(0);
  const phaseRef = useRef('idle');
  const t0Ref = useRef(0);
  const baselineRef = useRef(null);
  const presenceRef = useRef({ streak: 0, first: 0 });
  const emptyRef = useRef(0);
  const timerRef = useRef(null);
  const qrEngineRef = useRef(null);
  const faceRef = useRef(null); // { faceapi, backend }
  const refDescRef = useRef(null); // vector facial de la foto de prueba: solo en memoria
  const validRef = useRef(new Set());
  const seqRef = useRef({ active: false, done: 0, total: 0 });
  const cfg = useRef({});
  cfg.current = { method, trigger, expected, threshold, facing };

  const setPhaseBoth = (p) => { phaseRef.current = p; setPhase(p); };

  const addValid = useCallback((code) => {
    validRef.current.add(code);
    setValidCodes([...validRef.current]);
  }, []);

  const finish = useCallback((decision, totalMs, computeMs) => {
    const c = cfg.current;
    const { correct, error: err } = classify(c.expected, decision);
    const v = videoRef.current;
    const attempt = {
      method: c.method,
      trigger: c.trigger,
      expected: c.expected,
      decision,
      correct,
      error: err,
      totalMs: decision === 'timeout' ? null : totalMs,
      computeMs: decision === 'timeout' ? null : computeMs,
      engine: c.method === 'qr' ? qrEngineRef.current?.name ?? '' : 'face-api tiny+recognition',
      backend: c.method === 'face' ? faceRef.current?.backend ?? '' : '',
      videoRes: v ? `${v.videoWidth}x${v.videoHeight}` : '',
      faceThreshold: c.method === 'face' ? c.threshold : null,
      sequence: seqRef.current.active,
    };
    setAttempts((prev) => [...prev, attempt]);
    setLast(attempt);
    setPhaseBoth('cooldown');

    const s = seqRef.current;
    if (s.active) {
      s.done += 1;
      setSeq({ ...s });
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (seqRef.current.active && seqRef.current.done < seqRef.current.total) {
        arm();
      } else {
        seqRef.current = { active: false, done: 0, total: 0 };
        setSeq({ active: false, done: 0, total: 0 });
        setPhaseBoth('idle');
      }
    }, COOLDOWN_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function arm() {
    baselineRef.current = null;
    presenceRef.current = { streak: 0, first: 0 };
    emptyRef.current = 0;
    setLast(null);
    // Disparo automático: primero hay que verificar que la escena esté vacía; si no, retirar el código
    // (o la persona) contaría como "presencia" y falsearía el t0.
    setPhaseBoth(cfg.current.trigger === 'presence' ? 'clearing' : 'armed');
  }

  const startMeasuring = (t0) => {
    t0Ref.current = t0;
    setPhaseBoth('measuring');
  };

  const loop = useCallback(async () => {
    const my = ++runRef.current;
    while (runRef.current === my) {
      await nextFrame();
      const video = videoRef.current;
      const ph = phaseRef.current;
      if (!video || video.readyState < 2) continue;

      if (ph === 'clearing') {
        let found = null;
        try {
          found = cfg.current.method === 'qr'
            ? await qrEngineRef.current.detect(video)
            : await describeFace(faceRef.current.faceapi, video);
        } catch { found = null; }
        if (phaseRef.current !== 'clearing') continue;
        emptyRef.current = found ? 0 : emptyRef.current + 1;
        if (emptyRef.current >= EMPTY_FRAMES) { baselineRef.current = null; setPhaseBoth('armed'); }
      } else if (ph === 'armed' && cfg.current.trigger === 'presence') {
        const t = performance.now();
        const g = grabSmallGray(video, smallCanvas.current);
        if (!baselineRef.current) { baselineRef.current = g; continue; }
        const d = meanAbsDiff(g, baselineRef.current);
        const p = presenceRef.current;
        if (d > PRESENCE_DIFF_THRESHOLD) {
          if (!p.streak) p.first = t;
          p.streak += 1;
          if (p.streak >= PRESENCE_FRAMES) startMeasuring(p.first);
        } else {
          p.streak = 0;
          const b = baselineRef.current;
          for (let i = 0; i < b.length; i++) b[i] = 0.9 * b[i] + 0.1 * g[i]; // sigue cambios lentos de luz
        }
      } else if (ph === 'measuring') {
        const tIter = performance.now();
        if (tIter - t0Ref.current > ATTEMPT_TIMEOUT_MS) { finish('timeout', null, null); continue; }
        let outcome = null;
        try {
          if (cfg.current.method === 'qr') {
            const code = await qrEngineRef.current.detect(video);
            if (code !== null) outcome = validRef.current.has(code) ? 'ok' : 'denied';
          } else {
            const desc = await describeFace(faceRef.current.faceapi, video);
            if (desc && refDescRef.current) {
              outcome = euclidean(desc, refDescRef.current) < cfg.current.threshold ? 'ok' : 'denied';
            }
          }
        } catch (e) {
          setError(`Error del motor: ${e.message}`);
          outcome = null;
        }
        if (outcome && phaseRef.current === 'measuring') {
          const tEnd = performance.now();
          finish(outcome, tEnd - t0Ref.current, tEnd - tIter);
        }
      }
    }
  }, [finish]);

  const stopAll = useCallback(() => {
    runRef.current += 1;
    clearTimeout(timerRef.current);
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    seqRef.current = { active: false, done: 0, total: 0 };
    setSeq({ active: false, done: 0, total: 0 });
    setCameraOn(false);
    setPhaseBoth('idle');
  }, []);

  // Al salir de la página: apagar cámara y descartar el vector facial.
  useEffect(() => () => {
    runRef.current += 1;
    clearTimeout(timerRef.current);
    stopStream(streamRef.current);
    refDescRef.current = null;
  }, []);

  useEffect(() => () => { if (refThumb) URL.revokeObjectURL(refThumb); }, [refThumb]);

  const prepareEngine = useCallback(async (m, choice) => {
    setError('');
    if (m === 'qr') {
      setStatus('Preparando lector QR…');
      qrEngineRef.current = await createQrEngine(choice);
      setStatus(`Motor QR: ${qrEngineRef.current.name}`);
    } else {
      setStatus('Cargando modelos faciales (una sola vez)…');
      faceRef.current = await loadFaceEngine();
      setStatus(`Modelos listos (backend ${faceRef.current.backend})`);
    }
  }, []);

  const startCamera = async (facingMode = cfg.current.facing) => {
    setError('');
    try {
      stopStream(streamRef.current);
      const stream = await openCamera(facingMode);
      streamRef.current = stream;
      const v = videoRef.current;
      v.srcObject = stream;
      await v.play();
      setCameraOn(true);
      await prepareEngine(cfg.current.method, qrChoice);
      loop();
    } catch (e) {
      stopAll();
      setError(
        e.name === 'NotAllowedError'
          ? 'Permiso de cámara denegado. Habilitalo en el navegador y volvé a intentar.'
          : `No se pudo iniciar: ${e.message}`,
      );
    }
  };

  const switchMethod = async (m) => {
    if (m === method) return;
    runRef.current += 1;
    clearTimeout(timerRef.current);
    seqRef.current = { active: false, done: 0, total: 0 };
    setSeq({ active: false, done: 0, total: 0 });
    setPhaseBoth('idle');
    setLast(null);
    setMethod(m);
    cfg.current.method = m;
    const f = m === 'face' ? 'user' : 'environment';
    setFacing(f);
    if (cameraOn) {
      await startCamera(f);
    }
  };

  const flipCamera = async () => {
    const f = facing === 'user' ? 'environment' : 'user';
    setFacing(f);
    cfg.current.facing = f;
    runRef.current += 1;
    setPhaseBoth('idle');
    await startCamera(f);
  };

  const onRefPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setRefReady(false);
    refDescRef.current = null;
    setStatus('Analizando foto de referencia…');
    const url = URL.createObjectURL(file);
    try {
      const { faceapi } = faceRef.current || (faceRef.current = await loadFaceEngine());
      const img = await faceapi.bufferToImage(file);
      const desc = await describeFace(faceapi, img);
      if (!desc) throw new Error('No se detectó ningún rostro en la foto. Probá con otra, de frente y con buena luz.');
      refDescRef.current = desc;
      setRefThumb(url);
      setRefReady(true);
      setStatus('Foto de referencia lista (el vector queda solo en memoria).');
    } catch (err) {
      URL.revokeObjectURL(url);
      setError(err.message);
    }
  };

  const clearRef = () => {
    refDescRef.current = null;
    setRefThumb('');
    setRefReady(false);
  };

  const canArm = cameraOn && phase === 'idle' && (method === 'qr' || refReady);

  const startSingle = () => { seqRef.current = { active: false, done: 0, total: 0 }; setSeq({ active: false, done: 0, total: 0 }); arm(); };
  const startSequence = () => {
    const total = Math.max(1, Math.min(200, Number(seqN) || 20));
    seqRef.current = { active: true, done: 0, total };
    setSeq({ active: true, done: 0, total });
    arm();
  };
  const cancelRun = () => {
    clearTimeout(timerRef.current);
    seqRef.current = { active: false, done: 0, total: 0 };
    setSeq({ active: false, done: 0, total: 0 });
    setPhaseBoth('idle');
  };

  const phaseText = {
    idle: 'Listo',
    clearing: 'Retirá el código/rostro de la cámara…',
    armed: trigger === 'presence' ? 'Armado: esperando que aparezca el código/rostro…' : 'Armado: tocá “Ya está en cámara” cuando lo tengas enfrente',
    measuring: 'Midiendo…',
    cooldown: 'Registrado',
  }[phase];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <header>
          <h1 className="text-2xl font-bold">PoC accesos al estadio: facial vs QR</h1>
          <p className="text-sm text-gray-600">
            Página de prueba interna, no pública. Todo se procesa en este navegador: no se envía ni se guarda ninguna imagen, captura ni vector facial.
          </p>
        </header>

        <BenchmarkResults />

        {!consented ? (
          <section className="bg-white border border-amber-300 rounded-lg p-4 space-y-3" aria-labelledby="cons-h">
            <h2 id="cons-h" className="font-bold">Antes de activar la cámara</h2>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>El reconocimiento facial trabaja con datos biométricos. Acá se calcula <strong>solo en tu dispositivo</strong> y no se transmite.</li>
              <li>Ninguna imagen, captura ni vector facial se guarda en servidor, en el almacenamiento del navegador ni en logs. Solo se conservan tiempos y resultados en la memoria de esta pestaña (se pierden al recargar).</li>
              <li>Usá únicamente fotos de prueba tuyas o de quien lo autorice; <strong>no cargues datos reales de socios</strong>.</li>
              <li>Si hay otras personas en cámara, avisales.</li>
            </ul>
            <button type="button" onClick={() => setConsented(true)} className="px-4 py-2 rounded bg-rojo text-white font-semibold">
              Entiendo y acepto
            </button>
          </section>
        ) : (
          <>
            <div role="tablist" aria-label="Método" className="flex gap-2">
              {Object.entries(METHOD_LABEL).map(([m, label]) => (
                <button key={m} role="tab" aria-selected={method === m} type="button" onClick={() => switchMethod(m)}
                  className={`flex-1 px-3 py-2 rounded font-semibold border ${method === m ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-300'}`}>
                  {label}
                </button>
              ))}
            </div>

            <section className="bg-white rounded-lg border border-gray-200 p-4 space-y-3" aria-label="Cámara">
              <div className="relative bg-black rounded overflow-hidden aspect-video">
                <video ref={videoRef} playsInline muted className="w-full h-full object-contain"
                  style={facing === 'user' ? { transform: 'scaleX(-1)' } : undefined} />
                {!cameraOn && (
                  <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">Cámara apagada</div>
                )}
                {cameraOn && (
                  <div className="absolute left-2 top-2 right-2 flex justify-between text-xs">
                    <span className="bg-black/70 text-white px-2 py-1 rounded">{phaseText}</span>
                    {seq.active && <span className="bg-black/70 text-white px-2 py-1 rounded">Secuencia {seq.done}/{seq.total}</span>}
                  </div>
                )}
                {last && (
                  <div className={`absolute inset-x-0 bottom-0 p-2 text-center font-bold text-white ${last.decision === 'ok' ? 'bg-green-700/90' : last.decision === 'denied' ? 'bg-red-700/90' : 'bg-gray-700/90'}`}>
                    {last.decision === 'ok' ? 'ACCESO OK' : last.decision === 'denied' ? 'ACCESO DENEGADO' : 'SIN LECTURA'}
                    {last.totalMs !== null && ` · ${Math.round(last.totalMs)} ms`}
                    {' · '}{last.correct ? 'acertó' : `error (${last.error})`}
                  </div>
                )}
              </div>
              <canvas ref={smallCanvas} className="hidden" />

              {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
              {status && <p className="text-xs text-gray-600" aria-live="polite">{status}</p>}

              <div className="flex flex-wrap gap-2">
                {!cameraOn ? (
                  <button type="button" onClick={() => startCamera()} className="px-3 py-2 rounded bg-rojo text-white font-semibold">Activar cámara</button>
                ) : (
                  <>
                    <button type="button" onClick={stopAll} className="px-3 py-2 rounded border border-gray-300">Apagar cámara</button>
                    <button type="button" onClick={flipCamera} className="px-3 py-2 rounded border border-gray-300">Cambiar cámara</button>
                  </>
                )}
              </div>

              <fieldset className="grid sm:grid-cols-2 gap-3 text-sm">
                <label className="flex flex-col gap-1">Disparo del cronómetro
                  <select value={trigger} onChange={(e) => setTrigger(e.target.value)} disabled={phase !== 'idle'} className="border rounded px-2 py-1.5">
                    <option value="presence">Automático: cuando algo entra en cámara</option>
                    <option value="manual">Manual: botón “Ya está en cámara”</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">Resultado esperado de este intento
                  <select value={expected} onChange={(e) => setExpected(e.target.value)} className="border rounded px-2 py-1.5">
                    <option value="ok">Debería dar acceso OK</option>
                    <option value="denied">Debería ser denegado</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">Intentos de la secuencia
                  <input type="number" min="1" max="200" value={seqN} onChange={(e) => setSeqN(e.target.value)} disabled={phase !== 'idle'} className="border rounded px-2 py-1.5" />
                </label>
                {method === 'qr' ? (
                  <label className="flex flex-col gap-1">Motor QR
                    <select value={qrChoice} disabled={phase !== 'idle'}
                      onChange={async (e) => { setQrChoice(e.target.value); if (cameraOn) await prepareEngine('qr', e.target.value); }}
                      className="border rounded px-2 py-1.5">
                      <option value="auto">Automático (BarcodeDetector si existe, si no jsQR)</option>
                      <option value="jsqr">Forzar jsQR</option>
                    </select>
                  </label>
                ) : (
                  <label className="flex flex-col gap-1">Umbral de distancia facial: {threshold.toFixed(2)} (menor = más estricto)
                    <input type="range" min="0.4" max="0.7" step="0.01" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
                  </label>
                )}
              </fieldset>

              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={!canArm} onClick={startSingle} className="px-3 py-2 rounded bg-gray-900 text-white disabled:opacity-40">Un intento</button>
                <button type="button" disabled={!canArm} onClick={startSequence} className="px-3 py-2 rounded bg-gray-900 text-white disabled:opacity-40">Secuencia de {Math.max(1, Number(seqN) || 20)}</button>
                {phase !== 'idle' && <button type="button" onClick={cancelRun} className="px-3 py-2 rounded border border-gray-300">Cancelar</button>}
                {trigger === 'manual' && phase === 'armed' && (
                  <button type="button" onPointerDown={() => startMeasuring(performance.now())} className="px-4 py-2 rounded bg-green-700 text-white font-bold">Ya está en cámara</button>
                )}
              </div>
              {method === 'face' && !refReady && <p className="text-xs text-amber-700">Subí primero una foto de referencia para poder medir.</p>}
              <p className="text-xs text-gray-500">
                Cómo se mide: el reloj (performance.now) arranca cuando el código/rostro aparece en cámara (o al tocar el botón en modo manual) y se detiene al emitir “acceso OK/denegado”.
                En la secuencia, retirá el código/persona entre intentos: cada uno se vuelve a armar solo.
              </p>
            </section>

            {method === 'qr' ? (
              <section className="bg-white rounded-lg border border-gray-200 p-4 space-y-2" aria-label="Generador de QR de prueba">
                <h2 className="font-bold">Generador de QR de prueba</h2>
                <QrGenerator validCodes={validCodes} onAddValid={addValid} />
              </section>
            ) : (
              <section className="bg-white rounded-lg border border-gray-200 p-4 space-y-2" aria-label="Foto de referencia">
                <h2 className="font-bold">Foto de referencia (de prueba)</h2>
                <p className="text-sm text-gray-600">Subí una foto de quien va a probar. No sale del navegador. Solo fotos de prueba, nunca de socios reales.</p>
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" onChange={onRefPhoto} aria-label="Foto de referencia" className="text-sm" />
                  {refReady && (
                    <>
                      <img src={refThumb} alt="Foto de referencia cargada" className="w-14 h-14 object-cover rounded" />
                      <button type="button" onClick={clearRef} className="text-sm underline">Quitar</button>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500">Para medir “denegado”, poné en cámara a otra persona y elegí “Debería ser denegado”.</p>
              </section>
            )}
          </>
        )}

        <ResultsPanel attempts={attempts} onReset={() => { setAttempts([]); setLast(null); }} />
        <ConclusionTable />
      </div>
    </div>
  );
}
