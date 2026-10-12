import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/assets/passeador.jpg', () => ({ default: {} }));
vi.mock('../../src/assets/creche.jpg', () => ({ default: {} }));
vi.mock('../../src/assets/banho-tosa.jpg', () => ({ default: {} }));
vi.mock('../../src/assets/veterinario.jpg', () => ({ default: {} }));
vi.mock('../../src/assets/socio-mario.jpg', () => ({ default: {} }));
vi.mock('../../src/assets/socio-thiago.jpg', () => ({ default: {} }));

import { PASSOS, PERFIS_DA_PAGINA } from '../../src/data/conteudo';
import { PERFIS } from '../../src/lib/validacao';

describe('conteúdo', () => {
  it('todo cartão de perfil marca um perfil que o formulário aceita', () => {
    for (const p of PERFIS_DA_PAGINA) expect(PERFIS).toContain(p.perfil);
  });
  it('nenhum texto tem travessão', () => {
    const textos = [...PASSOS.map((p) => p.texto), ...PERFIS_DA_PAGINA.map((p) => p.titulo)];
    for (const t of textos) expect(t).not.toMatch(/[—–]/);
  });
});
