import { describe, expect, it } from 'vitest';
import {
  REGEX_CODIGO, codigoParaWhatsapp, codigoValido, gerarCodigo, linkCompartilharWhatsapp,
  linkDeIndicacao, linkWhatsappEmpresa, mensagemDeIndicacao,
} from '../../src/lib/indicacao';

const memoria = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } }; };
let n = 0;
const sequencia = () => ['aaaaaaaa', 'bbbbbbbb', 'cccccccc'][n++ % 3];

describe('gerarCodigo', () => {
  it('8 caracteres do alfabeto sem ambíguos', () => { for (let i = 0; i < 200; i++) expect(gerarCodigo()).toMatch(REGEX_CODIGO); });
  it('descarta bytes que enviesariam o sorteio', () => {
    let chamada = 0;
    expect(gerarCodigo((b) => b.fill(chamada++ === 0 ? 255 : 0))).toBe('aaaaaaaa');
  });
});

describe('codigoValido', () => {
  it.each(['k7m2pq9x', 'abcdefgh', '23456789'])('aceita %s', (c) => expect(codigoValido(c)).toBe(true));
  it.each(['K7M2PQ9X', 'k7m2pq9', 'k7m2pq9xx', 'k7m2pq0x', 'k7m2pqox', 'k7m2pqlx', 'k7m2pqix', '', null, 12345678])('recusa %s', (c) => expect(codigoValido(c)).toBe(false));
});

describe('codigoParaWhatsapp', () => {
  it('um código por WhatsApp: o mesmo reusa, outro ganha código novo', () => {
    n = 0; const s = memoria();
    const a = codigoParaWhatsapp(s, '(19) 99876-1234', sequencia);
    expect(codigoParaWhatsapp(s, '+55 19 99876-1234', sequencia)).toBe(a);
    expect(codigoParaWhatsapp(s, '(11) 98765-4321', sequencia)).not.toBe(a);
  });
  it('troca código guardado inválido e ignora mapa corrompido', () => {
    const s = memoria(); s.setItem('jp-codigos', '{nao é json');
    expect(codigoParaWhatsapp(s, '(19) 99876-1234', () => 'abcdefgh')).toBe('abcdefgh');
    s.setItem('jp-codigos', JSON.stringify({ '19998761234': 'invalido!' }));
    expect(codigoParaWhatsapp(s, '(19) 99876-1234', () => 'cdefghjk')).toBe('cdefghjk');
  });
  it('storage nulo ou que lança: ainda devolve código', () => {
    expect(codigoParaWhatsapp(null, '(19) 99876-1234', () => 'abcdefgh')).toBe('abcdefgh');
    const quebrado = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); } };
    expect(codigoParaWhatsapp(quebrado, '(19) 99876-1234', () => 'abcdefgh')).toBe('abcdefgh');
  });
});

describe('links e mensagem', () => {
  it('link com ref e UTMs por meio', () => {
    expect(linkDeIndicacao('https://jornadapet.arrayof.workers.dev/', 'k7m2pq9x', 'whatsapp'))
      .toBe('https://jornadapet.arrayof.workers.dev/?ref=k7m2pq9x&utm_source=indicacao&utm_medium=whatsapp');
    expect(linkDeIndicacao('https://x.dev', 'k7m2pq9x', 'link')).toBe('https://x.dev/?ref=k7m2pq9x&utm_source=indicacao&utm_medium=link');
  });
  it('mensagem na voz do colega, termina no link, sem travessão', () => {
    const m = mensagemDeIndicacao('https://x.dev/?ref=k7m2pq9x');
    expect(m).toBe('Pedi convite para testar a JornadaPet: organiza clientes, agenda e quem ainda falta pagar, tudo pelo Telegram. É feita para adestrador e não custa nada durante o teste. Pede o seu aqui: https://x.dev/?ref=k7m2pq9x');
    expect(m).not.toMatch(/[—–]/);
  });
  it('compartilhar codifica acentos, & e ?', () => {
    const url = linkCompartilharWhatsapp('É feita: https://x.dev/?ref=a&utm_medium=whatsapp');
    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    expect(decodeURIComponent(url.slice('https://wa.me/?text='.length))).toBe('É feita: https://x.dev/?ref=a&utm_medium=whatsapp');
    expect(url).not.toContain('&utm');
  });
  it('WhatsApp da empresa só com número válido', () => {
    expect(linkWhatsappEmpresa('(11) 98765-4321')).toBe('https://wa.me/5511987654321');
    expect(linkWhatsappEmpresa('')).toBeNull();
    expect(linkWhatsappEmpresa('98765-4321')).toBeNull();
  });
});
