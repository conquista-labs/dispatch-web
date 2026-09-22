import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

import '@testing-library/jest-dom/vitest'

// O Vitest não dá o `afterEach` global que o Jest dá de graça pra RTL — sem isso o render de
// um teste fica no DOM e as queries do teste seguinte (getByLabelText, getByRole...) passam a
// achar mais de um elemento.
afterEach(cleanup)

// jsdom não implementa matchMedia, e aqui isso não é opcional: `shared/lib/theme-store.ts`
// chama matchMedia('(prefers-color-scheme: dark)') na própria inicialização da store (no
// import, não em efeito), e `shared/lib/use-is-mobile.ts` também usa. Qualquer teste que
// importe AppShell — ou só a store de tema — explode sem este polyfill.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}
