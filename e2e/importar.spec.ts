import { capturarPaginaInteira, CONTAS, entrar, expect, FIXOS, test } from './support/cenario'

// Importar (RF-05 a RF-12), o fluxo inteiro pela tela: colar → revisão linha a linha → prévia →
// confirmar → ver na Distribuição. Números de protocolo do cenário (ver e2e/support/cenario.ts),
// apagados no fim pela limpeza registrada antes de confirmar.
//
// "Tipo novo" aparece só na prévia e nunca é confirmado: confirmar cadastraria o tipo no catálogo,
// e tipo de ato com protocolo (mesmo excluído) não sai mais pela API — cada rodada deixaria um.
// Por isso o lote é lido duas vezes: com a linha de tipo novo (revisão e prévia), e de novo sem
// ela, pra confirmar.

// A tela pré-preenche a linha de corte com o início de hoje e o relatório não traz fuso (horário
// local do navegador, como `dataHoraParaIso`) — o andamento precisa ser de hoje, depois da meia-noite.
const andamentoDeHoje = () => {
  const inicioDoDia = new Date()
  inicioDoDia.setHours(0, 0, 1, 0)
  const data = new Date(Math.max(Date.now() - 60 * 1000, inicioDoDia.getTime()))
  const dois = (n: number) => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())} ${dois(data.getHours())}:${dois(data.getMinutes())}:${dois(data.getSeconds())}`
}

test('importar um relatório de verdade — dados, prévia e confirmação', async ({ page, cenario }) => {
  const tipo = await cenario.tipoAto(FIXOS.tipoAto)
  const { comEquipe, semEquipe } = await cenario.escreventes()
  // Alguém com alçada na escala: a revisão mostra "N com alçada" e o motor manda pro pool.
  await cenario.alcadaPlena(CONTAS.conferenteRf27)

  const [semEquipeNum, comEquipeNum, tipoNovoNum] = [
    cenario.proximoNumero(),
    cenario.proximoNumero(),
    cenario.proximoNumero(),
  ]
  const tipoNovo = `E2e Tipo Novo ${cenario.prefixo}`
  const andamento = andamentoDeHoje()
  const linha = (numero: string, tipoAto: string, escrevente: string) =>
    `${numero},${tipoAto},${escrevente},${andamento}`
  const cabecalho = 'protocolo,tipoAto,escrevente,dataHoraAndamento'
  const loteComTipoNovo = [
    cabecalho,
    linha(semEquipeNum, tipo.nome.toUpperCase(), semEquipe.toUpperCase()),
    linha(comEquipeNum, tipo.nome.toUpperCase(), comEquipe.toUpperCase()),
    linha(tipoNovoNum, tipoNovo.toUpperCase(), semEquipe.toUpperCase()),
  ].join('\n')
  const loteParaConfirmar = [
    cabecalho,
    linha(semEquipeNum, tipo.nome, semEquipe),
    linha(comEquipeNum, tipo.nome, comEquipe),
  ].join('\n')
  cenario.apagarAoFinal([semEquipeNum, comEquipeNum, tipoNovoNum])

  await entrar(page, 'distribuidora')
  await page.getByRole('link', { name: 'Importar' }).click()
  await expect(page.getByRole('heading', { name: 'Importar relatório' })).toBeVisible()

  await page.getByPlaceholder(/protocolo,tipoAto/).fill(loteComTipoNovo)
  await expect(page.getByText('3 linhas coladas')).toBeVisible()
  await capturarPaginaInteira(page, 'e2e/.screenshots/importar-dados-claro.png')

  // Revisão linha a linha (RF-08): tipo em caixa alta casa com o catálogo; o desconhecido é "tipo novo".
  await page.getByRole('button', { name: 'Ler 3 linhas' }).click()
  await expect(page.getByText(semEquipeNum, { exact: true })).toBeVisible()
  await expect(page.getByText('tipo novo', { exact: true })).toHaveCount(1)
  await expect(page.getByText(/^\d+ com alçada$/).first()).toBeVisible()
  await capturarPaginaInteira(page, 'e2e/.screenshots/importar-revisao-claro.png')

  // Prévia agregada (RF-10/RF-11): avisa do tipo desconhecido e não grava nada.
  await page.getByRole('button', { name: 'Ver distribuição' }).click()
  await expect(page.getByText(/Como o lote ficaria/)).toBeVisible()
  await expect(page.getByText('Tipos de ato que o sistema não conhece')).toBeVisible()
  await capturarPaginaInteira(page, 'e2e/.screenshots/importar-previa-claro.png')
  expect(await cenario.acharTipoAto(tipoNovo), 'a prévia não pode cadastrar tipo de ato').toBeUndefined()

  // Volta aos dados e lê o lote sem a linha de tipo novo.
  await page.getByRole('button', { name: 'Voltar' }).click()
  await page.getByRole('button', { name: 'Voltar' }).click()
  await page.getByPlaceholder(/protocolo,tipoAto/).fill(loteParaConfirmar)
  await page.getByRole('button', { name: 'Ler 2 linhas' }).click()
  await expect(page.getByText(comEquipeNum, { exact: true })).toBeVisible()
  await expect(page.getByText('tipo novo', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Ver distribuição' }).click()

  const [confirmacao] = await Promise.all([
    page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes('/protocolos/importar/confirmar')),
    page.getByRole('button', { name: 'Confirmar e distribuir' }).click(),
  ])
  expect(confirmacao.status()).toBe(200)
  await expect(page.getByText('Lote importado — 2 protocolos distribuídos.')).toBeVisible()
  await capturarPaginaInteira(page, 'e2e/.screenshots/importar-concluido-claro.png')

  // Na Distribuição de verdade — a busca isola os dois do resto do pool.
  await page.getByRole('button', { name: 'Ver distribuição' }).click()
  await expect(page).toHaveURL(/\/distribuicao/)
  await page.getByPlaceholder('Buscar protocolo, tipo de ato, escrevente, equipe…').fill(cenario.prefixo)
  await expect(page.getByText(semEquipeNum, { exact: true })).toBeVisible()
  await expect(page.getByText(comEquipeNum, { exact: true })).toBeVisible()
  await expect(page.getByText(tipoNovoNum, { exact: true })).toHaveCount(0)
})
