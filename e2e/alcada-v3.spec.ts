import { expect, test } from '@playwright/test'

// Verificação visual pontual do Motor de alçada v3 (Camadas/Matriz/Testar) — precisa de dado
// seedado à mão: regras nas 3 camadas (nível, equipe, pessoa), uma reserva, uma regra de grupo,
// e ao menos um tipo de ato com grupo definido (ver skill verify-visual).
// Cadastro de pessoas e edição de regras são só do Administrador (dispatch-api ADR-0039).
const EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'administrador@cartorio.com'
const SENHA = process.env.E2E_ADMIN_SENHA ?? 'Senha123!'

test('Central de regras — Alçada v3, as 3 sub-abas', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(EMAIL)
  await page.getByLabel('Senha').fill(SENHA)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.getByRole('link', { name: 'Central de regras' }).click()
  await page.getByRole('button', { name: 'Alçada', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Regras de alçada' })).toBeVisible()

  // Camadas (padrão).
  await expect(page.getByText('Base por nível')).toBeVisible()
  await expect(page.getByText('Ajuste por equipe')).toBeVisible()
  await expect(page.getByText('Exceção por pessoa')).toBeVisible()
  // As regras ficam em grupos recolhidos por sujeito (protótipo v2); a busca abre os grupos que batem.
  await page.getByPlaceholder('buscar por nível, pessoa, tipo de ato, equipe…').fill('Marcio Santos')
  await expect(page.getByText(/Só Marcio Santos confere/)).toBeVisible()
  await page.getByPlaceholder('buscar por nível, pessoa, tipo de ato, equipe…').fill('')
  await page.screenshot({ path: 'e2e/.screenshots/alcada-v3-camadas-claro.png', fullPage: true })

  // Matriz.
  await page.getByRole('button', { name: 'Matriz', exact: true }).click()
  await expect(page.getByText('Grupo / tipo de ato')).toBeVisible()
  await expect(page.getByText('Transmissões')).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/alcada-v3-matriz-claro.png', fullPage: true })

  // Expande um grupo pra ver os tipos individuais.
  await page.getByTestId('expandir-grupo-Notariais').click()
  await expect(page.getByText('Divórcio Com Partilha')).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/alcada-v3-matriz-expandida-claro.png', fullPage: true })

  // Testar.
  await page.getByRole('button', { name: 'Testar', exact: true }).click()
  await page.getByRole('button', { name: 'Divórcio Com Partilha' }).click()
  await expect(page.getByText(/pessoa\(s\) podem conferir|Ninguém pode conferir/)).toBeVisible()
  await expect(page.getByText('Base por nível')).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/alcada-v3-testar-claro.png', fullPage: true })

  // Tema escuro.
  await page.addInitScript(() => {
    localStorage.setItem('dispatch-tema', JSON.stringify({ state: { tema: 'dark' }, version: 0 }))
  })
  await page.reload()
  await page.getByRole('button', { name: 'Alçada', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Regras de alçada' })).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/alcada-v3-camadas-escuro.png', fullPage: true })

  await page.getByRole('button', { name: 'Testar', exact: true }).click()
  await page.getByRole('button', { name: 'Divórcio Com Partilha' }).click()
  await expect(page.getByText(/pessoa\(s\) podem conferir|Ninguém pode conferir/)).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/alcada-v3-testar-escuro.png', fullPage: true })

  await page.getByRole('button', { name: 'Matriz', exact: true }).click()
  await page.getByTestId('expandir-grupo-Notariais').click()
  await page.screenshot({ path: 'e2e/.screenshots/alcada-v3-matriz-escuro.png', fullPage: true })
})
