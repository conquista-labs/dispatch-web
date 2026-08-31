import type { FaixaBonificacao, PeriodoDashboard } from '../model/types'

// Rótulos exatos do protótipo aprovado (Dispatch.dc.html, PERIODOS).
export const PERIODO_LABEL: Record<PeriodoDashboard, string> = {
  Semana: 'Esta semana',
  Mes: 'Este mês',
  Trimestre: 'Trimestre',
}

export const FAIXA_LABEL: Record<FaixaBonificacao, string> = {
  Integral: 'Bônus integral',
  Parcial: 'Bônus parcial',
  Fora: 'Fora do bônus',
}
