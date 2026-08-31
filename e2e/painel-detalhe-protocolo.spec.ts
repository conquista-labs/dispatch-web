import { expect, test } from '@playwright/test'

// Verificação visual + comportamental do painel de detalhe do protocolo (RF-18a/b) — precisa
// de pelo menos um protocolo Atribuído e um em Exceção na API local (ver skill verify-visual).
// Screenshot pontual, não fixture fixa.
const EMAIL = process.env.E2E_DISTRIBUIDORA_EMAIL ?? 'distribuidora@cartorio.com'
const SENHA = process.env.E2E_DISTRIBUIDORA_SENHA ?? 'Senha123!'

test('painel de detalhe abre a partir do card, mostra alçada e fecha por Esc/clique fora', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(EMAIL)
  await page.getByLabel('Senha').fill(SENHA)
  await page.getByRole('button', { name: 'Entrar' }).click()
  // RF-03, ajustado a pedido do dono: login cai no Dashboard agora — navega explicitamente.
  await expect(page).toHaveURL(/\/dashboard/)
  await page.getByRole('link', { name: 'Distribuição' }).click()
  await expect(page).toHaveURL(/\/distribuicao/)

  await page.getByRole('button', { name: /Exceções/ }).click()
  await expect(page.getByText('ninguém com alçada').first()).toBeVisible()
  await page.getByText('ninguém com alçada').first().click()

  await expect(page.getByText('LINHA DO TEMPO')).toBeVisible()
  await expect(page.getByText('QUEM PODE CONFERIR ESTE ATO')).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/painel-detalhe-claro.png', fullPage: true })

  await page.keyboard.press('Escape')
  await expect(page.getByText('LINHA DO TEMPO')).not.toBeVisible()
})
