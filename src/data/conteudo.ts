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

export const PERGUNTAS = [
  { pergunta: 'Quanto vai custar?', resposta: 'Ainda estamos definindo, junto com os profissionais que participam do teste. Enquanto estivermos testando, você não paga nada.' },
  { pergunta: 'Preciso usar o Telegram?', resposta: 'Sim. A JornadaPet funciona dentro do Telegram, no celular e no computador. Se ele não combina com a sua rotina, conte para a gente: é uma das coisas que estamos testando.' },
  { pergunta: 'Como eu entro?', resposta: 'O acesso é por convite. Depois de receber o seu, você confirma o celular por SMS uma única vez e passa a entrar direto pelo Telegram.' },
  { pergunta: 'Meus clientes precisam usar o Telegram?', resposta: 'Não. Só você usa a JornadaPet. A conversa com o tutor continua no seu WhatsApp, como hoje. Um resumo da sessão para o tutor está entre as ideias que estamos estudando.' },
  { pergunta: 'Serve para mensalidade e aula avulsa?', resposta: 'Você registra cada valor combinado com vencimento e cada pagamento, inteiro ou em partes, e vê quanto falta receber. Controle de aulas por pacote e cobrança automática ainda não fazem parte desta primeira versão.' },
  { pergunta: 'E os dados dos meus clientes?', resposta: 'Cada profissional vê apenas a própria carteira, e os dados não são compartilhados. Estamos escrevendo nossa política de dados com base na LGPD.' },
  { pergunta: 'Atendo outros animais além de cães. Posso participar?', resposta: 'Pode se inscrever. Começamos pelos cães, e saber quem atende outros animais nos ajuda a decidir os próximos passos.' },
] as const;
