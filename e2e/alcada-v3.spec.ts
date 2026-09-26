import { capturarPaginaInteira, entrar, expect, FIXOS, test, usarTemaEscuro } from './support/cenario'

// Motor de alçada v3 na Central de regras (Camadas/Matriz/Testar) com uma regra do próprio
// cenário: Reserva de um tipo de ato (grupo Notariais) pra um conferente fora da escala — ver
// e2e/support/cenario.ts. A frase da regra, o grupo na Matriz e o resultado do simulador são
// todos consequência dela, então o teste não depende das regras que o banco local tiver.
// Cadastro de pessoas e edição de regras são só do Administrador (dispatch-api ADR-0039).

test('Central de regras — Alçada v3, as 3 sub-abas', async ({ page, cenario }) => {
  const tipo = await cenario.tipoAto(FIXOS.tipoAtoReservado, 'Notariais')
  const sujeito = await cenario.reservaSemNinguem(tipo.id)
  const frase = `Só ${sujeito.nome} confere ${tipo.nome}`

  const escolherTipoNoSimulador = async () => {
    await page.getByRole('button', { name: 'Testar', exact: true }).click()
    // O seletor de tipo é o gatilho ao lado do rótulo "Tipo" (o nome do botão é o tipo escolhido).
    await page.getByText('Tipo', { exact: true }).locator('xpath=..').getByRole('button').click()
    await page.getByPlaceholder('buscar tipo de ato…').fill(tipo.nome)
    await page.getByRole('button', { name: tipo.nome, exact: true }).click()
    // A reserva barra todo mundo na escala, e o sujeito dela não está na escala.
    await expect(page.getByText('Ninguém pode conferir')).toBeVisible()
    await expect(page.getByText('iria para a fila de exceções')).toBeVisible()
  }

  await entrar(page, 'administrador')
  await page.getByRole('link', { name: 'Central de regras' }).click()
  await page.getByRole('button', { name: 'Alçada', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Alçada', exact: true })).toBeVisible()

  // Camadas (padrão). As regras ficam em grupos recolhidos por sujeito (protótipo v2); a busca
  // abre os grupos que batem.
  await expect(page.getByText('Base por nível').first()).toBeVisible()
  await expect(page.getByText('Ajuste por equipe').first()).toBeVisible()
  await expect(page.getByText('Exceção por pessoa').first()).toBeVisible()
  const busca = page.getByPlaceholder('buscar por nível, pessoa, tipo de ato, equipe…')
  await busca.fill(sujeito.nome)
  await expect(page.getByText(frase)).toBeVisible()
  await capturarPaginaInteira(page, 'e2e/.screenshots/alcada-v3-camadas-claro.png')
  await busca.fill('')

  // Matriz: o grupo Notariais aparece (tem o tipo do cenário) e expande pros tipos dele.
  await page.getByRole('button', { name: 'Matriz', exact: true }).click()
  await expect(page.getByText('Grupo / tipo de ato')).toBeVisible()
  await expect(page.getByTestId('expandir-grupo-Notariais')).toBeVisible()
  await capturarPaginaInteira(page, 'e2e/.screenshots/alcada-v3-matriz-claro.png')
  await page.getByTestId('expandir-grupo-Notariais').click()
  await expect(page.getByText(tipo.nome, { exact: true })).toBeVisible()
  await capturarPaginaInteira(page, 'e2e/.screenshots/alcada-v3-matriz-expandida-claro.png')

  // Testar: o simulador roda o motor de verdade sobre o tipo reservado.
  await escolherTipoNoSimulador()
  await capturarPaginaInteira(page, 'e2e/.screenshots/alcada-v3-testar-claro.png')

  // Tema escuro.
  await usarTemaEscuro(page)
  await page.reload()
  await page.getByRole('button', { name: 'Alçada', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Alçada', exact: true })).toBeVisible()
  await capturarPaginaInteira(page, 'e2e/.screenshots/alcada-v3-camadas-escuro.png')

  await escolherTipoNoSimulador()
  await capturarPaginaInteira(page, 'e2e/.screenshots/alcada-v3-testar-escuro.png')

  await page.getByRole('button', { name: 'Matriz', exact: true }).click()
  await page.getByTestId('expandir-grupo-Notariais').click()
  await capturarPaginaInteira(page, 'e2e/.screenshots/alcada-v3-matriz-escuro.png')
})
