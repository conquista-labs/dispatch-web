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
  kpis: KpisDashboard
  desempenho: DesempenhoConferente[]
  mediaDaCasa: DesempenhoConferente | null
  porTipoAto: DesempenhoTipoAto[]
  cumprimentoPrazoEquipe: CumprimentoPrazoEquipe[]
}
