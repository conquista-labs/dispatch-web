import { defineConfig, devices } from '@playwright/test'

// Testes de verificação visual/comportamental contra o app de verdade (não substituem
// vitest/tsc — ver .claude/skills/verify-visual). Não sobem a API sozinhos: os testes que
// dependem de login real esperam a API já rodando em VITE_API_URL (ver CLAUDE.md).
// `globalSetup` roda uma vez antes de tudo e garante as contas fixas de login (ver
// e2e/global-setup.ts) — não importa o que já tinha no banco local antes.
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  // Um worker só: todos os specs dividem o mesmo banco local e os mesmos dados fixos da fixture
  // `cenario` (tipo "E2e Reservado", equipe e escreventes "E2e …", contas seed). Em paralelo, um
  // teste via a Reserva do outro na tela, e a varredura de sobras do começo de um cenário apagava
  // o protocolo ou a regra de outro teste no meio (ADR-0025).
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
