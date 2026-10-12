import { describe, expect, it } from 'vitest';
import { digitosWhatsapp, mascararWhatsapp, whatsappValido } from '../../src/lib/whatsapp';

describe('digitosWhatsapp', () => {
  it.each([
    ['(11) 98765-4321', '11987654321'],
    ['+55 11 98765-4321', '11987654321'],
    ['55 (11) 98765-4321', '11987654321'],
    ['011 98765-4321', '11987654321'],
    ['(11)98765 4321', '11987654321'],
    ['(11) 3456-7890', '1134567890'],
    ['11 98765-43219999', '11987654321'],
    ['', ''],
  ])('%s → %s', (entrada, esperado) => { expect(digitosWhatsapp(entrada)).toBe(esperado); });
});

describe('mascararWhatsapp', () => {
  it.each([
    ['11987654321', '(11) 98765-4321'],
    ['+55 11 98765-4321', '(11) 98765-4321'],
    ['1134567890', '(11) 3456-7890'],
    ['119876', '(11) 9876'],
    ['11', '11'],
    ['1', '1'],
    ['', ''],
  ])('%s → %s', (entrada, esperado) => { expect(mascararWhatsapp(entrada)).toBe(esperado); });

  it('é estável ao reaplicar', () => {
    const uma = mascararWhatsapp('11987654321');
    expect(mascararWhatsapp(uma)).toBe(uma);
  });
});

describe('whatsappValido', () => {
  it.each(['(11) 98765-4321', '+55 11 98765-4321', '011 98765-4321', '(11) 3456-7890'])('aceita %s', (v) => {
    expect(whatsappValido(v)).toBe(true);
  });
  it.each(['98765-4321', '(11) 9876', '', 'abc'])('recusa %s', (v) => { expect(whatsappValido(v)).toBe(false); });
});
