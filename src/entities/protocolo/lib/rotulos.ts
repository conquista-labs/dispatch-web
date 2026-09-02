import type { Etapa, FaixaSemaforo, Prioridade, TipoPrazo } from '../model/types'

// Back manda o fato cru (enum), front decide o rótulo em português — mesmo padrão de
// FaixaSemaforo (ver prazo-chip.ts). Usado onde quer que Etapa/TipoPrazo apareçam pra humano
// (Importar relatório RF-08, e futuramente Central de regras).
export const ETAPA_LABEL: Record<Etapa, string> = {
  PreConferencia: 'pré-conferência',
  PosConferencia: 'pós-conferência',
}

export const TIPO_PRAZO_LABEL: Record<TipoPrazo, string> = {
  UmaHora: '1 hora',
  D0: 'D+0',
  D1: 'D+1',
  D2: 'D+2',
}

// RF-18e/RF-24f: rótulo curto de cada faixa do semáforo, usado nas opções da barra de filtros
// (as legendas de cada tela já têm seu próprio texto mais longo, pra outro propósito).
export const FAIXA_SEMAFORO_LABEL: Record<FaixaSemaforo, string> = {
  Verde: 'no prazo',
  Amarelo: 'atenção',
  Laranja: 'crítico',
  Vermelho: 'vencido',
}

// Fiel ao protótipo (3 níveis: Alta/Média/Baixa) — "Normal" é só o nome do valor gravado no
// banco (ver Prioridade em model/types.ts), nunca mostrado assim pra um humano. "(urgente)" em
// Alta é uma clarificação deliberada, não literal do protótipo — mantida de uma revisão de
// fidelidade anterior.
export const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  Alta: 'Alta (urgente)',
  Normal: 'Média',
  Baixa: 'Baixa',
}
