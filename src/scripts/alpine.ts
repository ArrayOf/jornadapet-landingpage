import type { Alpine } from 'alpinejs';
import intersect from '@alpinejs/intersect';
import focus from '@alpinejs/focus';
import { pagina } from './pagina';
import { stepper } from './stepper';

export default (Alpine: Alpine) => {
  Alpine.plugin(intersect);
  Alpine.plugin(focus);
  Alpine.data('pagina', pagina);
  Alpine.data('stepper', stepper);
};
