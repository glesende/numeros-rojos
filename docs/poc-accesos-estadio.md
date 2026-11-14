# Accesos al estadio: QR vs reconocimiento facial (tareas #372, #373, #374, #379)

Página **oculta** `https://www.numerosrojos.net/estadio-accesos`. Pedido del CEO (2026-11-13): comparar QR y reconocimiento facial para decidir el método de acceso. Pedido del CEO (2026-11-14, #379): dejar solo el análisis resumido y el benchmark, sin la parte donde el usuario puede hacer la prueba.

## Qué muestra
Solo lectura, dentro del `Layout` del sitio (navbar y footer):
1. Encabezado.
2. **Análisis resumido** (`AccessSummary.jsx`): conclusión (QR) y 6 viñetas; todas las cifras salen de `src/data/accessBenchmark.json`, ninguna escrita a mano.
3. **Benchmark** (`BenchmarkResults.jsx`, #373): medianas, p95, errores, GPU vs sin GPU, tabla y barras. Método y datos crudos en `benchmark-accesos.md`.

No hay controles de prueba: no pide cámara ni permisos, no hay consentimiento, generador de QR, foto de referencia ni medición en vivo (eliminados en #379 con su código, los modelos de `public/` y las dependencias del sitio). Nginx envía `Permissions-Policy: camera=()`.

## Cómo se mantiene oculta
- Sin enlaces: no está en menú, home, `/estadio`, footer, sitemap (`SitemapController`), `robots.txt` ni manifest. No se agregó `Disallow` a propósito: listaría la URL y impediría que el buscador vea el `noindex`.
- `noindex`: `<meta name="robots" content="noindex, nofollow">` en runtime, HTML estático generado en el postbuild (`dist/estadio-accesos/index.html`) y cabecera `X-Robots-Tag` + `Cache-Control: no-store` en `docker/nginx/default.frontend.conf`.
- Sin analítica: `usePageTracking.js` excluye la ruta.
- Tests: `frontend/tests/estadio-accesos-oculta.test.mjs` (sin enlaces, noindex, sin cámara/controles/storage/red, sin restos de la PoC), `access-benchmark.test.mjs` (datos), `access-benchmark-stats.test.mjs` (estadísticas del laboratorio) y `PublicEndpointsTest` (sitemap). `make test-ci` corre `npm test` antes del build.

## Código
- Sitio: `frontend/src/pages/StadiumAccessPage.jsx`, `frontend/src/components/{AccessSummary,BenchmarkResults}.jsx`, `frontend/src/data/accessBenchmark.json`.
- Laboratorio del benchmark (no entra en el build del sitio): `frontend/bench/` (`accesos.{html,js}`, `lib/{engines,stats}.js`, modelos faciales en `modelos/`, 6,4 MB) y `scripts/benchmark-accesos/`. Las librerías `@vladmandic/face-api`, `jsqr` y `qrcode` son `devDependencies`, solo para `make benchmark-accesos`.

## Retirar la página
Borrar la ruta y el import en `App.jsx`, la página y los componentes de arriba, el bloque de `usePageTracking.js`, el de `generate-meta-html.js`, el `location` de nginx y, si ya no se necesita reproducir el benchmark, `frontend/bench/`, `scripts/benchmark-accesos/`, el target `benchmark-accesos` y las tres devDependencies.
