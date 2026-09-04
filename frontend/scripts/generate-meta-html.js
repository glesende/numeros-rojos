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
  {
    path: 'derechos',
    title: 'Derechos sobre jugadores de Independiente | Números Rojos',
    description:
      'Derechos económicos del Club Atlético Independiente sobre sus jugadores: porcentajes del pase, cláusulas y fuentes. No incluye derechos de formación.',
  },
  {
    path: 'elecciones',
    title: 'Elecciones de Independiente | Números Rojos',
    description:
      'Las listas que se postulan en las elecciones de Independiente: candidatos, propuestas, compromisos y metas verificables, analizados con el mismo criterio para todas.',
  },
];

function renderRouteHtml(indexHtml, { title, description, url }) {
  return indexHtml
    // og:title
    .replace(
      /(<meta\s+property="og:title"\s+content=")[^"]*(")/,
      `$1${title}$2`
    )
    // og:description
    .replace(
      /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
      `$1${description}$2`
    )
    // og:url
    .replace(
      /(<meta\s+property="og:url"\s+content=")[^"]*(")/,
      `$1${url}$2`
    )
    // twitter:title
    .replace(
      /(<meta\s+name="twitter:title"\s+content=")[^"]*(")/,
      `$1${title}$2`
    )
    // twitter:description
    .replace(
      /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/,
      `$1${description}$2`
    )
    // meta description
    .replace(
      /(<meta\s+name="description"\s+content=")[^"]*(")/,
      `$1${description}$2`
    )
    // canonical
    .replace(
      /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
      `$1${url}$2`
    )
    // title tag
    .replace(
      /(<title>)[^<]*(<\/title>)/,
      `$1${title}$2`
    );
}

const indexHtml = readFileSync(join(distDir, 'index.html'), 'utf-8');

function writeRoute(routePath, title, description) {
  const url = `${baseUrl}/${routePath}`;
  const html = renderRouteHtml(indexHtml, { title, description, url });

  const outDir = join(distDir, routePath);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html, 'utf-8');

  console.log(`✓ dist/${routePath}/index.html generado`);
}

for (const route of routes) {
  writeRoute(route.path, route.title, route.description);
}

console.log(`\nMeta tags SEO generados para ${routes.length} rutas.`);

// Páginas de detalle por lista de elecciones (dinámico, requiere la API disponible en build time).
const apiUrl = process.env.VITE_API_URL;

if (apiUrl) {
  try {
    const res = await fetch(`${apiUrl}/elections`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { data: lists = [] } = await res.json();

    let count = 0;
    for (const list of lists) {
      if (!list.slug) continue;
      const title = `${list.name} | Elecciones | Números Rojos`;
      const description = `Candidatos, propuestas, compromisos y metas de ${list.name} para las elecciones de Independiente.`;
      writeRoute(`elecciones/${list.slug}`, title, description);
      count++;
    }
    console.log(`Meta tags SEO generados para ${count} lista(s) de elecciones.`);
  } catch (err) {
    console.warn(`⚠ No se pudieron generar las páginas de detalle de elecciones (${err.message}). Se omite, no corta el build.`);
  }
} else {
  console.warn('⚠ VITE_API_URL no está definida — se omiten las páginas de detalle de elecciones.');
}
