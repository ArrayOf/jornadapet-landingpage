/** Chave do serviço de formulário. Em produção (PUBLIC_INDEXAR=true), sem chave o build falha: sem ela nenhum contato chega. */
export function chaveDoFormulario(chave: string | undefined, producao: boolean): string {
  const valor = (chave ?? '').trim();
  if (producao && !valor) throw new Error('PUBLIC_FORM_ACCESS_KEY vazia: defina a chave do serviço de formulário antes de publicar.');
  return valor;
}
