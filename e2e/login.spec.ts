import { expect, test } from '@playwright/test'

// Verificação visual do layout de login (RF-01) contra o protótipo aprovado — não depende da
// API, só do render. Ver .claude/skills/verify-visual.
test.describe('Login — layout', () => {
  test('painel claro (form) e painel escuro (marca) renderizam juntos', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByText('Dispatch')).toBeVisible()
    await expect(page.getByText('A fila de conferência do cartório, distribuída sozinha.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
    await expect(page.getByLabel('E-mail')).toBeVisible()
    await expect(page.getByLabel('Senha')).toBeVisible()

    await page.screenshot({ path: 'e2e/.screenshots/login-light.png', fullPage: true })
  })

  test('tema escuro persistido aplica no painel do formulário', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('dispatch-tema', JSON.stringify({ state: { tema: 'dark' }, version: 0 }))
    })
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
    await page.screenshot({ path: 'e2e/.screenshots/login-dark.png', fullPage: true })
  })
})
