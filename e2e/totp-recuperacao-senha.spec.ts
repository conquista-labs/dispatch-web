import { expect, test } from '@playwright/test'
import { createHmac } from 'node:crypto'

// RF-01a-l: registro de autenticador (TOTP, RFC 6238 de verdade) e recuperação de senha em 3
// etapas. Cria um conferente de teste (mesma convenção de conferentes.spec.ts) porque o fluxo
// troca a senha da conta pra valer — não pode reusar a conta seed fixa.
const EMAIL = process.env.E2E_DISTRIBUIDORA_EMAIL ?? 'distribuidora@cartorio.com'
const SENHA = process.env.E2E_DISTRIBUIDORA_SENHA ?? 'Senha123!'

// Base32 decode + HOTP/TOTP (RFC 4226/6238) — sem lib externa, só node:crypto.
const base32ToBytes = (base32: string) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = ''
  for (const char of base32.replace(/=+$/, '')) {
    bits += alphabet.indexOf(char.toUpperCase()).toString(2).padStart(5, '0')
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }
  return Buffer.from(bytes)
}

const totpCode = (base32Secret: string, stepOffset = 0) => {
  const counter = Math.floor(Date.now() / 30000) + stepOffset
  const counterBuffer = Buffer.alloc(8)
  counterBuffer.writeBigUInt64BE(BigInt(counter))
  const hmac = createHmac('sha1', base32ToBytes(base32Secret)).update(counterBuffer).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const code = ((hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).toString().padStart(6, '0')
  return code
}

test('TOTP e recuperação de senha — registrar autenticador e redefinir a senha de ponta a ponta', async ({ page }) => {
  const conferenteEmail = `e2e-totp-${Date.now()}@cartorio.com`
  const senhaInicial = 'Senha123!'
  const senhaNova = 'cavalo azul correndo livre 2'

  // Cadastra o conferente de teste como distribuidora.
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(EMAIL)
  await page.getByLabel('Senha').fill(SENHA)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  await page.getByRole('link', { name: 'Conferentes' }).click()
  await page.getByRole('button', { name: 'Novo conferente' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Nome', { exact: true }).fill('Conferente E2E TOTP')
  await dialog.getByLabel('E-mail', { exact: true }).fill(conferenteEmail)
  await dialog.getByLabel('Senha', { exact: true }).fill(senhaInicial)
  const [respostaCadastro] = await Promise.all([
    page.waitForResponse((res) => res.request().method() === 'POST' && res.url().endsWith('/conferentes')),
    dialog.getByRole('button', { name: 'Cadastrar' }).click(),
  ])
  const { conferenteId } = await respostaCadastro.json()
  await expect(dialog).toBeHidden()

  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL(/\/login/)

  // "Registrar autenticador" — link visível na tela de login, mesmo deslogado.
  await page.getByRole('link', { name: 'Registrar autenticador' }).click()
  await expect(page).toHaveURL(/\/totp\/registrar/)
  await expect(page.getByRole('heading', { name: 'Entre para registrar seu autenticador' })).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/totp-registrar-login-claro.png', fullPage: true })

  await page.getByLabel('E-mail').fill(conferenteEmail)
  await page.getByLabel('Senha', { exact: true }).fill(senhaInicial)
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page.getByRole('heading', { name: 'Registre seu autenticador' })).toBeVisible()
  await expect(page.getByText('Sem câmera? Digite a chave')).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/totp-registrar-qr-claro.png', fullPage: true })

  const chaveTexto = await page.locator('div.font-mono.text-\\[13px\\]').first().textContent()
  const chaveBase32 = (chaveTexto ?? '').replace(/\s/g, '')
  expect(chaveBase32.length).toBeGreaterThan(10)

  await page.getByLabel('Confirme com o código que o app mostra').fill(totpCode(chaveBase32))
  await page.getByRole('button', { name: 'Confirmar registro' }).click()
  await expect(page.getByText('Autenticador registrado. A partir de agora você recupera a senha sozinho, pelo app.')).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/totp-registrar-sucesso-claro.png', fullPage: true })

  await page.getByRole('button', { name: 'Ir para o Dashboard' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
  await page.getByRole('button', { name: 'Sair' }).click()

  // "Esqueci minha senha" — recuperação em 3 etapas.
  await page.getByRole('link', { name: 'Esqueci minha senha' }).click()
  await expect(page).toHaveURL(/\/recuperar-senha/)
  await expect(page.getByText('ETAPA 1 DE 3')).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/recuperar-ident-claro.png', fullPage: true })

  await page.getByLabel('Seu e-mail de acesso').fill(conferenteEmail)
  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(page.getByText('ETAPA 2 DE 3')).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/recuperar-codigo-claro.png', fullPage: true })
  // Bloco seguinte: o passo anterior já pode ter consumido o contador do bloco atual (replay),
  // e um clique de sobra empurra o relógio real pra frente do que a etapa 2 calcularia sozinha.
  await page.getByLabel('Código de 6 dígitos').fill(totpCode(chaveBase32, 1))
  await page.getByRole('button', { name: 'Validar código' }).click()

  await expect(page.getByText('ETAPA 3 DE 3')).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/recuperar-senha-claro.png', fullPage: true })
  await page.getByLabel('Nova senha', { exact: true }).fill(senhaNova)
  await page.getByLabel('Repita a nova senha').fill(senhaNova)
  await expect(page.getByText('Pelo menos 12 caracteres')).toBeVisible()
  await page.getByRole('button', { name: 'Salvar nova senha' }).click()

  await expect(page.getByRole('heading', { name: 'Senha alterada' })).toBeVisible()
  await expect(page.getByText('Todas as sessões abertas foram encerradas.')).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/recuperar-ok-claro.png', fullPage: true })

  await page.getByRole('button', { name: 'Ir para o login' }).click()
  await expect(page).toHaveURL(/\/login/)

  // Confirma que a senha nova de fato funciona (e só ela).
  await page.getByLabel('E-mail').fill(conferenteEmail)
  await page.getByLabel('Senha', { exact: true }).fill(senhaInicial)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()

  await page.getByLabel('Senha', { exact: true }).fill(senhaNova)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  // Tema escuro — só as telas públicas novas, layout de card único (RNF-04: sem toggle na
  // própria tela, mesmo comportamento herdado do /login — segue o tema já persistido).
  await page.getByRole('button', { name: 'Sair' }).click()
  await page.addInitScript(() => {
    localStorage.setItem('dispatch-tema', JSON.stringify({ state: { tema: 'dark' }, version: 0 }))
  })
  await page.goto('/totp/registrar')
  await expect(page.getByRole('heading', { name: 'Entre para registrar seu autenticador' })).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/totp-registrar-escuro.png', fullPage: true })
  await page.goto('/recuperar-senha')
  await expect(page.getByText('ETAPA 1 DE 3')).toBeVisible()
  await page.screenshot({ path: 'e2e/.screenshots/recuperar-ident-escuro.png', fullPage: true })

  // Limpeza: remove o conferente de teste (mesma convenção de conferentes.spec.ts) — sem isso,
  // toda rodada desta suíte deixa mais uma conta órfã no Postgres local.
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(EMAIL)
  await page.getByLabel('Senha', { exact: true }).fill(SENHA)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.getByRole('link', { name: 'Conferentes' }).click()
  const card = page.getByTestId(`conferente-card-${conferenteId}`)
  await Promise.all([
    page.waitForResponse((res) => res.request().method() === 'DELETE' && res.url().includes(`/conferentes/${conferenteId}`)),
    card.getByRole('button', { name: 'Remover' }).click(),
  ])
  await expect(card).toHaveCount(0)
})
