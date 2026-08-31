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
const EMAIL_CONFERENTE = process.env.E2E_CONFERENTE_EMAIL ?? 'conferente-visual@cartorio.com'
const SENHA_CONFERENTE = process.env.E2E_CONFERENTE_SENHA ?? 'Senha123!'

test('Correção de resultado e pedido de reabertura — ciclo completo pela UI', async ({ page, browser }) => {
  const api = await request.newContext({ baseURL: API_URL })

  const loginResp = await api.post('/auth/login', { data: { email: EMAIL_DISTRIBUIDORA, senha: SENHA_DISTRIBUIDORA } })
  const { token: tokenDistribuidora } = await loginResp.json()
  const authDistribuidora = { Authorization: `Bearer ${tokenDistribuidora}` }

  const loginConferenteResp = await api.post('/auth/login', { data: { email: EMAIL_CONFERENTE, senha: SENHA_CONFERENTE } })
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
  const tipoResp = await api.post('/tipos-ato', { headers: authDistribuidora, data: { nome: nomeTipo } })
  const { tipoAtoId } = await tipoResp.json()

  const numero = `COR-${Date.now()}`
  const distribuirResp = await api.post('/protocolos/distribuir', {
    headers: authDistribuidora,
    data: { numero, tipoAtoId, etapa: 'PosConferencia', prioridade: 'Normal', escreventeNome: 'Escrevente Correção E2E' },
  })
  const { protocoloId } = await distribuirResp.json()

  await api.post(`/minha-fila/${protocoloId}/pegar`, { headers: authConferente })
  await api.post(`/minha-fila/${protocoloId}/iniciar`, { headers: authConferente })
  const concluirResp = await api.post(`/minha-fila/${protocoloId}/concluir`, { headers: authConferente, data: { aprovado: true } })
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
  await expect(linhaForaDaJanela.getByText('janela de correção encerrada')).toBeVisible()

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

  // Confirma via API que o protocolo voltou pro mesmo dono, em conferência.
  const detalheResp = await api.get(`/protocolos/${protocoloId}/detalhe`, { headers: authDistribuidora })
  const detalhe = await detalheResp.json()
  expect(detalhe.status).toBe('Conferindo')

  await contextoDistribuidora.close()
  await api.dispose()
})
