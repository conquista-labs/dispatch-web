import { expect, test as base, type APIRequestContext, type APIResponse, type Page } from '@playwright/test'

// Cenário de teste montado pela API, dentro do próprio teste, e desfeito no fim — o que o
// ADR-0025 decidiu no lugar das "specs de verificação pontual" do ADR-0020, que dependiam de dado
// semeado à mão e falhavam em qualquer banco que não fosse o de quem as escreveu.
//
// Por que uma fixture do Playwright (`test.extend`) e não um `try/finally` em cada spec: a
// fixture roda a parte depois do `entregar()` mesmo quando o teste falha no meio (é o `finally`
// dela), e cada spec só declara `{ cenario }` nos parâmetros — a limpeza não depende de ninguém
// lembrar. (`entregar` é o `use` da documentação do Playwright; renomeado porque o oxlint toma
// qualquer `use(...)` por hook do React.)
//
// Duas classes de dado:
// - **Do teste** (protocolo, regra de alçada): nasce com nome/número único por rodada e
//   é apagado no fim. Protocolo sai por DELETE (soft delete — some de todas as leituras, que filtram
//   `Excluido`); regra, por DELETE de verdade.
// - **Fixo** (tipo de ato, equipe, escrevente, conferente fora da escala, a sugestão pendente —
//   ver `garantirSugestaoPendente`): a API não apaga — tipo
//   de ato com protocolo (mesmo excluído) não sai, escrevente/equipe não têm DELETE, conferente só
//   desativa. Pra não deixar um por rodada, usam nome fixo: criados na primeira vez, reaproveitados
//   depois. A contagem cresce uma vez e para.
export const API_URL = process.env.VITE_API_URL ?? 'http://localhost:5245'

// As contas que o globalSetup garante (ADR-0021) — senha fixa do POST /dev/seed-e2e.
export const SENHA_PADRAO = 'Senha123!'
export const CONTAS = {
  administrador: 'administrador@cartorio.com',
  distribuidora: 'distribuidora@cartorio.com',
  conferenteRf27: 'conferente-rf27@cartorio.com',
  conferenteVisual: 'conferente-visual@cartorio.com',
} as const
export type Conta = keyof typeof CONTAS

// Nomes já no formato que o back grava (NormalizadorDeTexto.ParaNomeProprio: "E2E" vira "E2e") —
// assim o texto na tela bate com o daqui sem replicar a normalização.
export const FIXOS = {
  tipoAto: 'E2e Cenario',
  // Tipo só usado com uma Reserva por cima (exceção "sem alçada", frase "Só X confere…"); grupo
  // Notariais pra aparecer na Matriz da Alçada.
  tipoAtoReservado: 'E2e Reservado',
  equipe: 'E2e Equipe',
  escreventeComEquipe: 'E2e Escrevente Com Equipe',
  escreventeSemEquipe: 'E2e Escrevente Sem Equipe',
  conferenteForaDaEscala: { nome: 'E2e Conferente Fora Da Escala', email: 'e2e-fora-da-escala@cartorio.com' },
} as const

// Todo número de protocolo criado aqui começa com isso — é assim que a varredura de sobras
// reconhece o que é de teste.
const PREFIXO_PROTOCOLO = 'E2E'

export type Etapa = 'PreConferencia' | 'PosConferencia'
export type Prioridade = 'Baixa' | 'Normal' | 'Alta'
type GrupoTipoAto = 'Transmissoes' | 'Sucessoes' | 'Familia' | 'Garantias' | 'Notariais'

export type ProtocoloCriado = { id: string; numero: string }
export type LinhaDeProtocolo = { tipoAto?: string; escrevente?: string }

type ProtocoloResumo = { id: string; numero: string; status: string; donoId: string | null }
type VisaoDistribuicao = Record<'pool' | 'atribuidos' | 'emConferencia' | 'concluidos' | 'excecoes', ProtocoloResumo[]>
type ConferenteApi = { id: string; nome: string; email: string; naEscala: boolean }
type RegraApi = {
  id: string
  sujeitoConferenteId: string | null
  permissao: string
  alvoTipoAtoId: string | null
  alvoTodosOsAtos: boolean
}
export type SugestaoApi = { id: string; tipo: string; chave: string; status: string }

type CorpoRegra = {
  sujeitoNivel?: 'Junior' | 'Pleno' | 'Senior' | null
  sujeitoConferenteId?: string | null
  permissao: 'Permite' | 'Nega' | 'Reserva'
  alvoTipoAtoId?: string | null
  alvoTodosOsAtos?: boolean
}

const mesmoNome = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }) === 0

const todosDaVisao = (visao: VisaoDistribuicao): ProtocoloResumo[] => [
  ...visao.pool,
  ...visao.atribuidos,
  ...visao.emConferencia,
  ...visao.concluidos,
  ...visao.excecoes,
]

export class Cenario {
  /** Único por cenário — número de protocolo e busca na tela usam isto pra isolar o que é deste teste. */
  readonly prefixo = `${PREFIXO_PROTOCOLO}${Date.now().toString(36).slice(-6)}`

  private readonly tokens = new Map<Conta, string>()
  // Pilha: desfaz na ordem inversa da criação (a regra sai antes do tipo que ela referencia, etc.).
  private readonly limpezas: { descricao: string; executar: () => Promise<void> }[] = []
  private sequencia = 0

  constructor(private readonly api: APIRequestContext) {}

  // ---------- HTTP ----------

  private async token(conta: Conta): Promise<string> {
    const existente = this.tokens.get(conta)
    if (existente) return existente
    const resposta = await this.api.post('/auth/login', { data: { email: CONTAS[conta], senha: SENHA_PADRAO } })
    await exigirOk(resposta, `login de ${CONTAS[conta]}`)
    const { token } = (await resposta.json()) as { token: string }
    this.tokens.set(conta, token)
    return token
  }

  private async chamar(
    conta: Conta,
    metodo: 'GET' | 'POST' | 'PUT' | 'DELETE',
    caminho: string,
    corpo?: unknown,
  ): Promise<APIResponse> {
    const resposta = await this.api.fetch(caminho, {
      method: metodo,
      headers: { Authorization: `Bearer ${await this.token(conta)}` },
      data: corpo,
    })
    await exigirOk(resposta, `${metodo} ${caminho}`)
    return resposta
  }

  private async ler<T>(conta: Conta, caminho: string): Promise<T> {
    return (await (await this.chamar(conta, 'GET', caminho)).json()) as T
  }

  private aoLimpar(descricao: string, executar: () => Promise<void>) {
    this.limpezas.push({ descricao, executar })
  }

  /** Desfaz tudo o que o cenário criou, mesmo se uma etapa falhar — as falhas saem juntas no fim. */
  async limpar(): Promise<void> {
    const falhas: string[] = []
    while (this.limpezas.length > 0) {
      const { descricao, executar } = this.limpezas.pop()!
      try {
        await executar()
      } catch (erro) {
        falhas.push(`${descricao}: ${erro instanceof Error ? erro.message : String(erro)}`)
      }
    }
    if (falhas.length > 0) throw new Error(`Limpeza do cenário deixou sobra:\n- ${falhas.join('\n- ')}`)
  }

  /**
   * Apaga o que uma rodada interrompida (Ctrl+C, processo morto) deixou pra trás: protocolos com
   * o prefixo de teste e regras apontando pros dados fixos. Roda no começo de todo cenário.
   */
  async varrerSobras(): Promise<void> {
    const visao = await this.ler<VisaoDistribuicao>('distribuidora', '/protocolos/distribuicao')
    for (const protocolo of todosDaVisao(visao).filter((p) => p.numero.startsWith(PREFIXO_PROTOCOLO))) {
      await this.chamar('distribuidora', 'DELETE', `/protocolos/${protocolo.id}`)
    }

    const tipos = await this.ler<{ id: string; nome: string }[]>('administrador', '/tipos-ato')
    const tiposFixos = new Set(
      tipos
        .filter((t) => mesmoNome(t.nome, FIXOS.tipoAto) || mesmoNome(t.nome, FIXOS.tipoAtoReservado))
        .map((t) => t.id),
    )
    const conferentes = await this.ler<ConferenteApi[]>('administrador', '/conferentes')
    const idPorEmail = new Map(conferentes.map((c) => [c.email.toLowerCase(), c.id]))
    const foraDaEscala = idPorEmail.get(FIXOS.conferenteForaDaEscala.email)
    const seeds = new Set([idPorEmail.get(CONTAS.conferenteRf27), idPorEmail.get(CONTAS.conferenteVisual)])

    const regras = await this.ler<RegraApi[]>('administrador', '/regras-alcada')
    const sobras = regras.filter(
      (r) =>
        (r.alvoTipoAtoId !== null && tiposFixos.has(r.alvoTipoAtoId)) ||
        (foraDaEscala !== undefined && r.sujeitoConferenteId === foraDaEscala) ||
        // Só `alcadaPlena` cria "Permite todos os atos" pras contas seed — que só existem pra e2e.
        (r.sujeitoConferenteId !== null &&
          seeds.has(r.sujeitoConferenteId) &&
          r.permissao === 'Permite' &&
          r.alvoTodosOsAtos),
    )
    for (const regra of sobras) {
      await this.chamar('administrador', 'DELETE', `/regras-alcada/${regra.id}`)
    }
  }

  // ---------- Dados fixos (achar ou criar) ----------

  /** Só lê — pra afirmar que algo NÃO foi gravado (ex.: a prévia da importação não cadastra tipo). */
  async acharTipoAto(nome: string): Promise<{ id: string; nome: string } | undefined> {
    return (await this.ler<{ id: string; nome: string }[]>('administrador', '/tipos-ato')).find((t) =>
      mesmoNome(t.nome, nome),
    )
  }

  /** Tipo de ato com nome fixo, ativo, e com o grupo pedido (ou sem grupo). */
  async tipoAto(nome: string, grupo: GrupoTipoAto | null = null): Promise<{ id: string; nome: string }> {
    const achar = async () =>
      (
        await this.ler<{ id: string; nome: string; ativo: boolean; grupo: GrupoTipoAto | null }[]>(
          'administrador',
          '/tipos-ato',
        )
      ).find((t) => mesmoNome(t.nome, nome))

    let tipo = await achar()
    if (!tipo) {
      await this.chamar('administrador', 'POST', '/tipos-ato', { nome })
      tipo = await achar()
      if (!tipo) throw new Error(`tipo de ato "${nome}" não apareceu depois de criado`)
    }
    if (!tipo.ativo) await this.chamar('administrador', 'POST', `/tipos-ato/${tipo.id}/ativar`)
    if (tipo.grupo !== grupo) await this.chamar('administrador', 'PUT', `/tipos-ato/${tipo.id}/grupo`, { grupo })
    return { id: tipo.id, nome: tipo.nome }
  }

  /** A equipe fixa, com prazo D+1 nas duas etapas — nunca "urgente" (senão o motor atribui em vez de mandar pro pool). */
  async equipe(): Promise<{ id: string; nome: string }> {
    type EquipeApi = { id: string; nome: string; prazoPreConferencia: string; prazoPosConferencia: string }
    const achar = async () =>
      (await this.ler<EquipeApi[]>('administrador', '/equipes')).find((e) => mesmoNome(e.nome, FIXOS.equipe))

    let equipe = await achar()
    if (!equipe) {
      await this.chamar('administrador', 'POST', '/equipes', {
        nome: FIXOS.equipe,
        prazoPreConferencia: 'D1',
        prazoPosConferencia: 'D1',
      })
      equipe = await achar()
      if (!equipe) throw new Error('equipe fixa não apareceu depois de criada')
    }
    if (equipe.prazoPreConferencia !== 'D1' || equipe.prazoPosConferencia !== 'D1') {
      await this.chamar('administrador', 'PUT', `/equipes/${equipe.id}`, {
        nome: equipe.nome,
        prazoPreConferencia: 'D1',
        prazoPosConferencia: 'D1',
        cortePreConferenciaHorarioCorte: null,
        cortePreConferenciaHorarioVencimento: null,
        cortePosConferenciaHorarioCorte: null,
        cortePosConferenciaHorarioVencimento: null,
      })
    }
    return { id: equipe.id, nome: equipe.nome }
  }

  /** Escrevente com nome fixo, na equipe pedida (`null` = sem equipe). */
  async escrevente(nome: string, equipeId: string | null): Promise<{ id: string; nome: string }> {
    type EscreventeApi = { id: string; nome: string; equipeId: string | null }
    const achar = async () =>
      (await this.ler<EscreventeApi[]>('administrador', '/escreventes')).find((e) => mesmoNome(e.nome, nome))

    let escrevente = await achar()
    if (!escrevente) {
      await this.chamar('administrador', 'POST', '/escreventes', { nome, equipeId })
      escrevente = await achar()
      if (!escrevente) throw new Error(`escrevente "${nome}" não apareceu depois de criado`)
    }
    if (escrevente.equipeId !== equipeId) {
      await this.chamar('administrador', 'POST', `/escreventes/${escrevente.id}/mover`, { equipeId })
    }
    return { id: escrevente.id, nome: escrevente.nome }
  }

  /** Os dois escreventes fixos (um na equipe fixa, outro sem equipe) — o par que quase todo cenário usa. */
  async escreventes(): Promise<{ comEquipe: string; semEquipe: string; equipe: string }> {
    const equipe = await this.equipe()
    const comEquipe = await this.escrevente(FIXOS.escreventeComEquipe, equipe.id)
    const semEquipe = await this.escrevente(FIXOS.escreventeSemEquipe, null)
    return { comEquipe: comEquipe.nome, semEquipe: semEquipe.nome, equipe: equipe.nome }
  }

  async conferente(email: string): Promise<ConferenteApi> {
    const conferente = (await this.ler<ConferenteApi[]>('administrador', '/conferentes')).find(
      (c) => c.email.toLowerCase() === email.toLowerCase(),
    )
    if (!conferente) throw new Error(`conferente ${email} não existe (o globalSetup deveria ter criado)`)
    return conferente
  }

  /**
   * Conferente fixo que fica fora da escala: sujeito de Reserva que não recebe nada — com a
   * reserva, ninguém na escala tem alçada pro tipo, e o protocolo cai em exceção "ninguém com alçada".
   */
  async conferenteForaDaEscala(): Promise<ConferenteApi> {
    const { nome, email } = FIXOS.conferenteForaDaEscala
    let conferente = (await this.ler<ConferenteApi[]>('administrador', '/conferentes')).find(
      (c) => c.email.toLowerCase() === email,
    )
    if (!conferente) {
      await this.chamar('administrador', 'POST', '/conferentes', {
        nome,
        email,
        senha: SENHA_PADRAO,
        nivel: 'Pleno',
        jornadaHoras: 8,
      })
      conferente = await this.conferente(email)
    }
    if (conferente.naEscala) {
      await this.chamar('distribuidora', 'POST', `/conferentes/${conferente.id}/presenca`, { presente: false })
    }
    return conferente
  }

  // ---------- Dados do teste (criados e apagados) ----------

  proximoNumero(): string {
    this.sequencia += 1
    return `${this.prefixo}-${this.sequencia}`
  }

  async regra(corpo: CorpoRegra, descricao: string): Promise<string> {
    const resposta = await this.chamar('administrador', 'POST', '/regras-alcada', {
      sujeitoNivel: null,
      sujeitoConferenteId: null,
      alvoEtapa: null,
      alvoTipoAtoId: null,
      alvoEhEquipe: false,
      alvoEquipeId: null,
      alvoTodosOsAtos: false,
      alvoGrupo: null,
      ...corpo,
    })
    const { regraId } = (await resposta.json()) as { regraId: string }
    this.aoLimpar(`regra "${descricao}"`, async () => {
      await this.chamar('administrador', 'DELETE', `/regras-alcada/${regraId}`)
    })
    return regraId
  }

  /**
   * "Permite todos os atos" na camada da pessoa — a de baixo da cascata, que sobrescreve as regras
   * de nível do banco local. Garante que a conta enxerga os protocolos do cenário no pool e que
   * o motor tem pelo menos um elegível (manda pro pool em vez de exceção).
   */
  async alcadaPlena(email: string): Promise<void> {
    const conferente = await this.conferente(email)
    await this.regra(
      { sujeitoConferenteId: conferente.id, permissao: 'Permite', alvoTodosOsAtos: true },
      `${email} confere todos os atos`,
    )
  }

  /** Reserva do tipo pro conferente fora da escala: bloqueia todo mundo na escala (checada antes da cascata). */
  async reservaSemNinguem(tipoAtoId: string): Promise<ConferenteApi> {
    const sujeito = await this.conferenteForaDaEscala()
    await this.regra(
      { sujeitoConferenteId: sujeito.id, permissao: 'Reserva', alvoTipoAtoId: tipoAtoId },
      `só ${sujeito.nome} confere o tipo ${tipoAtoId}`,
    )
    return sujeito
  }

  /**
   * Importa protocolos pelo mesmo endpoint da tela (POST /protocolos/importar/confirmar) — o
   * endpoint de distribuição avulsa saiu do back. Andamento 1h atrás e linha de corte 24h atrás:
   * a linha sempre passa pelo filtro de duplicata (RF-07). Número único por cenário, então não
   * existe histórico nem continuidade (ResolvedorDeContinuidade) no caminho.
   */
  async importar(linhas: LinhaDeProtocolo[], etapa: Etapa = 'PosConferencia'): Promise<ProtocoloCriado[]> {
    const agora = Date.now()
    const numeros = linhas.map(() => this.proximoNumero())
    const escreventePadrao = linhas.some((l) => !l.escrevente)
      ? (await this.escrevente(FIXOS.escreventeSemEquipe, null)).nome
      : ''
    const tipoPadrao = linhas.some((l) => !l.tipoAto) ? (await this.tipoAto(FIXOS.tipoAto)).nome : ''
    const resposta = await this.chamar('distribuidora', 'POST', '/protocolos/importar/confirmar', {
      etapa,
      linhaDeCorte: new Date(agora - 24 * 60 * 60 * 1000).toISOString(),
      linhas: linhas.map((linha, indice) => ({
        protocolo: numeros[indice],
        tipoAto: linha.tipoAto ?? tipoPadrao,
        escrevente: linha.escrevente ?? escreventePadrao,
        dataHoraAndamento: new Date(agora - 60 * 60 * 1000).toISOString(),
      })),
    })
    const { loteImportacaoId } = (await resposta.json()) as { loteImportacaoId: string }
    const visao = await this.ler<VisaoDistribuicao>(
      'distribuidora',
      `/protocolos/distribuicao?loteImportacaoId=${loteImportacaoId}`,
    )
    const porNumero = new Map(todosDaVisao(visao).map((p) => [p.numero, p]))
    return numeros.map((numero) => {
      const protocolo = porNumero.get(numero)
      if (!protocolo) throw new Error(`protocolo ${numero} não apareceu na visão depois de importado`)
      this.aoLimpar(`protocolo ${numero}`, async () => {
        await this.chamar('distribuidora', 'DELETE', `/protocolos/${protocolo.id}`)
      })
      return { id: protocolo.id, numero }
    })
  }

  /**
   * Pra protocolo que a própria tela cria (Importar): registra a limpeza pelo número antes da
   * ação, e na hora de limpar procura na visão inteira — funciona mesmo se o teste falhar no meio.
   */
  apagarAoFinal(numeros: string[]): void {
    this.aoLimpar(`protocolos criados pela tela (${numeros.join(', ')})`, async () => {
      const visao = await this.ler<VisaoDistribuicao>('distribuidora', '/protocolos/distribuicao')
      for (const protocolo of todosDaVisao(visao).filter((p) => numeros.includes(p.numero))) {
        await this.chamar('distribuidora', 'DELETE', `/protocolos/${protocolo.id}`)
      }
    })
  }

  async situacao(protocoloId: string): Promise<{ status: string; motivoExcecao: string | null }> {
    return this.ler('distribuidora', `/protocolos/${protocoloId}/detalhe`)
  }

  async atribuir(protocoloId: string, email: string): Promise<void> {
    const conferente = await this.conferente(email)
    await this.chamar('distribuidora', 'POST', `/protocolos/${protocoloId}/atribuir`, { conferenteId: conferente.id })
  }

  async definirPrioridade(protocoloId: string, prioridade: Prioridade): Promise<void> {
    await this.chamar('distribuidora', 'POST', `/protocolos/${protocoloId}/definir-prioridade`, { prioridade })
  }

  async iniciar(protocoloId: string, conta: Conta): Promise<void> {
    await this.chamar(conta, 'POST', `/minha-fila/${protocoloId}/iniciar`)
  }

  async concluir(protocoloId: string, conta: Conta, aprovado = true): Promise<void> {
    await this.chamar(conta, 'POST', `/minha-fila/${protocoloId}/concluir`, { aprovado })
  }

  /**
   * Esvazia a fila de uma conta seed de conferente: o limite de 1 ato simultâneo (RF-21) bloqueia
   * "iniciar" se sobrou algo em conferência, e atribuído de outra rodada polui as colunas.
   */
  async esvaziarFila(conta: 'conferenteRf27' | 'conferenteVisual'): Promise<void> {
    const conferente = await this.conferente(CONTAS[conta])
    const fila = await this.ler<{ atribuidos: ProtocoloResumo[]; emConferencia: ProtocoloResumo[] }>(
      'distribuidora',
      `/conferentes/${conferente.id}/fila`,
    )
    for (const protocolo of fila.emConferencia) await this.concluir(protocolo.id, conta)
    for (const protocolo of fila.atribuidos) {
      await this.chamar('distribuidora', 'POST', `/protocolos/${protocolo.id}/devolver-ao-pool`)
    }
  }

  async gerarSugestoes(): Promise<void> {
    await this.chamar('administrador', 'POST', '/sugestoes/gerar')
  }

  async sugestoesPendentes(): Promise<SugestaoApi[]> {
    return this.ler('administrador', '/sugestoes')
  }

  /**
   * Garante ao menos uma sugestão pendente no Aprendizado. Se não houver, provoca a de "escrevente
   * órfão" (GeradorDeSugestoes.EscreventeOrfao: ≥ 3 protocolos de um escrevente sem equipe, no mesmo
   * lote de alguém com equipe) e gera.
   *
   * A sugestão fica **pendente de propósito** — é dado fixo, não do teste. A chave dela é o id do
   * escrevente fixo, e descartar liga a memória de descarte do back (`DiasDeMemoriaDescarte`): a
   * próxima rodada não conseguiria gerar outra. Os protocolos usados pra provocá-la saem na limpeza
   * normal; a sugestão continua pendente e é reaproveitada depois.
   */
  async garantirSugestaoPendente(): Promise<void> {
    if ((await this.sugestoesPendentes()).some((s) => s.status === 'Pendente')) return

    const { comEquipe, semEquipe } = await this.escreventes()
    await this.importar([
      { escrevente: semEquipe },
      { escrevente: semEquipe },
      { escrevente: semEquipe },
      { escrevente: comEquipe },
    ])
    await this.gerarSugestoes()
    if (!(await this.sugestoesPendentes()).some((s) => s.status === 'Pendente')) {
      throw new Error(
        'nenhuma sugestão pendente depois de gerar — a de escrevente órfão de ' +
          `"${semEquipe}" provavelmente foi descartada ou aplicada à mão (memória do back)`,
      )
    }
  }
}

async function exigirOk(resposta: APIResponse, contexto: string): Promise<void> {
  if (resposta.ok()) return
  const corpo = await resposta.text().catch(() => '')
  throw new Error(`${contexto} devolveu ${resposta.status()} ${corpo}`.trim())
}

/**
 * `test` com a fixture `cenario`: quem declara `{ cenario }` ganha um cenário limpo de sobras,
 * e tudo o que ele criar é desfeito depois do teste — passando ou falhando.
 */
export const test = base.extend<{ cenario: Cenario }>({
  cenario: async ({ playwright }, entregar) => {
    const api = await playwright.request.newContext({ baseURL: API_URL })
    const cenario = new Cenario(api)
    await cenario.varrerSobras()
    try {
      await entregar(cenario)
    } finally {
      try {
        await cenario.limpar()
      } finally {
        await api.dispose()
      }
    }
  },
})

/** Login pela tela, como a pessoa faz — sem token injetado (ADR-0020). */
export async function entrar(page: Page, conta: Conta): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(CONTAS[conta])
  await page.getByLabel('Senha', { exact: true }).fill(SENHA_PADRAO)
  await page.getByRole('button', { name: 'Entrar' }).click()
  // RF-03: todo papel cai no Dashboard depois de logar.
  await expect(page).toHaveURL(/\/dashboard/)
}

/**
 * Screenshot da página inteira sem `fullPage: true`. O `fullPage` desta versão do Playwright
 * redimensiona a janela pra 1×1 por um instante (medido: o `matchMedia` do breakpoint dispara
 * `true 1x1` e depois `false 1280x720`), o que cruza os 760px (RNF-13) e faz o AppShell trocar de
 * árvore — a página remonta e perde aba, busca, Sheet e diálogo abertos. Aqui só a altura cresce
 * até caber tudo, com a mesma largura, e volta.
 */
export async function capturarPaginaInteira(page: Page, path: string): Promise<void> {
  const viewport = page.viewportSize()
  if (!viewport) throw new Error('página sem viewport')
  const altura = await page.evaluate(() => document.documentElement.scrollHeight)
  await page.setViewportSize({ width: viewport.width, height: Math.max(altura, viewport.height) })
  await page.screenshot({ path })
  await page.setViewportSize(viewport)
}

/** Troca o tema pro escuro no próximo carregamento (mesma chave que o store de tema persiste). */
export async function usarTemaEscuro(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('dispatch-tema', JSON.stringify({ state: { tema: 'dark' }, version: 0 }))
  })
}

export { expect }
