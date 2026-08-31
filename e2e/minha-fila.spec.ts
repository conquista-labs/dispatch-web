import { expect, test } from '@playwright/test'

// Verificação visual da tela Minha fila (RF-19 a RF-24) contra dados reais — precisa da API
// local com um conferente de teste que tenha protocolo em cada uma das 3 colunas (ver skill
// verify-visual). Screenshot manual/pontual pra conferência de fidelidade, não fixture fixa.
//
// TODO: teste de interação de verdade (clicar "Pegar este" e confirmar que move de coluna) foi
// verificado manualmente nesta sessão e removido daqui — dependia de um protocolo pré-semeado
// à mão (não idempotente: passa uma vez, falha na segunda porque o dado já mudou de estado).
// Pra virar teste automatizado de verdade, precisa criar o próprio protocolo via API
// (POST /protocolos/distribuir com token de Distribuidora) no início do teste e limpar depois,
// não depender de estado deixado por uma sessão anterior.
const EMAIL = process.env.E2E_CONFERENTE_EMAIL ?? 'conferente-visual@cartorio.com'
const SENHA = process.env.E2E_CONFERENTE_SENHA ?? 'Senha123!'

test('board de Minha fila renderiza as 3 colunas + concluídos hoje', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(EMAIL)
  await page.getByLabel('Senha').fill(SENHA)
  await page.getByRole('button', { name: 'Entrar' }).click()

  // RF-03, ajustado a pedido do dono: login cai no Dashboard agora — navega explicitamente.
  await expect(page).toHaveURL(/\/dashboard/)
  await page.getByRole('link', { name: 'Minha fila' }).click()
  await expect(page).toHaveURL(/\/minha-fila/)
  await expect(page.getByRole('heading', { name: 'Minha fila' })).toBeVisible()
  await expect(page.getByText('Pool disponível')).toBeVisible()
  await expect(page.getByText('Atribuídas a você')).toBeVisible()
  await expect(page.getByText('Em conferência', { exact: true })).toBeVisible()

  await page.screenshot({ path: 'e2e/.screenshots/minha-fila-claro.png', fullPage: true })

  await page.addInitScript(() => {
    localStorage.setItem('dispatch-tema', JSON.stringify({ state: { tema: 'dark' }, version: 0 }))
  })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Minha fila' })).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/minha-fila-escuro.png', fullPage: true })
})
