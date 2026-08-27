import { expect, test } from '@playwright/test'

// Regressão: achado em uso real — deslogar de Distribuidora e logar como Conferente em
// seguida mostrava a sessão de Distribuidora primeiro (cache do TanStack Query sobrevivendo
// ao logout). Corrigido com queryClient.clear() no logout/login/401 — ver
// features/auth/logout, features/auth/login e app/App.tsx.
const DISTRIBUIDORA = { email: 'distribuidora@cartorio.com', senha: 'Senha123!' }
const CONFERENTE = { email: 'conferente-rf27@cartorio.com', senha: 'Senha123!' }

test('deslogar de um papel e logar com outro não vaza sessão/cache entre os dois', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(DISTRIBUIDORA.email)
  await page.getByLabel('Senha').fill(DISTRIBUIDORA.senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/distribuicao/)
  await expect(page.getByText('Distribuidora Teste')).toBeVisible()

  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL(/\/login/)

  await page.getByLabel('E-mail').fill(CONFERENTE.email)
  await page.getByLabel('Senha').fill(CONFERENTE.senha)
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/\/minha-fila/)
  // Não pode aparecer nada da sessão anterior — nem o nome, nem o papel, nem a rota dela.
  await expect(page.getByText('Conferente RF27').first()).toBeVisible()
  await expect(page.getByText('Distribuidora Teste')).not.toBeVisible()
  await expect(page.getByText('Distribuidora', { exact: true })).not.toBeVisible()
})
