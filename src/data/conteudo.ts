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
