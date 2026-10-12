import passeador from '../assets/passeador.jpg';
import creche from '../assets/creche.jpg';
import banhoTosa from '../assets/banho-tosa.jpg';
import veterinario from '../assets/veterinario.jpg';
import socioMario from '../assets/socio-mario.jpg';
import socioThiago from '../assets/socio-thiago.jpg';

export const CONTATO_EMAIL = 'contato@jornadapet.com.br';

export const LINKS_DA_NAV = [
  { rotulo: 'Como funciona', href: '#como-funciona' },
  { rotulo: 'Para quem', href: '#para-quem' },
  { rotulo: 'Sobre', href: '#sobre' },
  { rotulo: 'Perguntas', href: '#perguntas' },
] as const;

export const PASSOS = [
  { id: 'cadastre', titulo: 'Cadastre', icone: 'ph:address-book', tom: 'bg-mint', texto: 'Tutores e pets com WhatsApp, endereço preenchido pelo CEP e as observações de cada cão.' },
  { id: 'agende', titulo: 'Agende', icone: 'ph:calendar-check', tom: 'bg-sky', texto: 'Sessões por dia ou semana, repetição toda semana e aviso quando dois horários se cruzam.' },
  { id: 'acompanhe', titulo: 'Acompanhe', icone: 'ph:wallet', tom: 'bg-butter', texto: 'Registre o valor combinado e cada pagamento, inteiro ou em partes. O saldo se atualiza sozinho.' },
] as const;

/** `perfil` precisa ser um dos PERFIS de src/lib/validacao.ts: é o chip que o cartão marca no formulário. */
export const PERFIS_DA_PAGINA = [
  { imagem: passeador, titulo: 'Passeadores e pet sitters', perfil: 'Passeio ou pet sitter' },
  { imagem: creche, titulo: 'Creches e hotéis', perfil: 'Creche ou hotel' },
  { imagem: banhoTosa, titulo: 'Banho e tosa', perfil: 'Banho e tosa' },
  { imagem: veterinario, titulo: 'Veterinários', perfil: 'Veterinária' },
] as const;

export const SOCIOS = [
  { nome: 'Mario Guedes', linkedin: 'https://www.linkedin.com/in/jmarioguedes/', foto: socioMario },
  { nome: 'Thiago Filadelfo', linkedin: 'https://www.linkedin.com/in/trfiladelfo/', foto: socioThiago },
] as const;
