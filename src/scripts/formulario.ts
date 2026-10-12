import type { Magia } from './tipos';
import { mascararWhatsapp } from '../lib/whatsapp';
import { primeiroCampoComErro, validar, validarCampo, type Campo, type Dados, type Erros } from '../lib/validacao';
import { guardarOrigem, type Origem } from '../lib/utm';
import { enviar, montarEnvio } from '../lib/formulario';

const ID_DO_CAMPO: Record<Campo, string> = { nome: 'f-nome', whatsapp: 'f-whats', perfil: 'f-perfil-0', cidade: 'f-cidade', aceite: 'f-aceite' };

interface Turnstile { reset(): void }
const turnstile = (): Turnstile | undefined => (window as unknown as { turnstile?: Turnstile }).turnstile;

function sessao(): Storage | null {
  try { return window.sessionStorage; } catch { return null; }
}

export interface Formulario {
  f: Dados; isca: boolean; err: Erros; status: 'idle' | 'enviando' | 'ok' | 'erro'; origem: Origem;
  primeiroNome: string; whatsEnviado: string;
  init(): void; mascarar(): void; tocar(c: Campo): void; enviarFormulario(): Promise<void>; recomecar(): void;
}

const vazio = (): Dados => ({ nome: '', whatsapp: '', perfil: '', cidade: '', aceite: false });

export function formulario(endpoint: string): Formulario & ThisType<Formulario & Magia> {
  return {
    f: vazio(), isca: false, err: {}, status: 'idle', origem: {}, primeiroNome: '', whatsEnviado: '',
    init() { this.origem = guardarOrigem(sessao(), window.location.search); },
    mascarar() { this.f.whatsapp = mascararWhatsapp(this.f.whatsapp); },
    tocar(c) { this.err = { ...this.err, [c]: validarCampo(c, this.f) || undefined }; },
    async enviarFormulario() {
      if (this.status === 'enviando') return;
      if (this.isca) return;
      this.err = validar(this.f);
      const campo = primeiroCampoComErro(this.err);
      if (campo) { document.getElementById(ID_DO_CAMPO[campo])?.focus(); return; }
      this.status = 'enviando';
      const token = this.$el.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value ?? '';
      const resultado = await enviar({ ...montarEnvio(this.f, this.origem), 'cf-turnstile-response': token }, endpoint);
      // O token do Turnstile vale para um envio só.
      turnstile()?.reset();
      if (resultado === 'ok') {
        this.primeiroNome = this.f.nome.trim().split(/\s+/)[0] ?? '';
        this.whatsEnviado = mascararWhatsapp(this.f.whatsapp);
        this.status = 'ok';
        // x-show só exibe o bloco depois do tick; o foco espera o próximo quadro.
        this.$nextTick(() => requestAnimationFrame(() => this.$refs.sucesso?.focus()));
      } else {
        this.status = 'erro';
      }
    },
    recomecar() { this.f = vazio(); this.err = {}; this.status = 'idle'; },
  };
}
