import { useEffect, useState } from 'react';

function QrImage({ text }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let alive = true;
    if (!text) { setSrc(''); return undefined; }
    import('qrcode')
      .then(({ default: QRCode }) => QRCode.toDataURL(text, { margin: 2, width: 320, errorCorrectionLevel: 'M' }))
      .then((url) => { if (alive) setSrc(url); })
      .catch(() => { if (alive) setSrc(''); });
    return () => { alive = false; };
  }, [text]);
  if (!src) return <div className="w-48 h-48 bg-gray-100 rounded" />;
  return <img src={src} alt={`Código QR de prueba: ${text}`} className="w-48 h-48 bg-white rounded border border-gray-200" />;
}

/**
 * Generador de QR de prueba. Los códigos "válidos" viven solo en memoria de esta pestaña
 * (no hay padrón real): el lector decide OK si el QR leído está en esta lista.
 */
export default function QrGenerator({ validCodes, onAddValid }) {
  const [shown, setShown] = useState({ text: '', valid: true });

  const newCode = (valid) => {
    const id = Math.random().toString(36).slice(2, 8).toUpperCase();
    const text = `${valid ? 'NR-OK' : 'NR-NO'}-${id}`;
    if (valid) onAddValid(text);
    setShown({ text, valid });
  };

  useEffect(() => {
    if (!shown.text) newCode(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start">
      <QrImage text={shown.text} />
      <div className="space-y-2 text-sm">
        <p>
          Mostrando: <code className="bg-gray-100 px-1 rounded">{shown.text}</code>{' '}
          <span className={shown.valid ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
            ({shown.valid ? 'válido: debería dar acceso OK' : 'inválido: debería ser denegado'})
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => newCode(true)} className="px-3 py-2 rounded bg-green-700 text-white">
            Generar QR válido
          </button>
          <button type="button" onClick={() => newCode(false)} className="px-3 py-2 rounded bg-gray-700 text-white">
            Generar QR inválido
          </button>
        </div>
        <p className="text-gray-600">
          Apuntá la cámara a este QR desde otro dispositivo (o impreso). Códigos válidos generados en esta sesión: {validCodes.length}.
        </p>
      </div>
    </div>
  );
}
