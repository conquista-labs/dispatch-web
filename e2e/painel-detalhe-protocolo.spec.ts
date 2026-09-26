import { capturarPaginaInteira, entrar, expect, FIXOS, test } from './support/cenario'

// Painel de detalhe do protocolo (RF-18a/b) a partir de uma exceção "ninguém com alçada" montada
// pela API: Reserva do tipo pra um conferente fora da escala, então ninguém na escala pode
// conferir (ver e2e/support/cenario.ts). Confere o painel abrindo pelo card, a alçada por pessoa
// (todo mundo barrado pela reserva), a ação que depende de alçada falhando de verdade no back e o
// fechamento por Esc.
test('painel de detalhe abre a partir do card, mostra alçada e fecha por Esc', async ({ page, cenario }) => {
  const reservado = await cenario.tipoAto(FIXOS.tipoAtoReservado, 'Notariais')
  await cenario.reservaSemNinguem(reservado.id)
  const [excecao] = await cenario.importar([{ tipoAto: reservado.nome }])
  expect((await cenario.situacao(excecao.id)).motivoExcecao).toBe('ninguém com alçada')

  await entrar(page, 'distribuidora')
  await page
    .getByRole('link', { name: /^Distribuição/ })
    .first()
    .click()
  await expect(page).toHaveURL(/\/distribuicao/)
  await page.getByPlaceholder('Buscar protocolo, tipo de ato, escrevente, equipe…').fill(cenario.prefixo)

  await page.getByRole('button', { name: /Exceções/ }).click()
  await page.getByText(excecao.numero, { exact: true }).click()

  const painel = page.getByRole('dialog')
  await expect(painel.getByText('LINHA DO TEMPO')).toBeVisible()
  await expect(painel.getByText('QUEM PODE CONFERIR ESTE ATO')).toBeVisible()
  // A reserva barra todo mundo na escala — ninguém aparece como "pode conferir".
  await expect(painel.getByText('reservado a outra pessoa').first()).toBeVisible()
  await expect(painel.getByText(/· pode conferir$/)).toHaveCount(0)
  await capturarPaginaInteira(page, 'e2e/.screenshots/painel-detalhe-claro.png')

  // "Atribuir ao menos carregado" passa pela alçada no back — sem elegível, recusa e o painel diz.
  const [resposta] = await Promise.all([
    page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes('/atribuir-ao-menos-carregado')),
    painel.getByRole('button', { name: 'Atribuir ao menos carregado' }).click(),
  ])
  expect(resposta.ok()).toBe(false)
  await expect(painel.getByText('Ninguém com alçada na escala agora.')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByText('LINHA DO TEMPO')).not.toBeVisible()
})
