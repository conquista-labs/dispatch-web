import path from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Config própria (não estende vite.config.ts) — evita conflito de tipos entre UserConfig do
// Vite e do Vitest. `react()` é necessário pro JSX dos testes de componente (*.test.tsx).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    // jsdom global (não por arquivo): as suítes de função pura rodam igual nele, e evitar o
    // pragma `@vitest-environment` em cada *.test.tsx vale mais que os milissegundos a mais.
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // e2e/ é Playwright (*.spec.ts, roda com @playwright/test, não vitest).
    // tooling/: testes de configuração do repositório (APIs do Node, ver tsconfig.node.json).
    include: ['src/**/*.test.{ts,tsx}', 'tooling/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Sem `include`, o v8 só reporta arquivo que algum teste chegou a carregar — o que infla
      // o número escondendo justamente o que ninguém testa. Com ele, todo `src/` entra no
      // denominador, mesmo arquivo nunca importado por teste nenhum.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        // Só monta o root do React — 0% pra sempre por natureza, não por falta de teste.
        'src/main.tsx',
        // Helpers e fixtures de teste (shared/lib/test e `lib/test/` de qualquer slice), não código de produção.
        'src/**/lib/test/**',
        // Quarentena do `shadcn add` (gitignored): saída crua do registro, nunca importada.
        'src/shared/ui/generated/**',
      ],
      // Ratchet (padrão adotado do swap-benefits-web, ADR-0005 de lá): o piso começa no que o
      // repositório de fato cobre hoje e só sobe — `autoUpdate` reescreve estes números aqui
      // sempre que uma run cobrir mais, e esse diff é commitado junto com os testes que o
      // ganharam. Run que cobre MENOS que o commitado falha: é esse o mecanismo de fato.
      // Nunca abaixar na mão pra fazer vermelho virar verde — redução deliberada (ex.: apagar
      // código morto junto com o teste dele) é decisão explícita de PR, com nota.
      thresholds: {
        autoUpdate: true,
        lines: 32.07,
        functions: 24.78,
        branches: 24.58,
        statements: 32.12,
      },
    },
  },
})
