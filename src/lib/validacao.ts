import { whatsappValido } from './whatsapp';

export type Campo = 'nome' | 'whatsapp' | 'perfil' | 'cidade' | 'aceite';

/** Ordem em que os campos aparecem na tela: é a ordem do foco no primeiro erro. */
export const ORDEM_DOS_CAMPOS: readonly Campo[] = ['nome', 'whatsapp', 'perfil', 'cidade', 'aceite'];

export const PERFIS: readonly string[] = ['Adestramento', 'Passeio ou pet sitter', 'Creche ou hotel', 'Banho e tosa', 'Veterinária', 'Outro'];

export interface Dados { nome: string; whatsapp: string; perfil: string; cidade: string; aceite: boolean }
export type Erros = Partial<Record<Campo, string>>;

export const MENSAGENS: Record<Campo, string> = {
  nome: 'Diga como podemos chamar você.',
  whatsapp: 'Confira o número com DDD, por exemplo (11) 98765-4321.',
  perfil: 'Escolha a opção mais próxima do seu trabalho.',
  cidade: 'Informe sua cidade e estado.',
  aceite: 'Precisamos do seu aceite para entrar em contato.',
};

const REGRAS: Record<Campo, (d: Dados) => boolean> = {
  nome: (d) => d.nome.trim().length >= 2,
  whatsapp: (d) => whatsappValido(d.whatsapp),
  perfil: (d) => PERFIS.includes(d.perfil),
  cidade: (d) => d.cidade.trim().length >= 3,
  aceite: (d) => d.aceite === true,
};

export function validarCampo(campo: Campo, dados: Dados): string {
  return REGRAS[campo](dados) ? '' : MENSAGENS[campo];
}

export function validar(dados: Dados): Erros {
  const erros: Erros = {};
  for (const c of ORDEM_DOS_CAMPOS) {
    const m = validarCampo(c, dados);
    if (m) erros[c] = m;
  }
  return erros;
}

export function primeiroCampoComErro(erros: Erros): Campo | undefined {
  return ORDEM_DOS_CAMPOS.find((c) => erros[c]);
}
