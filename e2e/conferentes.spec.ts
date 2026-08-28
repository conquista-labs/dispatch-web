import { expect, test } from '@playwright/test'

// Regressão permanente da tela Conferentes (RF-25 a RF-30) — contas seed fixas, sempre passa.
// Cria um conferente de teste, edita nome/e-mail e remove no final (RF-25: remover é soft
// delete — GET /conferentes já filtra ativo=false na origem, então "sumir da lista" é o
// comportamento esperado logo depois de remover, não precisa esperar nada).
const EMAIL = process.env.E2E_DISTRIBUIDORA_EMAIL ?? 'distribuidora@cartorio.com'
const SENHA = process.env.E2E_DISTRIBUIDORA_SENHA ?? 'Senha123!'

test('Conferentes — carrega, cadastra, edita perfil e remove um conferente de teste', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(EMAIL)
  await page.getByLabel('Senha').fill(SENHA)
  await page.getByRole('button', { name: 'Entrar' }).click()

  await page.getByRole('link', { name: 'Conferentes' }).click()
  await expect(page.getByRole('heading', { name: 'Conferentes' })).toBeVisible()
  await expect(page.getByText('Na escala hoje', { exact: true })).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/conferentes-claro.png', fullPage: true })

  const email = `e2e-conferentes-${Date.now()}@cartorio.com`
  await page.getByRole('button', { name: 'Novo conferente' }).click()
  // getByLabel casa por substring — sem escopar ao diálogo, "Nome" também acha o
  // aria-label "Editar nome e e-mail" do lápis de qualquer card já na lista atrás do modal.
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Nome', { exact: true }).fill('Conferente E2E')
  await dialog.getByLabel('E-mail', { exact: true }).fill(email)
  await dialog.getByLabel('Senha', { exact: true }).fill('Senha123!')

  // Pega o Id de verdade da resposta do cadastro — bem mais confiável que tentar achar "o card
  // certo" via texto (nome pode se repetir, e um <div> genérico contendo o texto do card inteiro
  // pode casar com mais de um nível de aninhamento).
  const [resposta] = await Promise.all([
    page.waitForResponse((res) => res.request().method() === 'POST' && res.url().endsWith('/conferentes')),
    dialog.getByRole('button', { name: 'Cadastrar' }).click(),
  ])
  const { conferenteId } = await resposta.json()

  const card = page.getByTestId(`conferente-card-${conferenteId}`)
  await expect(card).toBeVisible()
  await expect(card.getByText('Conferente E2E', { exact: true })).toBeVisible()

  // RF-25 "editar" — nome/e-mail, modal próprio (EditarConferenteDialog), separado dos
  // controles rápidos de nível/jornada que ficam direto no card.
  await card.getByRole('button', { name: 'Editar nome e e-mail' }).click()
  const dialogEditar = page.getByRole('dialog')
  await dialogEditar.getByLabel('Nome', { exact: true }).fill('Conferente E2E Editado')
  await Promise.all([
    page.waitForResponse((res) => res.request().method() === 'PUT' && res.url().includes(`/conferentes/${conferenteId}/perfil`)),
    dialogEditar.getByRole('button', { name: 'Salvar' }).click(),
  ])
  await expect(card.getByText('Conferente E2E Editado', { exact: true })).toBeVisible()

  await Promise.all([
    page.waitForResponse((res) => res.request().method() === 'DELETE' && res.url().includes(`/conferentes/${conferenteId}`)),
    card.getByRole('button', { name: 'Remover' }).click(),
  ])
  await expect(card).toHaveCount(0)
})
