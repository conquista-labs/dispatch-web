import type { Nivel } from '@/entities/conferente'
import type { Etapa, TipoPrazo } from '@/entities/protocolo'

// RF-42: só as 3 opções fixas do protótipo aprovado — sem período custom.
export type PeriodoDashboard = 'Semana' | 'Mes' | 'Trimestre'

export type FaixaBonificacao = 'Integral' | 'Parcial' | 'Fora'

// ParcelasScoreResponse (Dispatch.Api/Endpoints/DashboardEndpoints.cs) — pontos já ponderados
// (sobre 40/30/20/10), não percentuais crus.
export type ParcelasScore = {
  volume: number
  prazo: number
  qualidade: number
  complexidade: number
}

// DesempenhoConferenteResponse — nome/nivel nulos quando é a linha "média da casa" (RF-45, sem
// identificar ninguém); faixa nula também na visão restrita do próprio conferente (RF-45, "sem
// faixa de bônus").
export type DesempenhoConferente = {
  conferenteId: string
  nome: string | null
  nivel: Nivel | null
  volume: number
  tempoMedio: string | null
  percentualNoPrazo: number
  percentualAprovado: number
  // Fatia 4 do Dashboard v2: das 1ªs conferências do período, a fração aprovada (null sem nenhuma).
  // Opcional porque a API anterior não manda — o front cai no `percentualAprovado`.
  percentualAprovadoNaPrimeira?: number | null
  complexidadeMedia: number
  // Fatia 6: tempo real ÷ referência dos tipos conferidos (1,00 = referência; menor = mais rápido) e
  // a referência média desses atos. Opcionais: a API anterior não manda (a tabela mostra T. médio).
  ritmo?: number | null
  tempoMedioReferencia?: string | null
  // null pra distribuidora (RF-43a): nível, score, faixa e parcelas só vêm pro Administrador
  // (dispatch-api ADR-0039). Na visão do conferente, o próprio score vem.
  score: number | null
  faixa: FaixaBonificacao | null
  parcelas: ParcelasScore | null
}

export type DesempenhoTipoAto = {
  tipoAtoId: string
  nome: string
  volume: number
  tempoMedio: string | null
  percentualReprovacao: number
}

export type PesosDoScore = { volume: number; prazo: number; qualidade: number; complexidade: number }

export type KpisDashboard = {
  atosConferidos: number
  percentualNoPrazo: number
  percentualAprovado: number
  percentualAprovadoNaPrimeira?: number | null
  tempoMedio: string | null
  ritmo?: number | null
}

// Visão restrita (RF-46b): o tempo do conferente em cada tipo contra a referência daquele tipo.
export type MeuTempoPorTipo = {
  tipoAtoId: string
  nome: string
  atos: number
  meuTempoMedio: string
  referenciaMinutos: number
}

// Série do gráfico "Conferidos por dia/semana" (RF-42c): um ponto por dia útil (Semana/Mês) ou por
// semana (Trimestre) do período inteiro — os que ainda não chegaram vêm com `futuro: true`.
export type PontoDaSerie = {
  inicio: string // data local, "2026-09-01"
  conferidos: number
  estourados: number
  futuro: boolean
}

export type SerieDashboard = {
  granularidade: 'Dia' | 'Semana'
  pontos: PontoDaSerie[]
}

// CumprimentoPrazoEquipeResponse — equipeId nulo = "sem equipe" (equipeNome já vem como "sem
// equipe" nesse caso, resolvido no back). RF-43: "cumprimento de prazo por equipe e etapa".
export type CumprimentoPrazoEquipe = {
  equipeId: string | null
  equipeNome: string
  etapa: Etapa
  prazo: TipoPrazo | null
  total: number
  percentualNoPrazo: number
}

// DashboardResponse — visão gestão: `desempenho` tem todo mundo, `mediaDaCasa` nulo. Visão
// conferente: `desempenho` tem só a própria linha, `mediaDaCasa` preenchido, `porTipoAto` e
// `cumprimentoPrazoEquipe` vazios (RF-45 não pede nenhum dos dois pro conferente).
export type Dashboard = {
  // Fatia 3 do Dashboard v2 (período por calendário): opcionais porque a API anterior não manda —
  // sem eles a variação e o gráfico simplesmente não aparecem.
  periodoInicio?: string
  periodoFim?: string
  kpisAnterior?: KpisDashboard | null
  serie?: SerieDashboard | null
  // Fatia 2: metas só na visão de gestão; pesos pra quem vê score (admin e o próprio conferente).
  metas?: { noPrazo: number; aprovadoNaPrimeira: number } | null
  pesos?: PesosDoScore | null
  meuTempoPorTipo?: MeuTempoPorTipo[] | null
  kpis: KpisDashboard
  desempenho: DesempenhoConferente[]
  mediaDaCasa: DesempenhoConferente | null
  porTipoAto: DesempenhoTipoAto[]
  cumprimentoPrazoEquipe: CumprimentoPrazoEquipe[]
}

// Espelha a resposta de GET /dashboard/hoje (RF-42a) — "Hoje, agora" pra gestão, "Seu dia" pro
// conferente. Os campos da outra visão vêm nulos. `gargalo.equipeId` nulo = escreventes sem equipe;
// o nome da equipe o front resolve (back manda o fato cru).
export type PainelDeHoje = {
  visao: 'Gestao' | 'Conferente'
  atualizadoEm: string
  conferidosHoje: number
  naFila: { pool: number; comConferente: number } | null
  naMao: { total: number; emConferencia: number } | null
  emRisco: { estourados: number; vencemEmUmaHora: number }
  excecoes: number | null
  gargalo: { equipeId: string | null; quantidade: number } | null
}
