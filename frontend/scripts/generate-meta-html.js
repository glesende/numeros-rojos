#!/usr/bin/env node

/**
 * Script post-build: genera versiones de index.html con OG tags específicos por ruta.
 * Se ejecuta automáticamente después de `npm run build` via el hook "postbuild".
 *
 * Genera dist/{ruta}/index.html con og:title, og:description, og:url,
 * twitter:title y twitter:description específicos para cada sección del portal.
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
    title: 'Contratos del plantel de Independiente | Números Rojos',
    description: 'Salarios, fechas de vencimiento y condiciones contractuales de los jugadores del plantel de Independiente.',
  },
  {
    path: 'economia',
    title: 'Compromisos económicos de Independiente | Números Rojos',
    description: 'Registro de compromisos económicos, deudas y pagos del Club Atlético Independiente.',
  },
  {
    path: 'balances',
    title: 'Balances oficiales de Independiente | Números Rojos',
    description: 'Balances patrimoniales y estados contables oficiales del Club Atlético Independiente.',
  },
  {
    path: 'estadisticas',
    title: 'Estadísticas del plantel de Independiente | Números Rojos',
    description: 'Tabla de posiciones y fichas estadísticas de los jugadores del plantel de Independiente.',
  },
  {
    path: 'estadio',
    title: 'Estadio Libertadores de América | Números Rojos',
    description: 'Capacidad y distribución de sectores del estadio Libertadores de América de Independiente.',
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
    );

  const outDir = join(distDir, route.path);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html, 'utf-8');

  console.log(`✓ dist/${route.path}/index.html generado`);
}

console.log(`\nMeta tags OG generados para ${routes.length} rutas.`);
