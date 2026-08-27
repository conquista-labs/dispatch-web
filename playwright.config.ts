import { defineConfig, devices } from '@playwright/test'

// Testes de verificação visual/comportamental contra o app de verdade (não substituem
// vitest/tsc — ver .claude/skills/verify-visual). Não sobem a API sozinhos: os testes que
// dependem de login real esperam a API já rodando em VITE_API_URL (ver CLAUDE.md).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
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
