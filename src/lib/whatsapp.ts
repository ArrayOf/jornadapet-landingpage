/** Só os dígitos do número, sem +55 nem 0 de operadora, no máximo 11 (DDD + número). */
export function digitosWhatsapp(entrada: string): string {
  let d = entrada.replace(/\D/g, '');
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  return d.slice(0, 11);
}

/** Máscara progressiva: (11) 98765-4321 ou (11) 3456-7890. */
export function mascararWhatsapp(entrada: string): string {
  const d = digitosWhatsapp(entrada);
  if (d.length > 6) return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
  if (d.length > 2) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return d;
}

/** DDD válido (dois dígitos de 1 a 9) + celular de 9 dígitos começando em 9 ou fixo de 8 começando em 2 a 5. */
export function whatsappValido(entrada: string): boolean {
  return /^[1-9][1-9](9\d{8}|[2-5]\d{7})$/.test(digitosWhatsapp(entrada));
}
