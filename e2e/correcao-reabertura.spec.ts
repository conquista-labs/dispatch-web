import { expect, request, test } from '@playwright/test'

// Comportamento real do RF-24a-d (correção de resultado + pedido de reabertura), não só
// aparência: cria o próprio cenário via API (tipo de ato + protocolo + conferente concluindo
// o ato), interage pela UI de verdade (corrigir, avançar o relógio do browser pra sair da
// janela de 15 min, pedir reabertura, decidir como distribuidora) e confere cada passo pela
// resposta de rede — mesmo padrão dos outros specs de comportamento desta sessão
// (central-de-regras.spec.ts).
//
// Precisa da API local rodando e do conferente seed `conferente-visual@cartorio.com` /
// `Senha123!`, na escala (ver e2e/minha-fila.spec.ts) — cadastrado uma vez, reaproveitado
// entre specs.
const API_URL = process.env.VITE_API_URL ?? 'http://localhost:5245'
const EMAIL_DISTRIBUIDORA = process.env.E2E_DISTRIBUIDORA_EMAIL ?? 'distribuidora@cartorio.com'
const SENHA_DISTRIBUIDORA = process.env.E2E_DISTRIBUIDORA_SENHA ?? 'Senha123!'
// Criar tipo de ato é só do Administrador (dispatch-api ADR-0039).
const EMAIL_ADMIN = process.env.E2E_ADMIN_EMAIL ?? 'administrador@cartorio.com'
const SENHA_ADMIN = process.env.E2E_ADMIN_SENHA ?? 'Senha123!'
const EMAIL_CONFERENTE = process.env.E2E_CONFERENTE_EMAIL ?? 'conferente-visual@cartorio.com'
const SENHA_CONFERENTE = process.env.E2E_CONFERENTE_SENHA ?? 'Senha123!'

test('Correção de resultado e pedido de reabertura — ciclo completo pela UI', async ({ page, browser }) => {
  const api = await request.newContext({ baseURL: API_URL })

  const loginResp = await api.post('/auth/login', { data: { email: EMAIL_DISTRIBUIDORA, senha: SENHA_DISTRIBUIDORA } })
  const { token: tokenDistribuidora } = await loginResp.json()
  const authDistribuidora = { Authorization: `Bearer ${tokenDistribuidora}` }

  const loginAdminResp = await api.post('/auth/login', { data: { email: EMAIL_ADMIN, senha: SENHA_ADMIN } })
  const { token: tokenAdmin } = await loginAdminResp.json()
  const authAdmin = { Authorization: `Bearer ${tokenAdmin}` }

  const loginConferenteResp = await api.post('/auth/login', {
    data: { email: EMAIL_CONFERENTE, senha: SENHA_CONFERENTE },
  })
  const { token: tokenConferente } = await loginConferenteResp.json()
  const authConferente = { Authorization: `Bearer ${tokenConferente}` }

  // Limpa qualquer sobra de uma execução anterior que não tenha terminado (ex.: teste
  // interrompido no meio) — limite de 1 ato simultâneo (RF-21) bloquearia "iniciar" abaixo se
  // sobrasse algo em "em conferência".
  const conferentes = await (await api.get('/conferentes', { headers: authDistribuidora })).json()
  const conferenteId = conferentes.find((c: { email: string }) => c.email === EMAIL_CONFERENTE).id
  const filaAnterior = await (await api.get(`/conferentes/${conferenteId}/fila`, { headers: authDistribuidora })).json()
  for (const p of filaAnterior.emConferencia) {
    await api.post(`/minha-fila/${p.id}/concluir`, { headers: authConferente, data: { aprovado: true } })
  }
  for (const p of filaAnterior.atribuidos) {
    await api.post(`/protocolos/${p.id}/devolver-ao-pool`, { headers: authDistribuidora })
  }

  // Monta o cenário: tipo de ato de teste + protocolo distribuído + conferente concluindo.
  const nomeTipo = `Tipo Correcao ${Date.now()}`
  const tipoResp = await api.post('/tipos-ato', { headers: authAdmin, data: { nome: nomeTipo } })
  expect(tipoResp.ok()).toBe(true)

  // O protocolo entra por importação (o endpoint de distribuição avulsa saiu do back numa
  // auditoria) e é atribuído à mão à conferente de teste — atribuição manual não passa pela
  // alçada (dispatch-api ADR-0027), então as regras do banco local não mudam o destino.
  const numero = `COR-${Date.now()}`
  const importarResp = await api.post('/protocolos/importar/confirmar', {
    headers: authDistribuidora,
    data: {
      etapa: 'PosConferencia',
      linhaDeCorte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      linhas: [
        {
          protocolo: numero,
          tipoAto: nomeTipo,
          escrevente: 'Escrevente Correção E2E',
          dataHoraAndamento: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        },
      ],
    },
  })
  expect(importarResp.ok()).toBe(true)

  // Pool, exceção ou já com alguém — procura o número em qualquer lugar da visão.
  const visao = await (await api.get('/protocolos/distribuicao', { headers: authDistribuidora })).json()
  const acharPorNumero = (no: unknown): { id: string } | undefined => {
    if (Array.isArray(no)) return no.map(acharPorNumero).find(Boolean)
    if (no && typeof no === 'object') {
      const registro = no as Record<string, unknown>
      if (registro.numero === numero && typeof registro.id === 'string') return { id: registro.id }
      return Object.values(registro).map(acharPorNumero).find(Boolean)
    }
    return undefined
  }
  const protocoloId = acharPorNumero(visao)?.id
  expect(protocoloId, `protocolo ${numero} não apareceu na visão de distribuição`).toBeTruthy()

  const atribuirResp = await api.post(`/protocolos/${protocoloId}/atribuir`, {
    headers: authDistribuidora,
    data: { conferenteId },
  })
  expect(atribuirResp.status()).toBe(204)

  await api.post(`/minha-fila/${protocoloId}/iniciar`, { headers: authConferente })
  const concluirResp = await api.post(`/minha-fila/${protocoloId}/concluir`, {
    headers: authConferente,
    data: { aprovado: true },
  })
  expect(concluirResp.status()).toBe(204)

  // Login pela UI como o conferente, agora que o cenário já existe.
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(EMAIL_CONFERENTE)
  await page.getByLabel('Senha').fill(SENHA_CONFERENTE)
  await page.getByRole('button', { name: 'Entrar' }).click()
  // RF-03, ajustado a pedido do dono: login cai no Dashboard agora — navega explicitamente.
  await expect(page).toHaveURL(/\/dashboard/)
  await page.getByRole('link', { name: 'Minha fila' }).click()
  await expect(page).toHaveURL(/\/minha-fila/)

  const linhaConcluido = page.getByTestId(`concluido-${protocoloId}`)
  await expect(linhaConcluido).toBeVisible()
  await expect(linhaConcluido.getByText(/pode corrigir por/)).toBeVisible()

  // Corrigir dentro da janela — troca Aprovado → Não aprovado.
  const [respostaCorrigir] = await Promise.all([
    page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes('/corrigir-resultado')),
    linhaConcluido.getByRole('button', { name: /Corrigir para/ }).click(),
  ])
  expect(respostaCorrigir.status()).toBe(204)
  await expect(page.getByTestId(`concluido-${protocoloId}`).getByText('Não aprovado')).toBeVisible()

  await page.screenshot({ path: 'e2e/.screenshots/correcao-dentro-da-janela-claro.png', fullPage: true })

  // Avança o relógio do browser pra depois da janela de 15 min — sem isso não dá pra testar
  // "pedir reabertura" pela UI de verdade (o botão só aparece fora da janela).
  const agora = Date.now()
  await page.clock.install({ time: agora })
  await page.clock.fastForward('16:00')
  await page.reload()

  const linhaForaDaJanela = page.getByTestId(`concluido-${protocoloId}`)
  // Fora da janela (e já corrigido uma vez): a correção some e sobra o pedido de reabertura.
  await expect(linhaForaDaJanela.getByText('resultado já corrigido uma vez')).toBeVisible()
  await expect(linhaForaDaJanela.getByRole('button', { name: 'Pedir reabertura à distribuidora' })).toBeVisible()

  const [respostaPedir] = await Promise.all([
    page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes('/pedir-reabertura')),
    linhaForaDaJanela.getByRole('button', { name: 'Pedir reabertura à distribuidora' }).click(),
  ])
  expect(respostaPedir.status()).toBe(201)
  const { pedidoId } = await respostaPedir.json()
  await expect(linhaForaDaJanela.getByText('Reabertura solicitada — aguardando a distribuidora')).toBeVisible()

  await page.screenshot({ path: 'e2e/.screenshots/pedido-reabertura-pendente-claro.png', fullPage: true })

  // Login como distribuidora num CONTEXTO de browser novo — page.clock é escopado ao
  // BrowserContext inteiro (não só à página), então uma newPage() no mesmo contexto do
  // conferente ainda herdaria o relógio mockado/congelado. Um contexto novo nasce com
  // relógio real, sem essa interferência.
  const contextoDistribuidora = await browser.newContext()
  const paginaDistribuidora = await contextoDistribuidora.newPage()
  await paginaDistribuidora.addInitScript(() => {
    localStorage.setItem('dispatch-tema', JSON.stringify({ state: { tema: 'dark' }, version: 0 }))
  })
  await paginaDistribuidora.goto('/login')
  await paginaDistribuidora.getByLabel('E-mail').fill(EMAIL_DISTRIBUIDORA)
  await paginaDistribuidora.getByLabel('Senha').fill(SENHA_DISTRIBUIDORA)
  await paginaDistribuidora.getByRole('button', { name: 'Entrar' }).click()
  // RF-03, ajustado a pedido do dono: login cai no Dashboard agora — navega explicitamente.
  await expect(paginaDistribuidora).toHaveURL(/\/dashboard/)
  await paginaDistribuidora.getByRole('link', { name: 'Distribuição' }).click()
  await expect(paginaDistribuidora).toHaveURL(/\/distribuicao/)

  await paginaDistribuidora.getByRole('button', { name: /Exceções/ }).click()
  await expect(paginaDistribuidora.getByText(/Pedidos de reabertura · \d/)).toBeVisible()
  const cardPedido = paginaDistribuidora.getByTestId(`pedido-reabertura-${pedidoId}`)
  await expect(cardPedido).toBeVisible()

  await paginaDistribuidora.screenshot({ path: 'e2e/.screenshots/aba-excecoes-pedidos-escuro.png', fullPage: true })

  const [respostaReabrir] = await Promise.all([
    paginaDistribuidora.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes('/aprovar')),
    cardPedido.getByRole('button', { name: 'Reabrir' }).click(),
  ])
  expect(respostaReabrir.status()).toBe(204)
  await expect(cardPedido).not.toBeVisible()

  // Confirma via API que o protocolo voltou pro mesmo dono, atribuído e com o cronômetro parado —
  // reabrir não liga o tempo sozinho (dispatch-api ADR-0031); ele liga quando a pessoa iniciar.
  const detalheResp = await api.get(`/protocolos/${protocoloId}/detalhe`, { headers: authDistribuidora })
  const detalhe = await detalheResp.json()
  expect(detalhe.status).toBe('Atribuido')

  await contextoDistribuidora.close()
  await api.dispose()
})
