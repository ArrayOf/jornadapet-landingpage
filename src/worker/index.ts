import { tratarConvite, type Ambiente } from './convite';

interface Env extends Ambiente { ASSETS: { fetch(req: Request): Promise<Response> } }

/** Só /api/* passa por aqui (run_worker_first); o resto são os arquivos estáticos do dist/. */
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url);
    if (pathname === '/api/convite') return tratarConvite(req, env);
    return env.ASSETS.fetch(req);
  },
};
