import path from 'node:path'

import { defineConfig } from 'vitest/config'

// Config própria (não estende vite.config.ts) — evita conflito de tipos entre UserConfig do
// Vite e do Vitest. Só precisa do alias @ (os testes-alvo são lógica pura, sem plugin React
// nem DOM — ambiente node, não jsdom).
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    // e2e/ é Playwright (*.spec.ts, mas roda com `@playwright/test`, não vitest) — sem isso o
    // vitest tentaria rodar esses arquivos também e falharia.
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
