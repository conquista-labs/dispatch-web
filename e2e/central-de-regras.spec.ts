import { expect, test } from '@playwright/test'

// Verificação visual da tela Central de regras (RF-31 a RF-41) contra dados reais — precisa da
// API local com regras de alçada (ativa e inativa), equipes com escreventes (e ao menos um
// escrevente sem equipe) e sugestões (pendentes e no histórico) — ver skill verify-visual.
// Screenshot pontual, não fixture fixa.
const EMAIL = process.env.E2E_DISTRIBUIDORA_EMAIL ?? 'distribuidora@cartorio.com'
const SENHA = process.env.E2E_DISTRIBUIDORA_SENHA ?? 'Senha123!'

test('Central de regras — as 3 abas renderizam com dados reais', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(EMAIL)
  await page.getByLabel('Senha').fill(SENHA)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/distribuicao/)

  await page.getByRole('link', { name: 'Central de regras' }).click()
  await expect(page).toHaveURL(/\/central-de-regras/)
  await expect(page.getByRole('heading', { name: 'Central de regras' })).toBeVisible()

  // Aprendizado (aba padrão).
  await expect(page.getByText('Propostas na fila')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Aplicar' }).first()).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/central-de-regras-aprendizado-claro.png', fullPage: true })

  // Alçada.
  await page.getByRole('button', { name: 'Alçada' }).click()
  await expect(page.getByRole('heading', { name: 'Regras de alçada' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'O que cada um alcança hoje' })).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/central-de-regras-alcada-claro.png', fullPage: true })

  // Construtor guiado (RF-32).
  await page.getByRole('button', { name: 'Nova regra' }).click()
  await expect(page.getByRole('button', { name: 'Por pessoa' })).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/central-de-regras-builder-claro.png', fullPage: true })
  await page.getByRole('button', { name: 'Cancelar' }).click()

  // Prazos por equipe.
  await page.getByRole('button', { name: 'Prazos por equipe' }).click()
  await expect(page.getByRole('heading', { name: 'Prazo por equipe e etapa' })).toBeVisible()
  await expect(page.getByText('Escreventes sem equipe')).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/central-de-regras-prazos-claro.png', fullPage: true })

  // Tema escuro, aba Alçada de novo.
  await page.addInitScript(() => {
    localStorage.setItem('dispatch-tema', JSON.stringify({ state: { tema: 'dark' }, version: 0 }))
  })
  await page.reload()
  await page.getByRole('button', { name: 'Alçada' }).click()
  await expect(page.getByRole('heading', { name: 'Regras de alçada' })).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/central-de-regras-alcada-escuro.png', fullPage: true })
})
