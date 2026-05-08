#!/usr/bin/env node

/**
 * Script post-build: genera versiones de index.html con OG tags y canonical específicos por ruta.
 * Se ejecuta automáticamente después de `npm run build` via el hook "postbuild".
 *
 * Genera dist/{ruta}/index.html con og:title, og:description, og:url,
 * twitter:title, twitter:description y canonical correctos para cada sección.
 */

import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');
const baseUrl = 'https://www.numerosrojos.net';

const routes = [
  {
    path: 'contratos',
    title: 'Contratos de jugadores de Independiente | Números Rojos',
    description:
      'Contratos profesionales del plantel de Independiente: fechas de vencimiento, salarios estimados, cláusulas y porcentajes del pase. Datos actualizados.',
  },
  {
    path: 'economia',
    title: 'Compromisos económicos de Independiente | Números Rojos',
    description:
      'Registro completo de compromisos económicos, deudas, pagos y cobros del Club Atlético Independiente. Fuentes periodísticas y oficiales.',
  },
  {
    path: 'balances',
    title: 'Balances oficiales de Independiente | Números Rojos',
    description:
      'Balances patrimoniales y estados contables oficiales del Club Atlético Independiente. Evolución histórica y desglose detallado.',
  },
  {
    path: 'estadisticas',
    title: 'Estadísticas del plantel de Independiente | Números Rojos',
    description:
      'Tabla de posiciones y fichas estadísticas de los jugadores del plantel de Independiente en el torneo actual.',
  },
  {
    path: 'estadio',
    title: 'Estadio Libertadores de América | Números Rojos',
    description:
      'Capacidad, sectores y datos del Estadio Libertadores de América del Club Atlético Independiente.',
  },
];

const indexHtml = readFileSync(join(distDir, 'index.html'), 'utf-8');

for (const route of routes) {
  const url = `${baseUrl}/${route.path}`;

  let html = indexHtml
    // og:title
    .replace(
      /(<meta\s+property="og:title"\s+content=")[^"]*(")/,
      `$1${route.title}$2`
    )
    // og:description
    .replace(
      /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
      `$1${route.description}$2`
    )
    // og:url
    .replace(
      /(<meta\s+property="og:url"\s+content=")[^"]*(")/,
      `$1${url}$2`
    )
    // twitter:title
    .replace(
      /(<meta\s+name="twitter:title"\s+content=")[^"]*(")/,
      `$1${route.title}$2`
    )
    // twitter:description
    .replace(
      /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/,
      `$1${route.description}$2`
    )
    // meta description
    .replace(
      /(<meta\s+name="description"\s+content=")[^"]*(")/,
      `$1${route.description}$2`
    )
    // canonical
    .replace(
      /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
      `$1${url}$2`
    )
    // title tag
    .replace(
      /(<title>)[^<]*(<\/title>)/,
      `$1${route.title}$2`
    );

  const outDir = join(distDir, route.path);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html, 'utf-8');

  console.log(`✓ dist/${route.path}/index.html generado`);
}

console.log(`\nMeta tags SEO generados para ${routes.length} rutas.`);
