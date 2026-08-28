import type { TipoSugestao } from '../model/types'

// Classe da proposta (badge no card) — mesmo padrão de "tag" usado em outras telas (ex.:
// tagDaExcecao em Distribuição): o back não manda rótulo pronto, só o nome cru da classe C#.
export const TIPO_SUGESTAO_LABEL: Record<TipoSugestao, string> = {
  TipoDesconhecido: 'tipo novo',
  PrazoIrreal: 'prazo',
  EscreventeOrfao: 'escrevente',
  RiscoQualidade: 'qualidade',
}
