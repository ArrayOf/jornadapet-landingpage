import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';

const site = process.env.PUBLIC_SITE_URL ?? 'https://jornadapet.arrayof.workers.dev';

export default defineConfig({
  site,
  trailingSlash: 'never',
  // CSS dentro do HTML: some a requisição que bloqueava a primeira pintura (plano de desempenho, 13/10/2026).
  build: { format: 'file', inlineStylesheets: 'always' },
  integrations: [
    icon({ include: { ph: ['*'] } }),
    sitemap({ filter: (page) => !page.includes('/obrigado') && !page.includes('/nao-enviado') && !page.includes('/404') }),
  ],
  vite: { plugins: [tailwindcss()] },
});
