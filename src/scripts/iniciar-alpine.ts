import Alpine from 'alpinejs';
import intersect from '@alpinejs/intersect';
import focus from '@alpinejs/focus';
import { pagina } from './pagina';
import { stepper } from './stepper';
import { formulario } from './formulario';

/** Liga o Alpine (chamado pelo script de módulo do Base.astro). */
export function iniciar(): void {
  (window as unknown as { Alpine: typeof Alpine }).Alpine = Alpine;
  Alpine.plugin(intersect);
  Alpine.plugin(focus);
  Alpine.data('pagina', pagina);
  Alpine.data('stepper', stepper);
  Alpine.data('formulario', formulario);
  Alpine.start();
}
