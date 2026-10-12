import type { Alpine } from 'alpinejs';
import intersect from '@alpinejs/intersect';
import focus from '@alpinejs/focus';
import { pagina } from './pagina';

export default (Alpine: Alpine) => {
  Alpine.plugin(intersect);
  Alpine.plugin(focus);
  Alpine.data('pagina', pagina);
};
