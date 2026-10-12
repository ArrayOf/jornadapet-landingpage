import { CONTATO_EMAIL, SOCIOS } from '../data/conteudo';

export function organizacao(site: URL): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'JornadaPet',
    url: new URL('/', site).toString(),
    logo: new URL('/icon-512.png', site).toString(),
    email: CONTATO_EMAIL,
    parentOrganization: { '@type': 'Organization', name: 'ArrayOf', url: 'https://arrayof.com.br' },
    founder: SOCIOS.map((s) => ({ '@type': 'Person', name: s.nome, sameAs: s.linkedin })),
  };
}

export function siteWeb(site: URL): object {
  return { '@context': 'https://schema.org', '@type': 'WebSite', name: 'JornadaPet', url: new URL('/', site).toString(), inLanguage: 'pt-BR' };
}

export function paginaDePerguntas(perguntas: readonly { pergunta: string; resposta: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: perguntas.map((q) => ({ '@type': 'Question', name: q.pergunta, acceptedAnswer: { '@type': 'Answer', text: q.resposta } })),
  };
}
