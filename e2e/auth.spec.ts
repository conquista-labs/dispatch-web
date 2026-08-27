import { expect, test } from '@playwright/test'

// Fluxo de autenticação de verdade (RF-01 a RF-03) contra a API real — precisa dela rodando em
// VITE_API_URL (ver .claude/skills/verify-visual). Sem OAuth aqui (diferente do financas-front):
// dá pra logar de verdade preenchendo o formulário, sem bypass nem injeção de token.
const EMAIL = process.env.E2E_DISTRIBUIDORA_EMAIL ?? 'distribuidora@cartorio.com'
const SENHA = process.env.E2E_DISTRIBUIDORA_SENHA ?? 'Senha123!'

test('login como Distribuidora leva pra Distribuição (RF-03) e mostra a sidebar', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(EMAIL)
  await page.getByLabel('Senha').fill(SENHA)
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/\/distribuicao/)
  await expect(page.getByRole('heading', { name: 'Distribuição' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Distribuição' })).toBeVisible()

  await page.screenshot({ path: 'e2e/.screenshots/distribuicao-logado.png', fullPage: true })
})

test('F5 mantém a sessão via GET /auth/me', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(EMAIL)
  await page.getByLabel('Senha').fill(SENHA)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/distribuicao/)

  await page.reload()

  await expect(page.getByRole('heading', { name: 'Distribuição' })).toBeVisible()
  await expect(page).not.toHaveURL(/\/login/)
})
