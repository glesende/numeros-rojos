const ROWS = [
  ['Tiempo de respuesta', 'Muy bajo y estable: decodificar un QR cuesta decenas de ms; el cuello de botella es que la persona lo muestre y lo enfoque.', 'Más alto y variable: detectar + calcular el vector + comparar; depende del dispositivo (GPU/CPU) y de que el rostro esté de frente.'],
  ['Errores', 'Casi nulos si el QR es legible (pantalla rota, brillo bajo o reflejos son la causa típica). No confunde personas.', 'Falsos rechazos y falsos accesos posibles; hay que fijar un umbral. Depende de la calidad de la foto de referencia.'],
  ['Gente en movimiento', 'Se pierde fluidez: cada hincha tiene que sacar el celular y apuntar; en filas densas genera cuellos de botella.', 'Mejor flujo en teoría (manos libres), pero con movimiento y ángulos la detección falla más y hay que reintentar.'],
  ['Gorra / barbijo / bufanda', 'No le afecta.', 'Degrada la detección y la comparación: es el caso más frecuente en cancha. Medilo con los dos casos.'],
  ['Luz de noche / contraluz', 'Depende del brillo de la pantalla del celular; la mayoría rinde bien. Los reflejos de focos molestan.', 'Sensible a poca luz y a contraluz; suele requerir iluminación o cámaras especiales (IR).'],
  ['Costo', 'Bajo: lector/cámara simple y un sistema que emite QR firmados.', 'Alto: cámaras de mejor calidad, cómputo, enrolamiento previo de cada socio y mantenimiento.'],
  ['Privacidad y legal', 'Datos mínimos; el riesgo principal es que el QR se comparta o se copie (se mitiga con QR que rotan).', 'El rostro es dato biométrico sensible: exige base legal, consentimiento, evaluación de impacto y custodia segura. Consultar con Legal antes de avanzar.'],
  ['Fraude / suplantación', 'El QR se puede prestar o sacar captura (mitigable con rotación y vínculo al DNI).', 'Prestar el acceso es más difícil, pero hay ataques con fotos/pantallas si no hay detección de vida.'],
];

export default function ConclusionTable() {
  return (
    <section aria-labelledby="conc-h" className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <h2 id="conc-h" className="text-lg font-bold">Conclusión: pros y contras</h2>
      <p className="text-sm text-gray-600">
        Criterios cualitativos orientativos; el tiempo y los errores los decide la medición de arriba, corrida en el hardware y la luz reales del estadio.
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm align-top">
          <thead>
            <tr className="text-left border-b border-gray-200">
              <th className="py-2 pr-3">Criterio</th>
              <th className="py-2 pr-3">Lector QR</th>
              <th className="py-2 pr-3">Reconocimiento facial</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([c, qr, face]) => (
              <tr key={c} className="border-b border-gray-100">
                <th scope="row" className="py-2 pr-3 text-left font-semibold whitespace-nowrap">{c}</th>
                <td className="py-2 pr-3 min-w-[14rem]">{qr}</td>
                <td className="py-2 pr-3 min-w-[14rem]">{face}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm">
        <strong>Lectura sugerida:</strong> el QR gana en tiempo, errores, costo y privacidad; el facial solo compensa si la medición muestra que
        agiliza el flujo con gente en movimiento y se resuelven gorra/barbijo/luz y el marco legal. Una opción intermedia es QR como método
        principal y facial opcional (con consentimiento) para un carril aparte.
      </p>
    </section>
  );
}
