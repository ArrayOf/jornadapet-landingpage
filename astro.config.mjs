import { defineConfig } from 'astro/config';
import alpinejs from '@astrojs/alpinejs';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';

const site = process.env.PUBLIC_SITE_URL ?? 'https://jornadapet.arrayof.workers.dev';

export default defineConfig({
  site,
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    alpinejs({ entrypoint: '/src/scripts/alpine' }),
    icon({ include: { ph: ['*'] } }),
    sitemap({ filter: (page) => !page.includes('/obrigado') && !page.includes('/nao-enviado') && !page.includes('/404') }),
  ],
  vite: { plugins: [tailwindcss()] },
});
