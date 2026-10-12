import { describe, expect, it } from 'vitest';
import { CHAVE_DE_TESTE_DO_TURNSTILE, chaveDoSiteTurnstile } from '../../src/lib/turnstile';

describe('chaveDoSiteTurnstile', () => {
  it('usa a chave configurada', () => { expect(chaveDoSiteTurnstile(' 0x4AAA ', true)).toBe('0x4AAA'); });
  it('fora de produção, sem chave, usa a chave de teste do Cloudflare (sempre passa)', () => {
    expect(chaveDoSiteTurnstile(undefined, false)).toBe(CHAVE_DE_TESTE_DO_TURNSTILE);
    expect(CHAVE_DE_TESTE_DO_TURNSTILE).toBe('1x00000000000000000000AA');
  });
  it('em produção, sem chave, falha o build', () => {
    expect(() => chaveDoSiteTurnstile('', true)).toThrow(/PUBLIC_TURNSTILE_SITE_KEY/);
  });
});
