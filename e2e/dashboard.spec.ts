import { expect, test } from '@playwright/test'

// Verificação visual do Dashboard (RF-42-46) — precisa da API local com dado real acumulado
// de protocolos concluídos (sessões de teste anteriores já deixaram volume suficiente). Não é
// fixture fixa — se o banco local for zerado, a tela ainda renderiza (estado vazio), só sem
// número interessante pra conferir visualmente.
const EMAIL_DISTRIBUIDORA = process.env.E2E_DISTRIBUIDORA_EMAIL ?? 'distribuidora@cartorio.com'
const SENHA_DISTRIBUIDORA = process.env.E2E_DISTRIBUIDORA_SENHA ?? 'Senha123!'
const EMAIL_CONFERENTE = process.env.E2E_CONFERENTE_EMAIL ?? 'conferente-visual@cartorio.com'
const SENHA_CONFERENTE = process.env.E2E_CONFERENTE_SENHA ?? 'Senha123!'

test('Dashboard — visão gestão renderiza KPIs, tabela de score e desempenho por tipo', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(EMAIL_DISTRIBUIDORA)
  await page.getByLabel('Senha').fill(SENHA_DISTRIBUIDORA)
  await page.getByRole('button', { name: 'Entrar' }).click()
  // RF-03, ajustado a pedido do dono: os dois papéis caem no Dashboard depois de logar.
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible()
  await expect(page.getByText('Atos conferidos').first()).toBeVisible()
  await expect(page.getByText(/Desempenho e bonificação/)).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Score' })).toBeVisible()
  // RF-43: "Cumprimento de prazo por equipe" e "Por tipo de ato" lado a lado — rótulos exatos
  // do protótipo aprovado (Dispatch.dc.html), não paráfrase.
  await expect(page.getByText('Cumprimento de prazo por equipe')).toBeVisible()
  await expect(page.getByText('Por tipo de ato')).toBeVisible()

  await page.screenshot({ path: 'e2e/.screenshots/dashboard-gestao-claro.png', fullPage: true })

  // Trimestre — confirma que trocar de período dispara um refetch de verdade (query key nova).
  const [respostaTrimestre] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/dashboard') && r.url().includes('Trimestre')),
    page.getByRole('button', { name: 'Trimestre' }).click(),
  ])
  expect(respostaTrimestre.status()).toBe(200)

  await page.addInitScript(() => {
    localStorage.setItem('dispatch-tema', JSON.stringify({ state: { tema: 'dark' }, version: 0 }))
  })
  await page.reload()
  await expect(page.getByText(/Desempenho e bonificação/)).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/dashboard-gestao-escuro.png', fullPage: true })
})

test('Dashboard — visão conferente mostra só os próprios números, sem faixa de bônus', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(EMAIL_CONFERENTE)
  await page.getByLabel('Senha').fill(SENHA_CONFERENTE)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading', { name: 'Meu dashboard' })).toBeVisible()
  await expect(page.getByText('Seu score do período')).toBeVisible()
  await expect(page.getByText('Você e a média da casa')).toBeVisible()

  // RF-45: nem o rótulo "Faixa"/badge de bonificação nem a tabela com nome de colega aparecem.
  await expect(page.getByText(/Bônus integral|Bônus parcial|Fora do bônus/)).not.toBeVisible()
  await expect(page.getByText('Desempenho e bonificação')).not.toBeVisible()

  await page.screenshot({ path: 'e2e/.screenshots/dashboard-conferente-claro.png', fullPage: true })
})
