import { expect, type Page, test } from '@playwright/test'

// Nome de tipo de ato vive num <input> controlado (edição inline) — React não reflete a prop
// `value` como atributo DOM, então nem CSS `[value=...]` nem `hasText` acham a linha certa.
// Acha pelo valor de verdade via .inputValue() de cada <input> candidato.
const linhaPeloNomeDoTipoAto = async (page: Page, nome: string) => {
  const inputs = page.locator('input')
  const total = await inputs.count()
  for (let i = 0; i < total; i++) {
    const candidato = inputs.nth(i)
    if ((await candidato.inputValue()) === nome) {
      return { input: candidato, linha: candidato.locator('xpath=..') }
    }
  }
  return null
}

// Espera a linha aparecer (poll) e devolve o mesmo resultado que fez a asserção passar — duas
// chamadas separadas (uma pro poll, outra pra pegar o valor) arriscam uma corrida com o
// refetch do TanStack Query no meio; aqui é uma leitura só, reaproveitada.
const esperarLinhaPeloNome = async (page: Page, nome: string) => {
  let achado: Awaited<ReturnType<typeof linhaPeloNomeDoTipoAto>> = null
  await expect
    .poll(
      async () => {
        achado = await linhaPeloNomeDoTipoAto(page, nome)
        return achado !== null
      },
      { timeout: 10_000 },
    )
    .toBe(true)
  return achado!
}

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

  // Regras em vigor (aba padrão desde o protótipo v2).
  await expect(page.getByRole('heading', { name: 'Tudo o que o sistema aplica hoje' })).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/central-de-regras-vigor-claro.png', fullPage: true })

  // Tipos de ato.
  await page.getByRole('button', { name: 'Tipos de ato' }).click()
  await expect(page.getByRole('heading', { name: 'Tipos de ato' })).toBeVisible()
  await expect(page.getByText('em circulação').first()).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/central-de-regras-tipos-claro.png', fullPage: true })

  // Aprendizado.
  await page.getByRole('button', { name: 'Aprendizado' }).click()
  await expect(page.getByText('Propostas na fila')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Aplicar' }).first()).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/central-de-regras-aprendizado-claro.png', fullPage: true })

  // Alçada.
  // `exact: true` porque "Regras em vigor" tem um botão "Editar alçada", que também contém a
  // substring "alçada" (match de nome é case-insensitive por padrão) — sem isso, dá strict
  // mode violation quando a aba "vigor" já está na tela (ex.: logo após um reload).
  await page.getByRole('button', { name: 'Alçada', exact: true }).click()
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
  // `exact: true` porque "Regras em vigor" tem um botão "Editar alçada", que também contém a
  // substring "alçada" (match de nome é case-insensitive por padrão) — sem isso, dá strict
  // mode violation quando a aba "vigor" já está na tela (ex.: logo após um reload).
  await page.getByRole('button', { name: 'Alçada', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Regras de alçada' })).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/central-de-regras-alcada-escuro.png', fullPage: true })

  await page.getByRole('button', { name: 'Regras em vigor' }).click()
  await expect(page.getByRole('heading', { name: 'Tudo o que o sistema aplica hoje' })).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/central-de-regras-vigor-escuro.png', fullPage: true })

  await page.getByRole('button', { name: 'Tipos de ato' }).click()
  await expect(page.getByText('em circulação').first()).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/central-de-regras-tipos-escuro.png', fullPage: true })
})

// Comportamento real da aba Tipos de ato (RF-34a-b,d-f), não só aparência: cadastra um tipo de
// teste, renomeia inline, mexe no peso, desativa/reativa e remove — cada ação confirmada pela
// resposta de rede, não só pelo que aparece na tela.
test('Tipos de ato — CRUD completo reflete na tela', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(EMAIL)
  await page.getByLabel('Senha').fill(SENHA)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/distribuicao/)

  await page.goto('/central-de-regras')
  await page.getByRole('button', { name: 'Tipos de ato' }).click()
  await expect(page.getByRole('heading', { name: 'Tipos de ato' })).toBeVisible()

  // Nome sem letra maiúscula "ambígua" pro back normalizar (NormalizadorDeTexto.ParaNomeProprio
  // capitaliza só a primeira letra de cada palavra) — só dígitos depois da primeira palavra,
  // pra o texto exibido bater exatamente com o que foi digitado.
  const nomeOriginal = `Tipo Teste ${Date.now()}`
  await page.getByRole('button', { name: 'Novo tipo de ato' }).click()
  await page.getByLabel('Nome').fill(nomeOriginal)
  await page.getByRole('button', { name: 'Cadastrar' }).click()

  // Espera a criação invalidar e refazer o fetch da tabela ANTES de localizar a linha — o
  // achado é posicional (`inputs.nth(i)`, congelado no momento da busca); se um refetch ainda
  // em andamento reordenar as linhas depois de achar mas antes de usar, o índice acaba
  // apontando pra outra linha (achado testando de verdade: renomeou "Venda" por engano).
  await page.waitForLoadState('networkidle')
  const { input: inputNome, linha } = await esperarLinhaPeloNome(page, nomeOriginal)
  await expect(linha).toBeVisible()
  await expect(inputNome).toHaveValue(nomeOriginal)

  // Renomear inline (commit no blur). A lista é ordenada por nome (ListarTiposAtoComUso), então
  // renomear pode mudar a posição da linha — reachar pelo novo nome em vez de reusar `linha`
  // (que é posicional, `inputs.nth(i)`, e ficaria apontando pra outra linha depois do reorder).
  // "Renomeado" com maiúscula — o back normaliza (capitaliza a primeira letra de cada
  // palavra), então "renomeado" viraria "Renomeado" e o texto não bateria mais.
  const nomeRenomeado = `${nomeOriginal} Renomeado`
  await inputNome.fill(nomeRenomeado)
  const [respostaRenomear] = await Promise.all([
    page.waitForResponse((r) => r.request().method() === 'PUT' && /\/tipos-ato\/[^/]+$/.test(r.url())),
    // Clique em outro lugar em vez de locator.blur() — dispara o blur "de verdade", como um
    // usuário faria, e evitou uma corrida onde o PUT nunca era observado.
    page.getByRole('heading', { name: 'Tipos de ato' }).click(),
  ])
  expect(respostaRenomear.status()).toBe(204)

  // Cada passo seguinte re-resolve a linha do zero pelo nome (nunca reusa um Locator
  // posicional entre chamadas) e espera a rede assentar antes do próximo passo — a mesma
  // causa do bug do "Venda" acima (achado congelado + refetch no meio reordena a lista).
  await page.waitForLoadState('networkidle')

  // Peso: +1 pelo stepper.
  let { linha: linhaRenomeada } = await esperarLinhaPeloNome(page, nomeRenomeado)
  const [respostaPeso] = await Promise.all([
    page.waitForResponse((r) => r.request().method() === 'PUT' && r.url().includes('/peso')),
    linhaRenomeada.getByRole('button').nth(1).click(), // botão "+" do stepper de peso
  ])
  expect(respostaPeso.status()).toBe(204)
  await page.waitForLoadState('networkidle')
  ;({ linha: linhaRenomeada } = await esperarLinhaPeloNome(page, nomeRenomeado))
  // Peso agora é um <input> digitável (2º input da linha, o 1º é o nome) — não dá pra achar
  // por getByText como antes de virar input (mesma armadilha do nome, documentada acima).
  const inputPeso = linhaRenomeada.locator('input').nth(1)
  await expect(inputPeso).toHaveValue('2')

  // Peso: digitar direto (RF-34f, pedido explícito do dono — "no peso do tipo de ato tem que
  // ser possível digitar").
  await inputPeso.fill('4')
  const [respostaPesoDigitado] = await Promise.all([
    page.waitForResponse((r) => r.request().method() === 'PUT' && r.url().includes('/peso')),
    page.getByRole('heading', { name: 'Tipos de ato' }).click(),
  ])
  expect(respostaPesoDigitado.status()).toBe(204)
  await page.waitForLoadState('networkidle')
  ;({ linha: linhaRenomeada } = await esperarLinhaPeloNome(page, nomeRenomeado))
  await expect(linhaRenomeada.locator('input').nth(1)).toHaveValue('4')

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
  // waitForFunction roda dentro do browser (sem round-trip do CDP por elemento, como
  // linhaPeloNomeDoTipoAto faz) — mais rápido e evitou uma corrida onde o poll baseado em
  // Locator nunca convergia mesmo com a linha já removida de verdade (confirmado via API).
  await page.waitForFunction(
    (nome) => !Array.from(document.querySelectorAll('input')).some((el) => (el as HTMLInputElement).value === nome),
    nomeRenomeado,
  )
})
