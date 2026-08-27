import type { Etapa, FaixaSemaforo, TipoPrazo } from '@/entities/protocolo'

// Espelha ImportarLoteRequest/ResumoImportacao (Dispatch.Api/Endpoints/ImportacaoEndpoints.cs)
// — RF-05 a RF-12.
export type LinhaImportacao = {
  protocolo: string
  tipoAto: string
  escrevente: string
  dataHoraAndamento: string
}

export type ImportarLoteRequest = {
  etapa: Etapa
  linhaDeCorte: string
  linhas: LinhaImportacao[]
}

export type AtribuicaoPorConferente = {
  conferenteId: string
  quantidade: number
}

// RF-08: só na prévia — a confirmação devolve `linhas: null` (o back não carrega isso na
// resposta de gravar, ver CLAUDE.md do dispatch-api).
export type LinhaPreviaImportacao = {
  protocolo: string
  tipoAto: string
  tipoConhecido: boolean
  escrevente: string
  equipe: string | null
  prazo: TipoPrazo | null
  vencimentoEm: string | null
  semaforo: FaixaSemaforo | null
  jaExiste: boolean
  comAlcada: number
}

export type ResumoImportacao = {
  loteImportacaoId: string | null
  totalNoArquivo: number
  ignoradasPelaLinhaDeCorte: number
  processadas: number
  atribuidosPorConferente: AtribuicaoPorConferente[]
  enviadosParaPool: number
  excecoes: number
  tiposDesconhecidos: string[]
  escreventesSemEquipe: string[]
  linhas: LinhaPreviaImportacao[] | null
}
