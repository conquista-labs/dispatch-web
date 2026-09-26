import { type Locator, type Page } from '@playwright/test'

import { capturarPaginaInteira, CONTAS, entrar, expect, FIXOS, test, usarTemaEscuro } from './support/cenario'

// Segunda fatia do "v2" de Distribuição/Minha fila — prioridade manual, RF-14 (tipo/escrevente/
// equipe no card), RF-16 (loading no redistribuir), RF-18c (lista expandida da coluna) e RF-18e/
// RF-24f (painel de Filtros, ADR-0008). O cenário vem da API (ver e2e/support/cenario.ts) e a
// busca do quadro com o prefixo do cenário isola os cards deste teste do resto do banco local.

const BUSCA = 'Buscar protocolo, tipo de ato, escrevente, equipe…'
// Na Minha fila do conferente a busca não procura por escrevente/equipe (ADR-0046).
const BUSCA_CONFERENTE = 'Buscar protocolo ou tipo de ato…'

// Cada eixo do painel de Filtros é um rótulo + um gatilho de Combo cujo nome é o valor atual
// ("todas", "alta"...) — o gatilho é achado pela seção do rótulo, não pelo texto do botão.
const gatilhoDoEixo = (painel: Locator, rotulo: string) =>
  painel.getByText(rotulo, { exact: true }).locator('xpath=../..').getByRole('button')

const abrirFiltros = async (page: Page) => {
  await page.getByRole('button', { name: /^Filtros/ }).click()
  const painel = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Filtros' }) })
  await expect(painel).toBeVisible()
  return painel
}

// Marca/desmarca uma opção do Combo do eixo — o nome da opção é "rótulo + contagem" ("alta 1").
const alternarOpcao = async (page: Page, painel: Locator, eixo: string, opcao: string) => {
  await gatilhoDoEixo(painel, eixo).click()
  await page.getByRole('button', { name: new RegExp(`^${opcao} \\d+$`) }).click()
  await page.keyboard.press('Escape')
}

const aplicarFiltros = async (page: Page) => {
  await page.getByRole('button', { name: /^Ver \d+ filtro\(s\) aplicados$/ }).click()
  await expect(page.getByRole('heading', { name: 'Filtros' })).toHaveCount(0)
}

test('Distribuição v2 — prioridade, RF-14, RF-16, RF-18c, RF-18e', async ({ page, cenario }) => {
  await cenario.alcadaPlena(CONTAS.conferenteRf27)
  await cenario.esvaziarFila('conferenteRf27')
  const { comEquipe, equipe } = await cenario.escreventes()
  const conferente = await cenario.conferente(CONTAS.conferenteRf27)

  // No pool: um de escrevente sem equipe marcado como Alta e um de escrevente com equipe.
  // Na conferente: 6 atribuídos — um a mais que os 5 cards da coluna, pro "+N · ver todos".
  const [alta, comEquipeNoPool, ...naConferente] = await cenario.importar([
    {},
    { escrevente: comEquipe },
    {},
    {},
    {},
    {},
    {},
    {},
  ])
  // A importação nunca define prioridade (o relatório não tem a coluna) — só a distribuidora.
  await cenario.definirPrioridade(alta.id, 'Alta')
  for (const protocolo of naConferente) await cenario.atribuir(protocolo.id, CONTAS.conferenteRf27)

  await entrar(page, 'distribuidora')
  await page
    .getByRole('link', { name: /^Distribuição/ })
    .first()
    .click()
  await expect(page).toHaveURL(/\/distribuicao/)
  await expect(page.getByRole('heading', { name: 'Distribuição' })).toBeVisible()
  await page.getByPlaceholder(BUSCA).fill(cenario.prefixo)

  // RF-14: card mostra escrevente + equipe, com "sem equipe" em vermelho quando falta a equipe.
  await expect(page.getByText(comEquipeNoPool.numero, { exact: true })).toBeVisible()
  await expect(page.getByText(equipe, { exact: true }).first()).toBeVisible()
  await expect(page.getByText('sem equipe', { exact: true }).first()).toBeVisible()
  // RF-18a: tag "Alta" (não "urgente") no card marcado.
  await expect(page.getByText('Alta', { exact: true }).first()).toBeVisible()
  await capturarPaginaInteira(page, 'e2e/.screenshots/distribuicao-v2-conferente-claro.png')

  // RF-18c: "+N protocolos · ver todos" na coluna da conferente abre a lista integral dela.
  const coluna = page
    .locator('div')
    .filter({ has: page.getByText(conferente.nome, { exact: true }) })
    .filter({ has: page.getByRole('button', { name: /ver todos/ }) })
    .last()
  await coluna.getByRole('button', { name: '+ 1 protocolos · ver todos' }).click()
  const lista = page.getByRole('dialog')
  await expect(lista.getByRole('heading', { name: `${conferente.nome} · 6 na mão` })).toBeVisible()
  await expect(lista.getByText(/ordenados por vencimento/)).toBeVisible()
  // Sem `fullPage` com Sheet aberto: visto nesta spec, o screenshot de página inteira fechava o
  // Sheet e a busca voltava vazia (ver e2e-tests.md).
  await page.screenshot({ path: 'e2e/.screenshots/distribuicao-v2-lista-completa-claro.png' })

  // Clicar num item da lista abre o painel de detalhe (a lista some por baixo).
  const [primeiro] = naConferente
  await lista.getByRole('button', { name: new RegExp(primeiro.numero) }).click()
  const painel = page.getByRole('dialog')
  await expect(painel.getByText('LINHA DO TEMPO')).toBeVisible()

  // Prioridade pelo painel: marca e desmarca, confirmando pelo texto do botão que alterna.
  await painel.getByRole('button', { name: 'Marcar como urgente' }).click()
  await expect(painel.getByRole('button', { name: 'Remover urgência' })).toBeVisible()
  await painel.getByRole('button', { name: 'Remover urgência' }).click()
  await expect(painel.getByRole('button', { name: 'Marcar como urgente' })).toBeVisible()
  // Fechar o detalhe devolve a lista completa (ela lembra que estava aberta) — fecha as duas.
  await painel.getByRole('button', { name: 'Fechar' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Fechar' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  // RF-16: "Redistribuir pool" mostra estado de carregamento. A resposta é simulada (com atraso
  // pra capturar o texto intermediário) — redistribuir de verdade mexeria no pool inteiro do
  // banco local, não só no cenário.
  await page.route('**/protocolos/redistribuir-pool', async (route) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 800)
    })
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ alterados: 0 }) })
  })
  const botaoRedistribuir = page.getByRole('button', { name: /Redistribuir pool/ })
  await botaoRedistribuir.click()
  await expect(page.getByRole('button', { name: 'Redistribuindo…' })).toBeVisible()
  await expect(botaoRedistribuir).toBeEnabled({ timeout: 5000 })
  await page.unroute('**/protocolos/redistribuir-pool')

  // RF-18e: painel de Filtros — eixo Prioridade isolado deixa só o Alta.
  let filtros = await abrirFiltros(page)
  await alternarOpcao(page, filtros, 'Prioridade', 'alta')
  await aplicarFiltros(page)
  await expect(page.getByRole('button', { name: /^Filtros\s*1$/ })).toBeVisible()
  await expect(page.getByText(alta.numero, { exact: true })).toBeVisible()
  await expect(page.getByText(comEquipeNoPool.numero, { exact: true })).toHaveCount(0)
  await expect(page.getByText(primeiro.numero, { exact: true })).toHaveCount(0)
  await capturarPaginaInteira(page, 'e2e/.screenshots/distribuicao-v2-filtro-prioridade-claro.png')

  // Combinado com o eixo Prazo ("só urgentes"): Alta conta como urgente, continua na tela.
  filtros = await abrirFiltros(page)
  await alternarOpcao(page, filtros, 'Prazo', 'só urgentes e vencendo em 4h')
  await aplicarFiltros(page)
  await expect(page.getByRole('button', { name: /^Filtros\s*2$/ })).toBeVisible()
  await expect(page.getByText(alta.numero, { exact: true })).toBeVisible()

  // "Limpar tudo" zera os eixos e também a busca — refaz a busca e o resto do cenário volta.
  filtros = await abrirFiltros(page)
  await filtros.getByRole('button', { name: 'Limpar tudo' }).click()
  await filtros.getByRole('button', { name: 'Fechar', exact: true }).click()
  await expect(page.getByRole('button', { name: /^Filtros$/ })).toBeVisible()
  await expect(page.getByPlaceholder(BUSCA)).toHaveValue('')
  await page.getByPlaceholder(BUSCA).fill(cenario.prefixo)
  await expect(page.getByText(comEquipeNoPool.numero, { exact: true })).toBeVisible()

  // Tema escuro.
  await usarTemaEscuro(page)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Distribuição' })).toBeVisible()
  await capturarPaginaInteira(page, 'e2e/.screenshots/distribuicao-v2-conferente-escuro.png')
})

// Minha fila do conferente (dispatch-api ADR-0046, decisão do dono 2026-09-26): ele pega do pool na
// ordem da fila (só o primeiro da vez tem "Pegar este") e não vê de quem é o ato antes de entrar
// em conferência — sem escrevente/equipe no card, sem o eixo "Equipe" nos filtros e sem busca por
// eles. O filtro por tipo de ato continua filtrando de verdade (contagem antes/depois).
test('Minha fila (Conferente) — pool em ordem, sem escrevente, filtro por tipo de ato', async ({ page, cenario }) => {
  await cenario.alcadaPlena(CONTAS.conferenteRf27)
  await cenario.esvaziarFila('conferenteRf27')
  const { comEquipe } = await cenario.escreventes()
  const reservado = await cenario.tipoAto(FIXOS.tipoAtoReservado, 'Notariais')
  const [doCenario, doReservado] = await cenario.importar([
    { escrevente: comEquipe },
    { escrevente: comEquipe, tipoAto: reservado.nome },
  ])

  await entrar(page, 'conferenteRf27')
  await page.getByRole('link', { name: 'Minha fila', exact: true }).click()
  await expect(page.getByText('Pool disponível')).toBeVisible()

  // Sem filtro: um "Pegar este" só, no primeiro card do pool (o próximo da vez), e a orientação.
  await expect(page.getByRole('button', { name: 'Pegar este' })).toHaveCount(1)
  const primeiroDoPool = page.locator('[data-protocolo-id]').first()
  await expect(primeiroDoPool.getByRole('button', { name: 'Pegar este' })).toBeVisible()
  await expect(page.getByText(/Pegue na ordem da fila/)).toBeVisible()

  await page.getByPlaceholder(BUSCA_CONFERENTE).fill(cenario.prefixo)
  const contagemDoPool = page
    .locator('strong:has-text("Pool disponível")')
    .locator('xpath=following-sibling::span[1]')
    .first()
  await expect(contagemDoPool).toHaveText('2')
  // De quem é o ato não aparece — nem o escrevente, nem a equipe dele.
  await expect(page.getByText(comEquipe, { exact: true })).toHaveCount(0)
  await expect(page.getByText(FIXOS.equipe, { exact: true })).toHaveCount(0)

  const filtros = await abrirFiltros(page)
  await expect(filtros.getByText('Equipe do escrevente', { exact: true })).toHaveCount(0)
  await alternarOpcao(page, filtros, 'Tipo de ato', reservado.nome)
  await aplicarFiltros(page)
  await expect(contagemDoPool).toHaveText('1')
  await expect(page.getByText(doReservado.numero, { exact: true })).toBeVisible()
  await expect(page.getByText(doCenario.numero, { exact: true })).toHaveCount(0)
  await capturarPaginaInteira(page, 'e2e/.screenshots/minha-fila-v2-filtro-claro.png')

  await usarTemaEscuro(page)
  await page.reload()
  await expect(page.getByText('Pool disponível')).toBeVisible()
  await capturarPaginaInteira(page, 'e2e/.screenshots/minha-fila-v2-escuro.png')
})
