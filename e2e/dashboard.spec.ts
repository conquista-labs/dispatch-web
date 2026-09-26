import { CONTAS, expect, test } from './support/cenario'

// Verificação visual do Dashboard (RF-42-46). As visões de gestão renderizam com qualquer banco
// (estado vazio incluso). A visão do conferente só mostra o score com algo concluído no período —
// esse teste monta o próprio ato concluído pela fixture `cenario` (ADR-0025).
const EMAIL_DISTRIBUIDORA = process.env.E2E_DISTRIBUIDORA_EMAIL ?? 'distribuidora@cartorio.com'
const SENHA_DISTRIBUIDORA = process.env.E2E_DISTRIBUIDORA_SENHA ?? 'Senha123!'
const EMAIL_ADMIN = process.env.E2E_ADMIN_EMAIL ?? 'administrador@cartorio.com'
const SENHA_ADMIN = process.env.E2E_ADMIN_SENHA ?? 'Senha123!'
const EMAIL_CONFERENTE = process.env.E2E_CONFERENTE_EMAIL ?? 'conferente-visual@cartorio.com'
const SENHA_CONFERENTE = process.env.E2E_CONFERENTE_SENHA ?? 'Senha123!'

// Score e faixa são só do Administrador (RF-43a); a distribuidora tem o próprio teste abaixo.
test('Dashboard — visão gestão renderiza KPIs, tabela de score e desempenho por tipo', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(EMAIL_ADMIN)
  await page.getByLabel('Senha').fill(SENHA_ADMIN)
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

// RF-43a: pra distribuidora, "Produção por conferente" — sem score, faixa nem cargo.
test('Dashboard — distribuidora vê a produção por conferente, sem score nem faixa', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(EMAIL_DISTRIBUIDORA)
  await page.getByLabel('Senha').fill(SENHA_DISTRIBUIDORA)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  await expect(page.getByText(/Produção por conferente/)).toBeVisible()
  await expect(page.getByText('em ordem alfabética')).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Volume' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Score' })).toHaveCount(0)
  await expect(page.getByText(/Desempenho e bonificação/)).toHaveCount(0)
  await expect(page.getByText(/Analista/)).toHaveCount(0)
  await page.screenshot({ path: 'e2e/.screenshots/dashboard-distribuidora-claro.png', fullPage: true })
})

test('Dashboard — visão conferente mostra só os próprios números, sem faixa de bônus', async ({ page, cenario }) => {
  await cenario.alcadaPlena(CONTAS.conferenteVisual)
  await cenario.esvaziarFila('conferenteVisual')
  const [protocolo] = await cenario.importar([{}])
  await cenario.atribuir(protocolo.id, CONTAS.conferenteVisual)
  await cenario.iniciar(protocolo.id, 'conferenteVisual')
  await cenario.concluir(protocolo.id, 'conferenteVisual')

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
