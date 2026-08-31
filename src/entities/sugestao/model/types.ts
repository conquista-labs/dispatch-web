import type { Nivel } from '@/entities/conferente'
import type { Etapa, TipoPrazo } from '@/entities/protocolo'

export type StatusSugestao = 'Pendente' | 'Aplicada' | 'Descartada'

// Nome da classe C# do payload (Dispatch.Domain.Aprendizado.PayloadSugestao) — cru, indica
// qual dos campos abaixo está preenchido. Mesmo padrão do resto do projeto: back manda o fato,
// front decide rótulo (RF-39).
export type TipoSugestao = 'TipoDesconhecido' | 'PrazoIrreal' | 'EscreventeOrfao' | 'RiscoQualidade'

// Espelha SugestaoResponse (Dispatch.Api/Endpoints/SugestaoEndpoints.cs) — um só payload
// preenchido por vez, conforme `tipo`.
export type Sugestao = {
  id: string
  tipo: TipoSugestao
  chave: string
  evidencia: string
  ocorrencias: number
  // RF-39: 0.0-1.0 — front multiplica por 100 pra mostrar "N% de confiança" + barra.
  indiceConfianca: number
  status: StatusSugestao
  criadaEm: string
  atualizadaEm: string
  decididaEm: string | null
  descartarAte: string | null
  tipoDesconhecidoNomeTipo: string | null
  tipoDesconhecidoNivelSugerido: Nivel | null
  prazoIrrealEquipeId: string | null
  prazoIrrealEtapa: Etapa | null
  prazoIrrealPrazoSugerido: TipoPrazo | null
  escreventeOrfaoEscreventeId: string | null
  escreventeOrfaoEquipeSugeridaId: string | null
  riscoQualidadeTipoAtoId: string | null
  riscoQualidadeNivelRestrito: Nivel | null
}
