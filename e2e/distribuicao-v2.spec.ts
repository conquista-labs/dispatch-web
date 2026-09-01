import { expect, test } from '@playwright/test'

// Verificação visual e comportamental da segunda fatia do "v2" de Distribuição/Minha fila —
// prioridade manual, RF-14 (tipo/escrevente/equipe no card), RF-16 (loading no redistribuir),
// RF-18c (lista expandida da coluna) e RF-18e/RF-24f (barra de filtros). Precisa da API local
// com: pelo menos um protocolo no pool marcado como prioridade Alta, um conferente com mais de
// 3 protocolos atribuídos (pra truncar em "+N protocolos"), e ao menos um escrevente sem equipe
// aparecendo em algum protocolo do pool (ver skill verify-visual — dado seedado à mão, não é
// fixture fixa).
const EMAIL = process.env.E2E_DISTRIBUIDORA_EMAIL ?? 'distribuidora@cartorio.com'
const SENHA = process.env.E2E_DISTRIBUIDORA_SENHA ?? 'Senha123!'
const CONFERENTE_EMAIL = process.env.E2E_CONFERENTE_EMAIL ?? 'conferente-rf27@cartorio.com'
const CONFERENTE_SENHA = process.env.E2E_CONFERENTE_SENHA ?? 'Senha123!'

test('Distribuição v2 — prioridade, RF-14, RF-16, RF-18c, RF-18e', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(EMAIL)
  await page.getByLabel('Senha').fill(SENHA)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
  await page.getByRole('link', { name: 'Distribuição' }).click()
  await expect(page).toHaveURL(/\/distribuicao/)
  await expect(page.getByRole('heading', { name: 'Distribuição' })).toBeVisible()

  // RF-14: card mostra tipo de ato + escrevente + equipe, com "sem equipe" em vermelho quando
  // o escrevente não tem equipe. Pool tem os dois casos misturados.
  await expect(page.getByText('sem equipe').first()).toBeVisible()

  // Badge "urgente" — protocolo marcado manualmente como prioridade Alta.
  await expect(page.getByText('urgente').first()).toBeVisible()

  await page.screenshot({ path: 'e2e/.screenshots/distribuicao-v2-conferente-claro.png', fullPage: true })

  // RF-18c: "+N protocolos" abre a lista integral da coluna, ordenada por vencimento.
  const maisProtocolos = page.getByRole('button', { name: /\+\s*\d+\s*protocolos/ }).first()
  await expect(maisProtocolos).toBeVisible()
  await maisProtocolos.click()
  await expect(page.getByRole('heading', { name: /·\s*\d+$/ })).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/distribuicao-v2-lista-completa-claro.png', fullPage: true })

  // Clicar num item da lista abre o painel de detalhe e fecha o sheet.
  await page.locator('button:has(> div > span.font-mono)').first().click()
  await expect(page.getByRole('button', { name: 'Fechar' })).toBeVisible()

  // Marcar como urgente pelo painel, confirmar o texto do botão alterna.
  const botaoUrgencia = page.getByRole('button', { name: /Marcar como urgente|Remover urgência/ })
  const eraUrgente = (await botaoUrgencia.textContent())?.includes('Remover')
  await botaoUrgencia.click()
  await expect(page.getByRole('button', { name: eraUrgente ? 'Marcar como urgente' : 'Remover urgência' })).toBeVisible()
  // Desfaz, pra não mudar o estado do dado seedado além do necessário.
  await page.getByRole('button', { name: eraUrgente ? 'Marcar como urgente' : 'Remover urgência' }).click()
  await page.getByRole('button', { name: 'Fechar' }).click()

  // RF-16: "Redistribuir pool" mostra estado de carregamento — atrasa a resposta pra capturar o
  // texto intermediário.
  await page.route('**/protocolos/redistribuir-pool', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    await route.continue()
  })
  const botaoRedistribuir = page.getByRole('button', { name: /Redistribuir pool/ })
  await botaoRedistribuir.click()
  await expect(page.getByRole('button', { name: 'Redistribuindo…' })).toBeVisible()
  await expect(botaoRedistribuir).toBeEnabled({ timeout: 5000 })
  await page.unroute('**/protocolos/redistribuir-pool')

  // RF-18e: barra de filtros — eixo Prioridade isolado.
  await page.getByRole('button', { name: 'Prioridade' }).click()
  await expect(page.getByRole('button', { name: /alta/ })).toBeVisible()
  await page.getByRole('button', { name: /alta/ }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByText(/1 filtro ativo/)).toBeVisible()
  await expect(page.getByText('urgente').first()).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/distribuicao-v2-filtro-prioridade-claro.png', fullPage: true })

  // Combinação com outro eixo (Prazo) — ainda deve mostrar o card urgente se ele estiver "no
  // prazo" (Verde), então filtramos por Verde junto.
  await page.getByRole('button', { name: 'Prazo' }).click()
  await page.getByRole('button', { name: 'no prazo' }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByText(/2 filtros ativos/)).toBeVisible()

  // Limpar filtros.
  await page.getByText(/filtros ativos · limpar|filtro ativo · limpar/).click()
  await expect(page.getByText(/filtro ativo|filtros ativos/)).toHaveCount(0)

  // Tema escuro.
  await page.addInitScript(() => {
    localStorage.setItem('dispatch-tema', JSON.stringify({ state: { tema: 'dark' }, version: 0 }))
  })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Distribuição' })).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/distribuicao-v2-conferente-escuro.png', fullPage: true })
})

test('Minha fila (Conferente) — barra de filtros RF-24f realmente filtra', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(CONFERENTE_EMAIL)
  await page.getByLabel('Senha').fill(CONFERENTE_SENHA)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.getByRole('link', { name: 'Minha fila' }).click()
  await expect(page.getByText('Pool disponível')).toBeVisible()

  // Conta o pool antes de filtrar — o eixo Equipe precisa depender de GET /equipes e
  // GET /escreventes, que o Conferente também precisa poder ler (RF-24f não é ação de
  // gestão). Já pegou um bug real: essas duas rotas eram Distribuidora-only, então pro
  // Conferente `escreventePorId` vinha sempre vazio e TODO protocolo caía em "sem equipe" —
  // o filtro "funcionava" (marcava ativo) mas não reduzia nada de verdade.
  const contagemPoolAntes = Number(await page.locator('strong:has-text("Pool disponível")').locator('xpath=following-sibling::span[1]').first().textContent())
  expect(contagemPoolAntes).toBeGreaterThan(0)

  await expect(page.getByRole('button', { name: 'Equipe', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Equipe', exact: true }).click()
  await expect(page.getByText('Equipe RIO')).toBeVisible()
  await page.getByText('Equipe RIO').click()
  await page.keyboard.press('Escape')
  await expect(page.getByText(/1 filtro ativo/)).toBeVisible()

  const contagemPoolFiltrado = Number(await page.locator('strong:has-text("Pool disponível")').locator('xpath=following-sibling::span[1]').first().textContent())
  expect(contagemPoolFiltrado).toBeLessThan(contagemPoolAntes)
  expect(contagemPoolFiltrado).toBeGreaterThan(0)

  await page.getByText(/filtro ativo · limpar/).click()
  await expect(page.getByRole('button', { name: 'Equipe', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Equipe', exact: true }).click()
  await expect(page.getByText('sem equipe')).toBeVisible()
  await page.getByText('sem equipe').click()
  await page.keyboard.press('Escape')
  await expect(page.getByText(/1 filtro ativo/)).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/minha-fila-v2-filtro-claro.png', fullPage: true })

  await page.getByText(/filtro ativo · limpar/).click()

  await page.addInitScript(() => {
    localStorage.setItem('dispatch-tema', JSON.stringify({ state: { tema: 'dark' }, version: 0 }))
  })
  await page.reload()
  await expect(page.getByText('Pool disponível')).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/minha-fila-v2-escuro.png', fullPage: true })
})
