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
  CorteDeHorario: 'Corte de horário',
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

// RF-24k: "↻ 2ª conferência" (3ª, 4ª...) — protocolo que voltou depois de não aprovado. A 1ª não
// tem rótulo (null): a tag só existe a partir da 2ª. Três comprimentos porque o espaço varia —
// "curta" é pra coluna estreita de Distribuição → Por conferente, "media" pra lista completa.
export type VarianteNumeroConferencia = 'completa' | 'media' | 'curta'

export function rotuloNumeroConferencia(
  numero: number,
  variante: VarianteNumeroConferencia = 'completa',
): string | null {
  // `!(numero >= 2)` e não `numero < 2`: com o front publicado antes da API, o campo chega
  // `undefined` — e `undefined < 2` é falso, o que renderizaria "↻ undefinedª".
  if (!(numero >= 2)) return null
  const ordinal = `${numero}ª`
  if (variante === 'curta') return `↻ ${ordinal}`
  if (variante === 'media') return `↻ ${ordinal} conf.`
  return `↻ ${ordinal} conferência`
}
