import type { Magia } from './tipos';
import { mascararWhatsapp } from '../lib/whatsapp';
import { primeiroCampoComErro, validar, validarCampo, type Campo, type Dados, type Erros } from '../lib/validacao';
import { guardarOrigem, type Origem } from '../lib/utm';
import { enviar, montarEnvio } from '../lib/formulario';
import { esperarToken, vigiarTurnstile } from './turnstile-tardio';
import { codigoParaWhatsapp, linkCompartilharWhatsapp, linkDeIndicacao, mensagemDeIndicacao } from '../lib/indicacao';

const ID_DO_CAMPO: Record<Campo, string> = { nome: 'f-nome', whatsapp: 'f-whats', perfil: 'f-perfil-0', cidade: 'f-cidade', aceite: 'f-aceite' };

interface Turnstile { reset(): void }
const turnstile = (): Turnstile | undefined => (window as unknown as { turnstile?: Turnstile }).turnstile;

function sessao(): Storage | null {
  try { return window.sessionStorage; } catch { return null; }
}
function local(): Storage | null {
  try { return window.localStorage; } catch { return null; }
}

let timerCopia: ReturnType<typeof setTimeout> | undefined;

export interface Formulario {
  f: Dados; isca: boolean; err: Erros; status: 'idle' | 'enviando' | 'ok' | 'erro'; origem: Origem;
  primeiroNome: string; whatsEnviado: string;
  codigo: string; linkWhats: string; linkCopia: string; compartilhar: string; copiado: boolean; mostrarLink: boolean; aviso: string;
  init(): void; mascarar(): void; tocar(c: Campo): void; enviarFormulario(): Promise<void>; copiar(): Promise<void>; recomecar(): void;
}

const vazio = (): Dados => ({ nome: '', whatsapp: '', perfil: '', cidade: '', aceite: false });

/** O que a pessoa já preencheu no HTML antes de o Alpine ligar (vazio se nada). */
function digitadoAntes(form: HTMLFormElement | null): Dados {
  if (!form) return vazio();
  const campo = (nome: string) => (form.elements.namedItem(nome) as HTMLInputElement | null);
  const perfil = form.querySelector<HTMLInputElement>('input[name="perfil"]:checked')?.value ?? '';
  return {
    nome: campo('nome')?.value ?? '',
    whatsapp: mascararWhatsapp(campo('whatsapp')?.value ?? ''),
    perfil,
    cidade: campo('cidade')?.value ?? '',
    aceite: campo('aceite')?.checked ?? false,
  };
}

export function formulario(endpoint: string): Formulario & ThisType<Formulario & Magia> {
  return {
    f: vazio(), isca: false, err: {}, status: 'idle', origem: {}, primeiroNome: '', whatsEnviado: '',
    codigo: '', linkWhats: '', linkCopia: '', compartilhar: '', copiado: false, mostrarLink: false, aviso: '',
    init() {
      // Alpine liga depois do load: quem já digitou não pode perder o texto quando o x-model assumir.
      this.f = digitadoAntes(this.$el.querySelector('form'));
      this.origem = guardarOrigem(sessao(), window.location.search);
      vigiarTurnstile(this.$el, this.$refs.caixaTurnstile);
    },
    mascarar() { this.f.whatsapp = mascararWhatsapp(this.f.whatsapp); },
    tocar(c) { this.err = { ...this.err, [c]: validarCampo(c, this.f) || undefined }; },
    async enviarFormulario() {
      if (this.status === 'enviando') return;
      if (this.isca) return;
      this.err = validar(this.f);
      const campo = primeiroCampoComErro(this.err);
      if (campo) { document.getElementById(ID_DO_CAMPO[campo])?.focus(); return; }
      this.status = 'enviando';
      const token = await esperarToken(this.$el, this.$refs.caixaTurnstile);
      // Um código por WhatsApp (NT-004 §2): outro contato no mesmo aparelho ganha código próprio.
      this.codigo = codigoParaWhatsapp(local(), this.f.whatsapp);
      const resultado = await enviar({ ...montarEnvio(this.f, this.origem), 'cf-turnstile-response': token, codigo_indicacao: this.codigo }, endpoint);
      // O token do Turnstile vale para um envio só.
      turnstile()?.reset();
      if (resultado === 'ok') {
        this.primeiroNome = this.f.nome.trim().split(/\s+/)[0] ?? '';
        this.whatsEnviado = mascararWhatsapp(this.f.whatsapp);
        this.status = 'ok';
        this.linkWhats = linkDeIndicacao(window.location.origin, this.codigo, 'whatsapp');
        this.linkCopia = linkDeIndicacao(window.location.origin, this.codigo, 'link');
        this.compartilhar = linkCompartilharWhatsapp(mensagemDeIndicacao(this.linkWhats));
        this.$dispatch('pedido-enviado');
        // x-show só exibe o bloco depois do tick; o foco espera o próximo quadro.
        this.$nextTick(() => requestAnimationFrame(() => this.$refs.sucesso?.focus()));
      } else {
        this.status = 'erro';
      }
    },
    async copiar() {
      clearTimeout(timerCopia);
      let ok = false;
      try { await navigator.clipboard.writeText(this.linkCopia); ok = true; } catch { /* sem API ou sem permissão */ }
      if (!ok) {
        const t = document.createElement('textarea');
        t.value = this.linkCopia; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;opacity:0';
        document.body.append(t); t.select();
        try { ok = document.execCommand('copy'); } catch { ok = false; }
        t.remove();
      }
      if (ok) {
        this.copiado = true; this.aviso = 'Link copiado.';
        timerCopia = setTimeout(() => { this.copiado = false; this.aviso = ''; }, 2000);
      } else {
        // Navegador interno do Instagram ou do WhatsApp: o link aparece num campo já selecionado.
        this.mostrarLink = true; this.aviso = 'Não deu para copiar. O link está no campo abaixo.';
        this.$nextTick(() => requestAnimationFrame(() => {
          const c = this.$refs.campoLink as HTMLInputElement | undefined;
          c?.focus(); c?.select(); c?.setSelectionRange(0, 9999);
        }));
      }
    },
    // "Errou algum dado? Enviar de novo": mantém o que foi digitado, para corrigir o próprio pedido.
    recomecar() {
      this.err = {}; this.status = 'idle'; this.copiado = false; this.mostrarLink = false; this.aviso = '';
      // x-show só exibe o formulário depois do tick; o foco espera o próximo quadro.
      this.$nextTick(() => requestAnimationFrame(() => document.getElementById('f-nome')?.focus()));
    },
  };
}
