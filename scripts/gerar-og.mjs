import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const raiz = new URL('..', import.meta.url);
const navegador = await chromium.launch();

const pagina = await navegador.newPage({ viewport: { width: 1200, height: 630 } });
await pagina.goto(new URL('tests/og/og.html', raiz).href);
await pagina.evaluate(() => document.fonts.ready);
await pagina.screenshot({ path: fileURLToPath(new URL('public/og.png', raiz)) });

const svg = readFileSync(new URL('public/favicon.svg', raiz), 'utf8');
const icone = await navegador.newPage({ viewport: { width: 180, height: 180 } });
await icone.setContent(`<body style="margin:0"><img src="data:image/svg+xml,${encodeURIComponent(svg)}" width="180" height="180"></body>`);
await icone.screenshot({ path: fileURLToPath(new URL('public/apple-touch-icon.png', raiz)) });

await navegador.close();
console.log('public/og.png e public/apple-touch-icon.png gerados');
