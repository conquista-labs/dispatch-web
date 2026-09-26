import { expect, test } from '@playwright/test'

// Regressão permanente de Contas (6.8 do documento v2, RF-44 a RF-48) e da troca de senha no
// primeiro acesso (RF-45). Cria a própria conta e a desativa no fim — conta não se apaga (só
// desativa, preservando histórico), então cada rodada deixa uma conta inativa no banco local.
const EMAIL_ADMIN = process.env.E2E_ADMIN_EMAIL ?? 'administrador@cartorio.com'
const SENHA_ADMIN = process.env.E2E_ADMIN_SENHA ?? 'Senha123!'
const EMAIL_DISTRIBUIDORA = process.env.E2E_DISTRIBUIDORA_EMAIL ?? 'distribuidora@cartorio.com'
const SENHA_DISTRIBUIDORA = process.env.E2E_DISTRIBUIDORA_SENHA ?? 'Senha123!'

const entrar = async (page: import('@playwright/test').Page, email: string, senha: string) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

test('Contas — admin cria conta, a pessoa troca a senha no primeiro acesso, admin desativa', async ({ page }) => {
  const email = `e2e-conta-${Date.now()}@cartorio.com`
  const senhaNova = 'girassol amarelo no campo 7'

  await entrar(page, EMAIL_ADMIN, SENHA_ADMIN)
  await expect(page).toHaveURL(/\/dashboard/)
  // RF-48: a sessão do admin tem o selo e o item Contas.
  await expect(page.getByRole('complementary').getByText('ADMIN', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Contas', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Contas' })).toBeVisible()

  // A própria conta: trava com "Entendi", sem chamar a API.
  const minhaLinha = page.getByTestId(`conta-${EMAIL_ADMIN}`)
  await expect(minhaLinha.getByText('você')).toBeVisible()
  await minhaLinha.getByRole('button', { name: 'Desativar' }).click()
  await expect(page.getByRole('alertdialog')).toContainText('Não é possível desativar')
  await page.getByRole('button', { name: 'Entendi' }).click()

  await page.getByRole('button', { name: 'Criar conta' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Nome').fill('Conta E2E')
  await dialog.getByLabel('E-mail').fill(email)
  await dialog.getByRole('button', { name: 'Gerar' }).click()
  const senhaInicial = await dialog.getByLabel('Senha inicial').inputValue()
  expect(senhaInicial).toMatch(/^.{4}-.{4}-\d{2}$/)
  // Sem `fullPage` com o diálogo aberto: com ele, a conta nascia mas o `waitForResponse` abaixo nunca
  // via o POST /contas e o teste estourava o tempo (ver e2e-tests.md).
  await page.screenshot({ path: 'e2e/.screenshots/contas-criar-claro.png' })
  await Promise.all([
    page.waitForResponse((res) => res.request().method() === 'POST' && res.url().endsWith('/contas')),
    dialog.getByRole('button', { name: 'Criar conta' }).click(),
  ])
  await expect(dialog).toBeHidden()
  await expect(page.getByTestId(`conta-${email}`)).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/contas-claro.png', fullPage: true })

  // Primeiro acesso: preso na troca de senha até trocar.
  await page.getByRole('button', { name: 'Sair' }).click()
  await entrar(page, email, senhaInicial)
  await expect(page).toHaveURL(/\/trocar-senha/)
  await page.goto('/distribuicao')
  await expect(page).toHaveURL(/\/trocar-senha/)
  await page.getByLabel('Senha inicial').fill(senhaInicial)
  await page.getByLabel('Nova senha', { exact: true }).fill(senhaNova)
  await page.getByLabel('Repita a nova senha').fill(senhaNova)
  await page.getByRole('button', { name: 'Salvar e entrar' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
  // Distribuidora nova: sem Contas no menu.
  await expect(page.getByRole('link', { name: 'Contas', exact: true })).toHaveCount(0)

  // Limpeza: o admin desativa a conta de teste.
  await page.getByRole('button', { name: 'Sair' }).click()
  await entrar(page, EMAIL_ADMIN, SENHA_ADMIN)
  await page.getByRole('link', { name: 'Contas', exact: true }).click()
  const linha = page.getByTestId(`conta-${email}`)
  await linha.getByRole('button', { name: 'Desativar' }).click()
  await expect(page.getByRole('alertdialog')).toContainText('Desativar a conta de Conta E2E?')
  await Promise.all([
    page.waitForResponse((res) => res.request().method() === 'POST' && res.url().endsWith('/desativar')),
    page.getByRole('button', { name: 'Desativar conta' }).click(),
  ])
  await expect(linha.getByText('○ Inativa')).toBeVisible()
})

// RF-29a / RF-30a: pra distribuidora, Conferentes é só presença e a Central é só leitura.
test('Distribuidora — Conferentes só presença, Central só leitura, sem Contas', async ({ page }) => {
  await entrar(page, EMAIL_DISTRIBUIDORA, SENHA_DISTRIBUIDORA)
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('link', { name: 'Contas', exact: true })).toHaveCount(0)

  await page.getByRole('link', { name: 'Conferentes', exact: true }).click()
  await expect(page.getByText('Cadastro e jornada ficam com a administração.', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Novo conferente' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Remover' })).toHaveCount(0)
  await expect(page.getByText(/Analista/)).toHaveCount(0)
  await page.screenshot({ path: 'e2e/.screenshots/conferentes-distribuidora-claro.png', fullPage: true })

  await page.getByRole('link', { name: 'Central de regras', exact: true }).click()
  await expect(page.getByText('ajustes ficam com a administração', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Alçada', exact: true })).toHaveCount(0)
  await expect(page.getByText('só a administração edita').first()).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/central-distribuidora-claro.png', fullPage: true })

  await page.goto('/contas')
  await expect(page).toHaveURL(/\/dashboard/)
})
