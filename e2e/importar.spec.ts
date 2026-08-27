import { expect, test } from '@playwright/test'

// Verificação visual + funcional da tela Importar (RF-05 a RF-12) — o fluxo completo: colar
// relatório real → pré-visualizar → confirmar → ver na Distribuição de verdade. Precisa da API
// local com pelo menos um tipo de ato conhecido ("VENDA E COMPRA") e um conferente na escala,
// pra a prévia mostrar tanto atribuição quanto tipo desconhecido (ver skill verify-visual).
const EMAIL = process.env.E2E_DISTRIBUIDORA_EMAIL ?? 'distribuidora@cartorio.com'
const SENHA = process.env.E2E_DISTRIBUIDORA_SENHA ?? 'Senha123!'

const CSV = `protocolo,tipoAto,escrevente,dataHoraAndamento
262414,VENDA E COMPRA,BARBARA RIBEIRO,2026-08-26 10:16:53
262681,VENDA E COMPRA,BARBARA RIBEIRO,2026-08-26 09:59:41
230765,VENDA E COMPRA,EDUARDO NUNES BRISOLA,2026-08-26 11:15:35
262920,VENDA E COMPRA,GABRIELLY TAVARES LIMA,2026-08-26 11:41:11
262495,VENDA E COMPRA,GIOVANNA LAUDELINA ZUPELLO VIANA,2026-08-26 10:14:58
262447,INVENTARIO,RAISSA SOARES FONSECA LIMA AGHAZARM,2026-08-26 08:49:48`

test('importar um relatório de verdade — dados, prévia e confirmação', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(EMAIL)
  await page.getByLabel('Senha').fill(SENHA)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/distribuicao/)

  await page.getByRole('link', { name: 'Importar' }).click()
  await expect(page.getByRole('heading', { name: 'Importar relatório' })).toBeVisible()

  await page.getByPlaceholder(/protocolo,tipoAto/).fill(CSV)
  await page.screenshot({ path: 'e2e/.screenshots/importar-dados-claro.png', fullPage: true })

  await page.getByRole('button', { name: 'Pré-visualizar' }).click()
  await expect(page.getByText('Protocolo')).toBeVisible()
  await expect(page.getByText('262414')).toBeVisible()
  await expect(page.getByText('tipo novo')).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/importar-revisao-claro.png', fullPage: true })

  await page.getByRole('button', { name: 'Ver distribuição' }).click()
  await expect(page.getByText('Como o lote ficaria')).toBeVisible()
  await expect(page.getByText('Tipos de ato desconhecidos')).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/importar-previa-claro.png', fullPage: true })

  await page.getByRole('button', { name: 'Confirmar e distribuir' }).click()
  await expect(page.getByText(/Lote importado/)).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/importar-concluido-claro.png', fullPage: true })

  await page.getByRole('button', { name: 'Ver distribuição' }).click()
  await expect(page).toHaveURL(/\/distribuicao/)
  await expect(page.getByText('262414')).toBeVisible()
})
