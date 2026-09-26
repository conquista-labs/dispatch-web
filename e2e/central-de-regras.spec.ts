import { type Page } from '@playwright/test'

import { capturarPaginaInteira, expect, test } from './support/cenario'

// O nome do tipo de ato é um botão com o texto (vira campo só ao clicar pra renomear) — a linha é
// achada pelo botão com o nome exato, e cada passo re-resolve a linha do zero (a lista é ordenada
// por nome e um refetch no meio reordena as linhas).
const linhaDoTipo = (page: Page, nome: string) =>
  page.locator('[data-tipo-ato-linha]').filter({ has: page.getByRole('button', { name: nome, exact: true }) })

const esperarLinhaPeloNome = async (page: Page, nome: string) => {
  const linha = linhaDoTipo(page, nome)
  await expect(linha).toHaveCount(1, { timeout: 10_000 })
  return { linha }
}

// Verificação visual da tela Central de regras (RF-31 a RF-41) com login real. O que a tela precisa
// e o banco local pode não ter — uma sugestão pendente no Aprendizado — a fixture `cenario` garante
// (ADR-0025); o resto (regras, equipes, escreventes sem equipe) os próprios dados fixos da fixture
// já provêm.
// Cadastro de pessoas e edição de regras são só do Administrador (dispatch-api ADR-0039).
const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'administrador@cartorio.com'
const SENHA = process.env.E2E_ADMIN_SENHA ?? 'Senha123!'

test('Central de regras — as 3 abas renderizam com dados reais', async ({ page, cenario }) => {
  await cenario.garantirSugestaoPendente()
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(EMAIL)
  await page.getByLabel('Senha').fill(SENHA)
  await page.getByRole('button', { name: 'Entrar' }).click()
  // RF-03, ajustado a pedido do dono: login cai no Dashboard agora — navega explicitamente.
  await expect(page).toHaveURL(/\/dashboard/)

  await page.getByRole('link', { name: 'Central de regras' }).click()
  await expect(page).toHaveURL(/\/central-de-regras/)
  await expect(page.getByRole('heading', { name: 'Central de regras' })).toBeVisible()

  // Regras em vigor (aba padrão desde o protótipo v2).
  await expect(page.getByRole('heading', { name: 'Tudo o que o sistema aplica hoje' })).toBeVisible()
  await capturarPaginaInteira(page, 'e2e/.screenshots/central-de-regras-vigor-claro.png')

  // Tipos de ato.
  await page.getByRole('button', { name: 'Tipos de ato' }).click()
  await expect(page.getByRole('heading', { name: 'Catálogo de tipos de ato' })).toBeVisible()
  await expect(page.getByText('em circulação').first()).toBeVisible()
  await capturarPaginaInteira(page, 'e2e/.screenshots/central-de-regras-tipos-claro.png')

  // Aprendizado.
  await page.getByRole('button', { name: 'Aprendizado' }).click()
  await expect(page.getByText('Propostas na fila')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Aplicar regra' }).first()).toBeVisible()
  await capturarPaginaInteira(page, 'e2e/.screenshots/central-de-regras-aprendizado-claro.png')

  // Alçada.
  // `exact: true` porque "Regras em vigor" tem um botão "Editar alçada", que também contém a
  // substring "alçada" (match de nome é case-insensitive por padrão) — sem isso, dá strict
  // mode violation quando a aba "vigor" já está na tela (ex.: logo após um reload).
  await page.getByRole('button', { name: 'Alçada', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Alçada', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'O que cada um alcança hoje' })).toBeVisible()
  await capturarPaginaInteira(page, 'e2e/.screenshots/central-de-regras-alcada-claro.png')

  // Construtor guiado (RF-32).
  await page.getByRole('button', { name: 'Nova regra', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Por pessoa' })).toBeVisible()
  await capturarPaginaInteira(page, 'e2e/.screenshots/central-de-regras-builder-claro.png')
  await page.getByRole('button', { name: 'Cancelar' }).click()

  // Prazos por equipe.
  await page.getByRole('button', { name: 'Prazos por equipe' }).click()
  await expect(page.getByRole('heading', { name: 'Prazo por equipe e etapa' })).toBeVisible()
  await expect(page.getByText('Escreventes sem equipe')).toBeVisible()
  await capturarPaginaInteira(page, 'e2e/.screenshots/central-de-regras-prazos-claro.png')

  // Tema escuro, aba Alçada de novo.
  await page.addInitScript(() => {
    localStorage.setItem('dispatch-tema', JSON.stringify({ state: { tema: 'dark' }, version: 0 }))
  })
  await page.reload()
  // `exact: true` porque "Regras em vigor" tem um botão "Editar alçada", que também contém a
  // substring "alçada" (match de nome é case-insensitive por padrão) — sem isso, dá strict
  // mode violation quando a aba "vigor" já está na tela (ex.: logo após um reload).
  await page.getByRole('button', { name: 'Alçada', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Alçada', exact: true })).toBeVisible()
  await capturarPaginaInteira(page, 'e2e/.screenshots/central-de-regras-alcada-escuro.png')

  await page.getByRole('button', { name: 'Regras em vigor' }).click()
  await expect(page.getByRole('heading', { name: 'Tudo o que o sistema aplica hoje' })).toBeVisible()
  await capturarPaginaInteira(page, 'e2e/.screenshots/central-de-regras-vigor-escuro.png')

  await page.getByRole('button', { name: 'Tipos de ato' }).click()
  await expect(page.getByText('em circulação').first()).toBeVisible()
  await capturarPaginaInteira(page, 'e2e/.screenshots/central-de-regras-tipos-escuro.png')
})

// Comportamento real da aba Tipos de ato (RF-34a-b,d-f), não só aparência: cadastra um tipo de
// teste, renomeia inline, mexe no peso, desativa/reativa e remove — cada ação confirmada pela
// resposta de rede, não só pelo que aparece na tela.
test('Tipos de ato — CRUD completo reflete na tela', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(EMAIL)
  await page.getByLabel('Senha').fill(SENHA)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  await page.goto('/central-de-regras')
  await page.getByRole('button', { name: 'Tipos de ato' }).click()
  await expect(page.getByRole('heading', { name: 'Catálogo de tipos de ato' })).toBeVisible()

  // Nome sem letra maiúscula "ambígua" pro back normalizar (NormalizadorDeTexto.ParaNomeProprio
  // capitaliza só a primeira letra de cada palavra) — só dígitos depois da primeira palavra,
  // pra o texto exibido bater exatamente com o que foi digitado.
  const nomeOriginal = `Tipo Teste ${Date.now()}`
  await page.getByRole('button', { name: 'Novo tipo de ato' }).click()
  await page.getByLabel('Nome').fill(nomeOriginal)
  const [respostaCriar] = await Promise.all([
    page.waitForResponse((r) => r.request().method() === 'POST' && /\/tipos-ato$/.test(r.url())),
    page.getByRole('button', { name: 'Adicionar tipo' }).click(),
  ])
  expect(respostaCriar.status()).toBe(201)
  // Espera o diálogo fechar de verdade antes de mexer na busca — ele só fecha no onSuccess da
  // mutation (depois do POST resolver), então buscar cedo demais competia com o diálogo ainda
  // aberto por cima da tela (achado testando de verdade: a busca preenchia mas o valor nunca
  // chegava a gerar o GET filtrado, porque o campo de trás ainda não estava de fato interativo).
  await expect(page.getByRole('dialog')).toHaveCount(0)

  // Lista é paginada (20 por página) e ordenada por nome — um catálogo com dezenas de tipos já
  // reais no banco local pode empurrar "Tipo Teste ..." pra página 2, fora do que
  // `esperarLinhaPeloNome` enxerga (só varre os <input> renderizados na página atual). Busca no
  // termo fixo "Tipo Teste" mantém o item de teste sempre isolado numa página só, do início ao
  // fim (sobrevive ao rename, já que "Tipo Teste ..." continua sendo prefixo depois).
  await Promise.all([
    page.waitForResponse((r) => r.url().includes('/tipos-ato/com-uso') && r.url().includes('busca=Tipo')),
    page.getByPlaceholder('buscar tipo de ato…').fill('Tipo Teste'),
  ])

  const { linha } = await esperarLinhaPeloNome(page, nomeOriginal)
  await expect(linha).toBeVisible()

  // Renomear inline (commit no blur). A lista é ordenada por nome (ListarTiposAtoComUso), então
  // renomear pode mudar a posição da linha — reachar pelo novo nome em vez de reusar `linha`
  // (que é posicional, `inputs.nth(i)`, e ficaria apontando pra outra linha depois do reorder).
  // "Renomeado" com maiúscula — o back normaliza (capitaliza a primeira letra de cada
  // palavra), então "renomeado" viraria "Renomeado" e o texto não bateria mais.
  const nomeRenomeado = `${nomeOriginal} Renomeado`
  await linha.getByRole('button', { name: nomeOriginal, exact: true }).click()
  // Em edição a linha perde o botão do nome (vira campo) — só um campo de nome existe por vez.
  await page.getByLabel('Nome do tipo de ato').fill(nomeRenomeado)
  const [respostaRenomear] = await Promise.all([
    page.waitForResponse((r) => r.request().method() === 'PUT' && /\/tipos-ato\/[^/]+$/.test(r.url())),
    // Clique em outro lugar em vez de locator.blur() — dispara o blur "de verdade", como um
    // usuário faria, e evitou uma corrida onde o PUT nunca era observado.
    page.getByRole('heading', { name: 'Catálogo de tipos de ato' }).click(),
  ])
  expect(respostaRenomear.status()).toBe(204)

  // Cada passo seguinte re-resolve a linha do zero pelo nome (nunca reusa um Locator
  // posicional entre chamadas) e espera a rede assentar antes do próximo passo — a mesma
  // causa do bug do "Venda" acima (achado congelado + refetch no meio reordena a lista).
  await page.waitForLoadState('networkidle')

  // Peso: +0,05 pelo stepper (peso decimal, 0,50–2,50 — fatia 5 do Dashboard v2).
  let { linha: linhaRenomeada } = await esperarLinhaPeloNome(page, nomeRenomeado)
  const [respostaPeso] = await Promise.all([
    page.waitForResponse((r) => r.request().method() === 'PUT' && r.url().includes('/peso')),
    linhaRenomeada.getByRole('button', { name: 'Aumentar peso' }).click(),
  ])
  expect(respostaPeso.status()).toBe(204)
  await page.waitForLoadState('networkidle')
  ;({ linha: linhaRenomeada } = await esperarLinhaPeloNome(page, nomeRenomeado))
  // Peso é um <input> digitável — achado pelo rótulo acessível, não por texto.
  const inputPeso = linhaRenomeada.getByLabel('Peso de complexidade')
  await expect(inputPeso).toHaveValue('1,05')

  // Peso: digitar direto (RF-34f, pedido explícito do dono — "no peso do tipo de ato tem que
  // ser possível digitar").
  await inputPeso.fill('1,6')
  const [respostaPesoDigitado] = await Promise.all([
    page.waitForResponse((r) => r.request().method() === 'PUT' && r.url().includes('/peso')),
    page.getByRole('heading', { name: 'Catálogo de tipos de ato' }).click(),
  ])
  expect(respostaPesoDigitado.status()).toBe(204)
  await page.waitForLoadState('networkidle')
  ;({ linha: linhaRenomeada } = await esperarLinhaPeloNome(page, nomeRenomeado))
  await expect(linhaRenomeada.getByLabel('Peso de complexidade')).toHaveValue('1,60')

  // Desativar.
  const [respostaDesativar] = await Promise.all([
    page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes('/desativar')),
    linhaRenomeada.getByRole('button', { name: 'Ativo' }).click(),
  ])
  expect(respostaDesativar.status()).toBe(204)
  await page.waitForLoadState('networkidle')
  ;({ linha: linhaRenomeada } = await esperarLinhaPeloNome(page, nomeRenomeado))
  await expect(linhaRenomeada.getByRole('button', { name: 'Inativo' })).toBeVisible()

  // Reativar.
  const [respostaAtivar] = await Promise.all([
    page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes('/ativar')),
    linhaRenomeada.getByRole('button', { name: 'Inativo' }).click(),
  ])
  expect(respostaAtivar.status()).toBe(204)
  await page.waitForLoadState('networkidle')
  ;({ linha: linhaRenomeada } = await esperarLinhaPeloNome(page, nomeRenomeado))
  await expect(linhaRenomeada.getByRole('button', { name: 'Ativo' })).toBeVisible()

  // Remover — sem uso nenhum (tipo de teste, nunca associado a protocolo/regra), 204 esperado.
  const [respostaRemover] = await Promise.all([
    page.waitForResponse((r) => r.request().method() === 'DELETE' && /\/tipos-ato\/[^/]+$/.test(r.url())),
    linhaRenomeada.getByRole('button', { name: 'Remover' }).click(),
  ])
  expect(respostaRemover.status()).toBe(204)
  await expect(linhaDoTipo(page, nomeRenomeado)).toHaveCount(0)
})
