import { describe, expect, it } from 'vitest';
import { MENSAGENS, ORDEM_DOS_CAMPOS, PERFIS, primeiroCampoComErro, validar, validarCampo, type Dados } from '../../src/lib/validacao';

const ok: Dados = { nome: 'Camila Duarte', whatsapp: '(19) 99876-1234', perfil: 'Adestramento', cidade: 'Campinas, SP', aceite: true };

describe('validarCampo', () => {
  it('aceita dados completos', () => {
    for (const c of ORDEM_DOS_CAMPOS) expect(validarCampo(c, ok)).toBe('');
  });
  it.each([
    ['nome', { nome: ' A ' }],
    ['nome', { nome: '' }],
    ['whatsapp', { whatsapp: '98765-4321' }],
    ['perfil', { perfil: '' }],
    ['perfil', { perfil: 'Astronauta' }],
    ['cidade', { cidade: ' SP ' }],
    ['aceite', { aceite: false }],
  ] as const)('recusa %s inválido', (campo, troca) => {
    expect(validarCampo(campo, { ...ok, ...troca })).toBe(MENSAGENS[campo]);
  });
});

describe('validar e foco', () => {
  it('não devolve nada quando está tudo certo', () => { expect(validar(ok)).toEqual({}); });
  it('o primeiro erro segue a ordem da tela, não a ordem de digitação', () => {
    const erros = validar({ ...ok, cidade: '', perfil: '' });
    expect(Object.keys(erros).sort()).toEqual(['cidade', 'perfil']);
    expect(primeiroCampoComErro(erros)).toBe('perfil');
  });
  it('sem erros, sem campo', () => { expect(primeiroCampoComErro({})).toBeUndefined(); });
});

describe('textos', () => {
  it('perfis e mensagens são os do protótipo v2', () => {
    expect(PERFIS).toEqual(['Adestramento', 'Passeio ou pet sitter', 'Creche ou hotel', 'Banho e tosa', 'Veterinária', 'Outro']);
    expect(MENSAGENS.whatsapp).toBe('Confira o número com DDD, por exemplo (11) 98765-4321.');
    for (const m of Object.values(MENSAGENS)) expect(m).not.toMatch(/[—–]/);
  });
});
