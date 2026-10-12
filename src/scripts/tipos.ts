/** Propriedades mágicas do Alpine usadas pelos componentes (o Alpine as injeta no `this`). */
export interface Magia {
  $el: HTMLElement;
  $refs: Record<string, HTMLElement | undefined>;
  $nextTick: (cb: () => void) => void;
  $dispatch: (evento: string, detalhe?: unknown) => void;
}
