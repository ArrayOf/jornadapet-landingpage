import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/assets/passeador.jpg', () => ({ default: {} }));
vi.mock('../../src/assets/creche.jpg', () => ({ default: {} }));
vi.mock('../../src/assets/banho-tosa.jpg', () => ({ default: {} }));
vi.mock('../../src/assets/veterinario.jpg', () => ({ default: {} }));
vi.mock('../../src/assets/socio-mario.jpg', () => ({ default: {} }));
vi.mock('../../src/assets/socio-thiago.jpg', () => ({ default: {} }));

import { organizacao, paginaDePerguntas, siteWeb } from '../../src/lib/jsonld';

const site = new URL('https://jornadapet.com.br');

describe('JSON-LD', () => {
  it('organização com a ArrayOf como mãe e os sócios como fundadores', () => {
    const o = organizacao(site) as Record<string, any>;
    expect(o['@type']).toBe('Organization');
    expect(o.parentOrganization).toEqual({ '@type': 'Organization', name: 'ArrayOf', url: 'https://arrayof.com.br' });
    expect(o.founder.map((p: any) => p.sameAs)).toEqual(['https://www.linkedin.com/in/jmarioguedes/', 'https://www.linkedin.com/in/trfiladelfo/']);
    expect(o.email).toBe('contato@jornadapet.com.br');
  });
  it('site em pt-BR', () => { expect(siteWeb(site)).toMatchObject({ '@type': 'WebSite', inLanguage: 'pt-BR', url: 'https://jornadapet.com.br/' }); });
  it('perguntas com o mesmo texto da página', () => {
    const f = paginaDePerguntas([{ pergunta: 'P?', resposta: 'R.' }]) as Record<string, any>;
    expect(f.mainEntity[0]).toEqual({ '@type': 'Question', name: 'P?', acceptedAnswer: { '@type': 'Answer', text: 'R.' } });
  });
});
