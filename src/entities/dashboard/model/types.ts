import type { Nivel } from '@/entities/conferente'

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
  complexidadeMedia: number
  score: number
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

export type KpisDashboard = {
  atosConferidos: number
  percentualNoPrazo: number
  percentualAprovado: number
  tempoMedio: string | null
}

// DashboardResponse — visão gestão: `desempenho` tem todo mundo, `mediaDaCasa` nulo. Visão
// conferente: `desempenho` tem só a própria linha, `mediaDaCasa` preenchido, `porTipoAto` vazio.
export type Dashboard = {
  kpis: KpisDashboard
  desempenho: DesempenhoConferente[]
  mediaDaCasa: DesempenhoConferente | null
  porTipoAto: DesempenhoTipoAto[]
}
