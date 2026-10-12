import type { Alpine } from 'alpinejs';
import intersect from '@alpinejs/intersect';
import focus from '@alpinejs/focus';

export default (Alpine: Alpine) => {
  Alpine.plugin(intersect);
  Alpine.plugin(focus);
};
