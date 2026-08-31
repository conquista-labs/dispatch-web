import { expect, test } from '@playwright/test'

// Verificação visual da tela Distribuição (RF-13 a RF-18) contra dados reais — precisa da API
// local com protocolo em cada bucket (pool/atribuído/em conferência/concluído/exceção) e pelo
// menos um conferente com algo na fila (ver skill verify-visual). Screenshot pontual, não
// fixture fixa.
const EMAIL = process.env.E2E_DISTRIBUIDORA_EMAIL ?? 'distribuidora@cartorio.com'
const SENHA = process.env.E2E_DISTRIBUIDORA_SENHA ?? 'Senha123!'

test('Distribuição — as 3 abas renderizam com dados reais', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(EMAIL)
  await page.getByLabel('Senha').fill(SENHA)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/distribuicao/)
  await expect(page.getByRole('heading', { name: 'Distribuição' })).toBeVisible()

  // Por conferente (aba padrão).
  await expect(page.getByText('Pool aberto')).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/distribuicao-conferente-claro.png', fullPage: true })

  // Por status.
  await page.getByRole('button', { name: 'Por status' }).click()
  await expect(page.getByText('Em conferência', { exact: true })).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/distribuicao-status-claro.png', fullPage: true })

  // Exceções.
  await page.getByRole('button', { name: /Exceções/ }).click()
  await expect(page.getByText(/tipo novo|sem alçada/).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Resolver' }).first()).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/distribuicao-excecoes-claro.png', fullPage: true })

  // Tema escuro, aba por conferente de novo.
  await page.addInitScript(() => {
    localStorage.setItem('dispatch-tema', JSON.stringify({ state: { tema: 'dark' }, version: 0 }))
  })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Distribuição' })).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/distribuicao-conferente-escuro.png', fullPage: true })
})
