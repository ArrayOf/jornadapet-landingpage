import type { Magia } from './tipos';

export interface Stepper {
  cur: number; auto: boolean; hold: boolean; visivel: boolean; dur: number;
  readonly reduzido: boolean;
  init(): void; iniciar(): void; parar(): void; ir(i: number, foco?: boolean): void; proximo(): void;
}

const IDS = ['cadastre', 'agende', 'acompanhe'] as const;

export function stepper(): Stepper & ThisType<Stepper & Magia> {
  return {
    cur: 0, auto: false, hold: false, visivel: false, dur: 6000,
    get reduzido() { return document.documentElement.classList.contains('rm'); },
    init() { window.setInterval(() => this.proximo(), this.dur); },
    iniciar() { this.auto = !this.reduzido && window.matchMedia('(min-width: 1024px)').matches; },
    parar() { this.auto = false; },
    ir(i, foco = false) {
      this.cur = i;
      this.auto = false;
      if (foco) document.getElementById('tab-' + IDS[i])?.focus();
    },
    proximo() {
      if (this.auto && this.visivel && !this.hold) this.cur = (this.cur + 1) % IDS.length;
    },
  };
}
