// Espelha Dispatch.Domain (Etapa, StatusProtocolo, FaixaSemaforo) e os DTOs de resposta em
// Dispatch.Api/Endpoints/{Distribuicao,MinhaFila}Endpoints.cs — não inventar campo aqui sem
// conferir o C# primeiro (ver skill new-entity).
export type Etapa = 'PreConferencia' | 'PosConferencia'

export type StatusProtocolo = 'Pool' | 'Atribuido' | 'Conferindo' | 'Aprovado' | 'Reprovado' | 'Excecao' | 'Descartado'

// RF-14/seção 5: as 4 faixas do semáforo de prazo.
export type FaixaSemaforo = 'Verde' | 'Amarelo' | 'Laranja' | 'Vermelho'

// ProtocoloResumo (Api) — DateTimeOffset do C# chega como string ISO 8601 (axios não faz
// parse automático pra Date), TimeSpan chega como string "hh:mm:ss[.fffffff]".
export type ProtocoloResumo = {
  id: string
  numero: string
  tipoAtoId: string | null
  escreventeId: string
  etapa: Etapa
  status: StatusProtocolo
  donoId: string | null
  vencimentoEm: string | null
  motivoExcecao: string | null
  observacao: string | null
  semaforo: FaixaSemaforo | null
  // RF-21: só existe depois de IniciarConferencia — front calcula o cronômetro ao vivo com isso.
  iniciadoEm: string | null
}

// GrupoPorConferenteResponse (Api) — VisaoDistribuicaoResponse (RF-13). Não carrega nome do
// conferente (só o id); resolver via entities/conferente.
export type GrupoPorConferente = {
  conferenteId: string
  protocolos: ProtocoloResumo[]
}

export type VisaoDistribuicao = {
  pool: ProtocoloResumo[]
  atribuidos: ProtocoloResumo[]
  emConferencia: ProtocoloResumo[]
  concluidos: ProtocoloResumo[]
  excecoes: ProtocoloResumo[]
  porConferente: GrupoPorConferente[]
}

export type ProtocoloConcluidoResumo = {
  id: string
  numero: string
  tipoAtoId: string | null
  etapa: Etapa
  status: StatusProtocolo
  concluidoEm: string | null
  duracao: string | null
}
