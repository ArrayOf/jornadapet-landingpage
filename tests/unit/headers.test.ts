import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('public/_headers', () => {
  it('arquivos com hash em /_astro/ têm cache longo e imutável', () => {
    const conteudo = readFileSync('public/_headers', 'utf-8');
    expect(conteudo).toMatch(/^\/_astro\/\*\s*$/m);
    expect(conteudo).toMatch(/^\s+Cache-Control: public, max-age=31536000, immutable\s*$/m);
  });
});
