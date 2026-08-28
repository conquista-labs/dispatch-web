import { expect, test } from '@playwright/test'

// Regressão permanente (RF-19) — Distribuidora vendo a fila de um conferente, contas seed
// fixas, sempre passa. Confirma que a tela existe, o seletor troca de conferente disparando
// uma leitura nova (GET /conferentes/{id}/fila), e que nenhum controle de escrita aparece.
const EMAIL = process.env.E2E_DISTRIBUIDORA_EMAIL ?? 'distribuidora@cartorio.com'
const SENHA = process.env.E2E_DISTRIBUIDORA_SENHA ?? 'Senha123!'

test('Distribuidora — "Minha fila" mostra a fila de um conferente, somente leitura', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(EMAIL)
  await page.getByLabel('Senha').fill(SENHA)
  await page.getByRole('button', { name: 'Entrar' }).click()

  await page.getByRole('link', { name: 'Minha fila' }).click()
  await expect(page.getByRole('heading', { name: 'Minha fila' })).toBeVisible()
  await expect(page.getByText('Pool disponível', { exact: true })).toBeVisible()
  await expect(page.getByText('Atribuídas', { exact: true })).toBeVisible()
  await expect(page.getByText('Em conferência', { exact: true })).toBeVisible()

  // Somente leitura — nenhum controle de escrita deveria existir na tela, com qualquer
  // conferente selecionado.
  for (const rotulo of ['Pegar este', 'Iniciar conferência', 'Aprovar', 'Não aprovar', '+ Observação', 'Editar observação']) {
    await expect(page.getByRole('button', { name: rotulo })).toHaveCount(0)
  }

  // Trocar de conferente no seletor (dropdown "VER COMO", mesmo padrão do seletor de Etapa em
  // Importar) dispara uma leitura nova do back, não é filtro local.
  await page.getByRole('button', { name: /VER COMO/ }).click()
  const popover = page.locator('[data-slot="popover-content"]')
  const opcoes = popover.getByRole('button')
  await expect(opcoes.first()).toBeVisible()
  const temSegunda = (await opcoes.count()) > 1

  if (temSegunda) {
    const segundaOpcao = opcoes.nth(1)
    await Promise.all([page.waitForResponse((res) => res.request().method() === 'GET' && /\/conferentes\/.+\/fila$/.test(res.url())), segundaOpcao.click()])
    // Popover fechou e a leitura nova aconteceu — confirma que o trigger "VER COMO" segue no ar
    // (não sumiu/quebrou depois da troca) em vez de reafirmar o nome, que pode se repetir entre
    // contas seed (duas se chamam "Conferente RF27").
    await expect(page.getByRole('button', { name: /VER COMO/ })).toBeVisible()
  } else {
    await page.keyboard.press('Escape')
  }
})
