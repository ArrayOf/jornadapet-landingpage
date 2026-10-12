import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const indexar = import.meta.env.PUBLIC_INDEXAR === 'true';
  const corpo = indexar
    ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', site)}\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(corpo, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
