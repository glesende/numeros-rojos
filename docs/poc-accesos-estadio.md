# PoC accesos al estadio: reconocimiento facial vs lector QR (tarea #372)

Página **oculta** `https://www.numerosrojos.net/estadio-accesos`. Pedido del CEO (2026-11-13): comparar tiempos de respuesta de reconocimiento facial y lector QR para decidir el método de acceso al estadio.

## Cómo usarla
1. Abrir la URL directa (HTTPS; en móvil o escritorio). Aceptar el aviso de consentimiento y tocar **Activar cámara**.
2. **Lector QR**: el generador muestra un QR *válido* (se registra en memoria) y permite generar uno *inválido*. Apuntar la cámara a ese QR desde otro dispositivo/impreso. Válido → "acceso OK"; inválido o desconocido → "denegado".
3. **Reconocimiento facial**: subir una foto de prueba (de quien va a probar; nunca de socios). Se calcula el vector en el navegador; "OK" si la distancia al rostro en cámara es menor al umbral (0,60 por defecto, ajustable).
4. Elegir el **resultado esperado** del intento (OK / denegado) para calcular aciertos, y lanzar **Un intento** o **Secuencia de N** (20 por defecto; se re-arma sola). Para comparar justo, correr la misma secuencia con los dos métodos.
5. Ver tabla comparativa (n, mediana, p95, mín, máx, acierto, falsos accesos/rechazos, timeouts) y gráfico; **Exportar CSV**. Los resultados se pierden al recargar la pestaña.

## Cómo se mide
- Reloj: `performance.now()`. **t0** = instante en que algo entra en cámara; **t1** = emisión de "acceso OK/denegado". `total_ms = t1 - t0` (columna principal). `compute_ms` = lo que tardó solo la última pasada de detección + comparación (el resto es esperar a que el código/rostro quede legible).
- Disparo **automático** (por defecto): se verifica primero que la escena esté vacía (3 lecturas seguidas sin código/rostro, para que retirar el objeto no cuente como "presencia"), se toma el fondo y t0 es el primer cuadro con diferencia media > 12/255 durante 2 cuadros seguidos (error ≤ 1 cuadro ≈ 33 ms). Disparo **manual**: t0 = toque del botón "Ya está en cámara" (útil con el celular en la mano, donde el temblor dispara la presencia).
- Desde t0 recién corre el detector, en cada cuadro, hasta decidir o hasta 5 s (**timeout**: cuenta como error, no entra en los tiempos).
- QR: `BarcodeDetector` nativo si existe; si no, `jsQR` (cuadro ≤ 640 px). Se puede forzar jsQR. Facial: `@vladmandic/face-api` (TinyFaceDetector 320 px + landmarks tiny + red de reconocimiento, vector de 128), backend WebGL con calentamiento previo (la primera inferencia compila shaders y no se mide).
- Percentil p95 por rango más cercano; con n < 20 coincide con el máximo.
- Acierto = decisión igual a la esperada. Falso acceso: OK cuando debía denegar. Falso rechazo: denegó cuando debía OK.
- Limitación: los tiempos dependen del dispositivo, la cámara y la luz; la medición vale para el equipo donde se corre. Referencia de laboratorio (Chrome headless con cámara simulada, GPU por software): QR ≈ 55 ms, facial ≈ 440 ms.

## Privacidad y seguridad
- 100 % en el navegador: sin llamadas de red de la página (los modelos se sirven desde nuestro dominio en `/poc-modelos-facial/`, sin CDN ni APIs externas). Ninguna imagen, captura ni vector facial se envía ni se guarda en servidor, localStorage/sessionStorage/IndexedDB ni logs; el vector vive en memoria y se descarta al quitar la foto o salir. Solo se guardan tiempos y resultados en memoria; el CSV contiene únicamente eso.
- Aviso de consentimiento antes de activar la cámara. No se usan datos reales de socios. La analítica (GA4) no registra esta ruta.

## Cómo se mantiene oculta
- Sin enlaces: no está en menú, home, `/estadio`, footer, sitemap (`SitemapController`), `robots.txt` ni manifest. No se agregó `Disallow` a propósito: listaría la URL y, además, impediría que el buscador vea el `noindex`.
- `noindex`: `<meta name="robots" content="noindex, nofollow">` en runtime, HTML estático generado en el postbuild (`dist/estadio-accesos/index.html`) y cabecera `X-Robots-Tag` en `docker/nginx/default.frontend.conf` (también `Cache-Control: no-store` y `Permissions-Policy: camera=(self)`).
- Renderiza fuera del `Layout` (sin menú ni footer).
- Tests: `frontend/tests/estadio-accesos-oculta.test.mjs` (ningún archivo la enlaza, no hay storage ni red), `frontend/tests/access-poc-stats.test.mjs` (estadísticas, CSV) y `PublicEndpointsTest` (sitemap). `make test-ci` corre `npm test` antes del build.

## Código
`frontend/src/pages/StadiumAccessPocPage.jsx`, `frontend/src/components/accessPoc/`, `frontend/src/lib/accessPoc/{stats,engines}.js`, modelos en `frontend/public/poc-modelos-facial/` (6,5 MB, copiados de `@vladmandic/face-api`).

## Retirar la PoC
Borrar la ruta y el import en `App.jsx`, los archivos de arriba, el bloque de `usePageTracking.js`, el de `generate-meta-html.js`, los `location` de nginx y las dependencias `@vladmandic/face-api`, `jsqr`, `qrcode`.
