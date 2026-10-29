# Tarjetas para compartir (og:tags + imagen)

Detalle de **balance** (`/balances/:id`), **contrato** (`/contratos/:id`) y **lista de elecciones** (`/elecciones/:slug`) tienen botón de compartir (`ShareButtons`: WhatsApp, X, Facebook, copiar enlace, y menú nativo en mobile) y preview propia con imagen 1200x630.

## Cómo funciona
- La SPA no puede dar og:tags por página (los crawlers no ejecutan JS). El nginx del contenedor `frontend` (`docker/nginx/default.frontend.conf`) detecta por User-Agent a los crawlers **sociales** (WhatsApp, Facebook/Instagram, X, Telegram, LinkedIn, Slack, Discord, etc.; Googlebot/Bingbot **no**, ven la SPA) y para esas tres rutas les proxia a la API.
- `GET /api/v1/share/{balances|contratos|elecciones}/{id|slug}` (`ShareController@page`): HTML mínimo con og:title/description/url/image + twitter:card. 404 si no existe (elecciones: también si la sección está deshabilitada).
- `GET /api/v1/share/.../image.png`: PNG dibujado con GD + DejaVu (`ShareCardRenderer`), con la cifra principal (balance: totales de nivel 1; contrato: salario, vencimiento, % pase; elecciones: candidatos y propuestas). Se cachea en `storage/app/share-cards/` con hash del contenido (cambia el dato → nueva imagen). Sin GD/fuente cae (302) a `og-image-nr.png`.
- URL pública de la imagen: `https://www.numerosrojos.net/api/api/v1/share/<tipo>/<id>/image.png`.

## Medición
Cada botón agrega `utm_source=<whatsapp|x|facebook|link|compartir>&utm_medium=organico&utm_campaign=<balance-ID|contrato-ID|eleccion-slug>`; se ve en «Origen del tráfico» de `/admin/uso` (ver `analytics.md`).

## Probar
`curl -A facebookexternalhit/1.1 https://numerosrojos.net/balances/<id>` debe devolver el HTML con og:image; sin ese UA, la SPA. Validadores: Facebook Sharing Debugger, o pegar el link en WhatsApp.

## Rollback
Solo código (`scripts/rollback-remote.sh <TAG>`); sin migraciones.
