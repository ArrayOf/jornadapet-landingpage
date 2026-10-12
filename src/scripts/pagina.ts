import type { Magia } from './tipos';

export interface Pagina {
  menu: boolean; scrolled: boolean; heroCta: boolean; formVisivel: boolean;
  init(): void; abrirMenu(): void; fecharMenu(devolverFoco?: boolean): void;
}

export function pagina(): Pagina & ThisType<Pagina & Magia> {
  return {
    menu: false, scrolled: false, heroCta: true, formVisivel: false,
    init() {
      const marca = document.createElement('div');
      marca.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px';
      document.body.prepend(marca);
      new IntersectionObserver(([e]) => { this.scrolled = !e.isIntersecting; }, { rootMargin: '-64px 0px 0px 0px' }).observe(marca);
    },
    abrirMenu() { this.menu = true; },
    fecharMenu(devolverFoco = false) {
      this.menu = false;
      if (devolverFoco) this.$nextTick(() => this.$refs.botaoMenu?.focus());
    },
  };
}
