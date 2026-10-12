import { describe, expect, it } from 'vitest';
import { guardarOrigem, lerOrigem } from '../../src/lib/utm';

function memoria() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } };
}

describe('lerOrigem', () => {
  it('pega só as chaves conhecidas, sem espaços e com no máximo 100 caracteres', () => {
    const o = lerOrigem(`?utm_source=instagram&utm_medium= dm &x=1&ref=marcos&utm_content=${'a'.repeat(150)}`);
    expect(o).toEqual({ utm_source: 'instagram', utm_medium: 'dm', ref: 'marcos', utm_content: 'a'.repeat(100) });
  });
  it('sem parâmetros, vazio', () => { expect(lerOrigem('')).toEqual({}); });
});

describe('guardarOrigem', () => {
  it('guarda a origem da primeira página e a devolve depois, sem parâmetros na URL', () => {
    const s = memoria();
    expect(guardarOrigem(s, '?utm_source=grupo')).toEqual({ utm_source: 'grupo' });
    expect(guardarOrigem(s, '')).toEqual({ utm_source: 'grupo' });
  });
  it('uma origem nova substitui a guardada', () => {
    const s = memoria();
    guardarOrigem(s, '?utm_source=grupo');
    expect(guardarOrigem(s, '?ref=marcos')).toEqual({ ref: 'marcos' });
  });
  it('storage que lança (aba anônima) não quebra: devolve a origem da URL', () => {
    const quebrado = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); } };
    expect(guardarOrigem(quebrado, '?utm_source=x')).toEqual({ utm_source: 'x' });
    expect(guardarOrigem(null, '')).toEqual({});
  });
  it('valor guardado corrompido é ignorado', () => {
    const s = memoria();
    s.setItem('jp-origem', '{nao é json');
    expect(guardarOrigem(s, '')).toEqual({});
  });
});
