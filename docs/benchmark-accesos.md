# Benchmark local QR vs reconocimiento facial (tarea #373)

Resultados publicados en `https://www.numerosrojos.net/estadio-accesos` (oculta, noindex). Esta es la medición de **laboratorio** que los respalda. Ver `poc-accesos-estadio.md` (la PoC interactiva #372 se retiró en #379; queda el laboratorio).

## Resultado (corrida del 2026-11-13, N = 100 por método)

Variante principal: **GPU real** (la más favorable al facial).

| Métrica | QR (jsQR) | Facial (face-api) |
|---|---|---|
| Mediana | 34,3 ms | 116,5 ms (3,4× más lento) |
| p95 | 40,5 ms | 132,6 ms |
| Mín – máx | 17,3 – 55,9 ms | 78,8 – 145,7 ms |
| Aciertos | 100 % (0 errores) | 79 % (1 falso acceso, 20 sin lectura) |
| CPU por intento (todo Chrome) | 115 ms | 1 230 ms (~11×) |
| Descarga | 10 KB gzip | 332 KB gzip + 6,4 MB de modelos |
| Pico memoria JS | 25 MB | 17 MB |

Variante **sin GPU** (WebGL por software, SwiftShader; peor caso para el facial): QR 68 ms (p95 88,6) vs facial 851,6 ms (p95 902,9) → 12,5× más lento; CPU 619 ms vs 17 505 ms por intento; 76 % de aciertos (4 falsos accesos, 20 sin lectura).

Conclusión: el QR decide ≥ 3× más rápido (12× sin GPU), sin errores y con ~11× menos CPU; el facial pesa 6,4 MB más y comete falsos accesos y lecturas fallidas.

## Método
- **Qué corre**: los motores de `frontend/bench/lib/engines.js`: jsQR (`BarcodeDetector` no existe en Chrome headless Linux) y face-api (TinyFaceDetector 320 + landmarks tiny + red de reconocimiento, umbral 0,60).
- **Cámara sintética** (sin cámara real): un `<canvas>` 1280×720 → `captureStream()` → `<video>`. Cada intento: se vacía la escena (3 lecturas seguidas sin objetivo), se pinta el objetivo y se corre el detector en cada cuadro (`requestAnimationFrame`) hasta decidir o 5 s (timeout = error, no entra en los tiempos). **t0** = instante en que se pinta el objetivo; **t1** = decisión OK/denegado. Incluye el retardo de cuadro del video, igual para ambos.
- **Misma secuencia** para ambos: N = 100 intentos (50 deben dar OK, 50 denegado, alternados), semilla 373. Cada intento varía posición, tamaño (340–500 px), brillo (0,75–1,25) y rotación (±5°).
- **QR**: 10 códigos válidos registrados; los OK usan uno válido, los denegados un código inexistente (generados con `qrcode`).
- **Facial**: tres rostros recortados de la foto de demostración `sample1.jpg` del paquete `@vladmandic/face-api` (MIT; se lee de `node_modules` al correr, no se copia ni se publica). Referencia = persona A; OK = persona A; denegado = personas B o C. No hay datos de socios. Ninguna imagen ni vector sale del navegador ni se guarda; el CSV solo tiene tiempos y resultados.
- **Calentamiento**: 3 pasadas sin medir (el facial compila shaders en la primera).
- **CPU**: suma del `cpuTime` de todos los procesos de Chrome (CDP `SystemInfo.getProcessInfo`) durante la corrida, dividida por N. Incluye el ciclo completo del intento (vaciado de escena y espera), igual para ambos métodos. Memoria: pico de `usedJSHeapSize`. Peso: gzip de los chunks del build de producción + tamaño de los modelos servidos.
- **Estadísticas**: `percentile`/`median`/`summarize` de `frontend/bench/lib/stats.js` (p95 por rango más cercano).

## Entorno de la corrida
Intel Core i7-1165G7 (8 hilos), 38 GB RAM, Linux 7.0.0-43, Chrome 157.0.8103.50 (`--headless=new`), Node 22.22.1, commit base `ad5f96c`. Variante GPU: GPU integrada del equipo; variante software: `--use-angle=swiftshader`.

## Limitaciones (importante)
- Laboratorio: **no** mide hardware de torniquetes, gente en movimiento, gorra/barbijo, luz de noche ni cámaras reales. Sirve para comparar métodos en igualdad de condiciones, no como promesa absoluta.
- Los errores del facial dependen de las fotos de prueba (rostros con maquillaje, inclinados o mirando abajo; la mayoría de los 20 "sin lectura" son de las personas B/C). Es indicativo; la diferencia de tiempo y CPU no depende de ellas.
- Los tiempos del facial sin lectura no entran en la mediana/p95.

## Reproducir
```
make benchmark-accesos                 # sin GPU, N=100 → docs/benchmark-accesos/software-gl/
make benchmark-accesos GL=default N=100  # GPU real → docs/benchmark-accesos/gpu/
```
Requiere Node ≥ 20 y Google Chrome (`CHROME_BIN` o `/usr/bin/google-chrome`). Código: `frontend/bench/accesos.{html,js}` (página de laboratorio, no se incluye en el build) y `scripts/benchmark-accesos/run.mjs`. Salida: `resultados-crudos.csv` (un renglón por intento: método, intento, esperado, decisión, acierto, error, total_ms, compute_ms, cuadros) y `resumen.json`.
Para actualizar la página: copiar ambos `resumen.json` a `frontend/src/data/accessBenchmark.json` como `{ "software": …, "gpu": … }`.
