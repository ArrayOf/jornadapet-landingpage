import { describe, expect, it } from 'vitest';
import { chaveDoFormulario } from '../../src/lib/config';

describe('chaveDoFormulario', () => {
  it('devolve a chave quando existe', () => { expect(chaveDoFormulario('abc', true)).toBe('abc'); });
  it('fora de produção aceita chave vazia', () => { expect(chaveDoFormulario(undefined, false)).toBe(''); });
  it('em produção sem chave, falha o build', () => {
    expect(() => chaveDoFormulario('', true)).toThrow(/PUBLIC_FORM_ACCESS_KEY/);
    expect(() => chaveDoFormulario(undefined, true)).toThrow(/PUBLIC_FORM_ACCESS_KEY/);
  });
});
