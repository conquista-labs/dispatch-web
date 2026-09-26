import { capturarPaginaInteira, CONTAS, entrar, expect, FIXOS, test, usarTemaEscuro } from './support/cenario'

// Distribuição (RF-13 a RF-18) com um protocolo do cenário em cada balde — pool, atribuído, em
// conferência, concluído e exceção — montados pela API (ver e2e/support/cenario.ts). A busca do
// quadro com o prefixo do cenário isola os cards deste teste do resto do banco local, então a
// asserção vale num banco vazio ou num clone de produção.
test('Distribuição — as 3 abas renderizam com dados reais', async ({ page, cenario }) => {
  // Exceção "ninguém com alçada": Reserva do tipo pra alguém fora da escala. Desde o ADR-0012 do
  // back a importação cadastra tipo novo sozinha, então "tipo novo" não nasce mais de importação.
  const reservado = await cenario.tipoAto(FIXOS.tipoAtoReservado, 'Notariais')
  await cenario.reservaSemNinguem(reservado.id)
  // A conta seed recebe os atribuídos; com alçada plena ela é elegível e o motor manda pro pool.
  await cenario.alcadaPlena(CONTAS.conferenteRf27)
  await cenario.esvaziarFila('conferenteRf27')

  const [excecao, noPool, atribuido, emConferencia, concluido] = await cenario.importar([
    { tipoAto: reservado.nome },
    {},
    {},
    {},
    {},
  ])
  expect(await cenario.situacao(excecao.id)).toMatchObject({ status: 'Excecao', motivoExcecao: 'ninguém com alçada' })
  expect((await cenario.situacao(noPool.id)).status).toBe('Pool')

  await cenario.atribuir(atribuido.id, CONTAS.conferenteRf27)
  // Limite de 1 ato simultâneo (RF-21): conclui um antes de deixar o outro em conferência.
  await cenario.atribuir(concluido.id, CONTAS.conferenteRf27)
  await cenario.iniciar(concluido.id, 'conferenteRf27')
  await cenario.concluir(concluido.id, 'conferenteRf27')
  await cenario.atribuir(emConferencia.id, CONTAS.conferenteRf27)
  await cenario.iniciar(emConferencia.id, 'conferenteRf27')

  await entrar(page, 'distribuidora')
  await page
    .getByRole('link', { name: /^Distribuição/ })
    .first()
    .click()
  await expect(page).toHaveURL(/\/distribuicao/)
  await expect(page.getByRole('heading', { name: 'Distribuição' })).toBeVisible()
  await page.getByPlaceholder('Buscar protocolo, tipo de ato, escrevente, equipe…').fill(cenario.prefixo)

  // Por conferente (aba padrão): o do pool na coluna "Pool aberto", os da conferente na coluna dela.
  await expect(page.getByText('Pool aberto')).toBeVisible()
  await expect(page.getByText(noPool.numero, { exact: true })).toBeVisible()
  await expect(page.getByText(atribuido.numero, { exact: true })).toBeVisible()
  await expect(page.getByText(emConferencia.numero, { exact: true })).toBeVisible()
  await capturarPaginaInteira(page, 'e2e/.screenshots/distribuicao-conferente-claro.png')

  // Por status: o concluído só aparece aqui (a aba por conferente mostra só o que está na mão).
  await page.getByRole('button', { name: 'Por status' }).click()
  await expect(page.getByText('Em conferência', { exact: true })).toBeVisible()
  await expect(page.getByText('Concluídos', { exact: true })).toBeVisible()
  await expect(page.getByText(concluido.numero, { exact: true })).toBeVisible()
  await capturarPaginaInteira(page, 'e2e/.screenshots/distribuicao-status-claro.png')

  // Exceções: o card do cenário, com a tag e a ação de resolver.
  await page.getByRole('button', { name: /Exceções/ }).click()
  const cardExcecao = page
    .locator('div')
    .filter({ has: page.getByText(excecao.numero, { exact: true }) })
    .filter({ has: page.getByRole('button', { name: 'Resolver' }) })
    .last()
  await expect(cardExcecao.getByText('sem alçada', { exact: true })).toBeVisible()
  await expect(cardExcecao.getByRole('button', { name: 'Resolver' })).toBeVisible()
  await capturarPaginaInteira(page, 'e2e/.screenshots/distribuicao-excecoes-claro.png')

  // Tema escuro, aba por conferente de novo.
  await usarTemaEscuro(page)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Distribuição' })).toBeVisible()
  await capturarPaginaInteira(page, 'e2e/.screenshots/distribuicao-conferente-escuro.png')
})
