import { expect, test as base } from '@playwright/test';

/**
 * Turnstile falso: o script real vem de challenges.cloudflare.com e faria os testes dependerem da rede.
 * O falso só põe no formulário o campo que o real põe (cf-turnstile-response) e expõe turnstile.reset().
 */
const TURNSTILE_FALSO = `
  window.turnstile = { resets: 0, reset() { this.resets++; } };
  for (const el of document.querySelectorAll('.cf-turnstile')) {
    const i = document.createElement('input');
    i.type = 'hidden'; i.name = 'cf-turnstile-response'; i.value = 'token-de-teste';
    el.appendChild(i);
  }
`;

export const test = base.extend<{ turnstileFalso: void }>({
  turnstileFalso: [async ({ context }, use) => {
    await context.route('https://challenges.cloudflare.com/turnstile/**', (r) => r.fulfill({ contentType: 'application/javascript', body: TURNSTILE_FALSO }));
    // Web Analytics: quando o token for preenchido, os testes não dependem da rede.
    await context.route('https://static.cloudflareinsights.com/**', (r) => r.fulfill({ contentType: 'application/javascript', body: '' }));
    await use();
  }, { auto: true }],
});

export { expect };
