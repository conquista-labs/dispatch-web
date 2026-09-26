import type { AvaliacaoAlcada } from '@/entities/regraAlcada'
import type { GrupoTipoAto } from '@/entities/tipoAto'

// Espelha Dispatch.Domain (Etapa, StatusProtocolo, FaixaSemaforo) e os DTOs de resposta em
// Dispatch.Api/Endpoints/{Distribuicao,MinhaFila}Endpoints.cs — não inventar campo aqui sem
// conferir o C# primeiro (ver skill new-entity).
export type Etapa = 'PreConferencia' | 'PosConferencia'

export type StatusProtocolo =
  'Pool' | 'Atribuido' | 'Conferindo' | 'Aprovado' | 'Reprovado' | 'Excecao' | 'Descartado' | 'Excluido'

// RF-14/seção 5: as 4 faixas do semáforo de prazo.
export type FaixaSemaforo = 'Verde' | 'Amarelo' | 'Laranja' | 'Vermelho'

// TipoPrazo (Dispatch.Domain) — prazo bruto de uma Equipe, antes de virar vencimento.
// CorteDeHorario só existe transitoriamente num protocolo específico — nunca é o TipoPrazo
// base configurado numa Equipe (ver entities/equipe, corte de horário é um par de campos à
// parte, opcional por etapa).
export type TipoPrazo = 'UmaHora' | 'D0' | 'D1' | 'D2' | 'CorteDeHorario'

// "Normal" é o valor gravado no banco pro nível do meio (Dispatch.Domain.Prioridade não foi
// renomeado, pra não quebrar a leitura de protocolos já existentes) — o rótulo exibido
// ("Média") é só do front, ver PRIORIDADE_LABEL em lib/rotulos.ts.
export type Prioridade = 'Baixa' | 'Normal' | 'Alta'

// ProtocoloResumo (Api) — DateTimeOffset do C# chega como string ISO 8601 (axios não faz
// parse automático pra Date), TimeSpan chega como string "hh:mm:ss[.fffffff]".
export type ProtocoloResumo = {
  id: string
  numero: string
  tipoAtoId: string | null
  // Nome do tipo como veio no relatório — só quando o tipo é desconhecido (tipoAtoId null). Opcional
  // até a API nova subir em produção.
  tipoAtoNomeOriginal?: string | null
  // Null só na Minha fila do conferente, no pool e nas atribuídas: ele não vê de quem é o ato antes
  // de entrar em conferência (dispatch-api ADR-0046). Nas telas de gestão vem sempre.
  escreventeId: string | null
  etapa: Etapa
  prioridade: Prioridade
  status: StatusProtocolo
  donoId: string | null
  vencimentoEm: string | null
  motivoExcecao: string | null
  observacao: string | null
  semaforo: FaixaSemaforo | null
  // RF-21: só existe depois de IniciarConferencia — front calcula o cronômetro ao vivo com isso.
  iniciadoEm: string | null
  // Pausa (pedido do dono, "a pessoa sai pra almoçar") — não nulo enquanto pausado; troca o
  // cronômetro por "Pausado" + "Retomar" no card.
  pausadoEm: string | null
  // "N feitos hoje"/tempo de conferência (aba "Por status" → Concluídos) — só existem depois
  // de ConcluirConferencia, nulos em qualquer status antes disso.
  concluidoEm: string | null
  duracao: string | null
  // "Data de entrada" (RF-18f) — quando o ato chegou de verdade, sempre preenchido.
  andamentoEm: string
  // RF-24k: 1 = primeira conferência; 2+ = voltou depois de não aprovado ("↻ 2ª conferência").
  // Calculado no back na leitura (dispatch-api ADR-0038).
  numeroDaConferencia: number
}

// GrupoPorConferenteResponse (Api) — VisaoDistribuicaoResponse (RF-13). Não carrega nome do
// conferente (só o id); resolver via entities/conferente.
export type GrupoPorConferente = {
  conferenteId: string
  protocolos: ProtocoloResumo[]
}

// ConcluidosHojePorConferenteResponse (Api) — contagem de concluídos hoje por conferente,
// usada só pelo "N feitos hoje" do subtítulo do card (aba "Por conferente"). Diferente de
// `concluidos` abaixo (todo o histórico, usado pela aba "Por status") — quem não concluiu
// nada hoje simplesmente não aparece na lista.
export type ConcluidosHojePorConferente = {
  conferenteId: string
  total: number
}

export type VisaoDistribuicao = {
  pool: ProtocoloResumo[]
  atribuidos: ProtocoloResumo[]
  emConferencia: ProtocoloResumo[]
  concluidos: ProtocoloResumo[]
  excecoes: ProtocoloResumo[]
  porConferente: GrupoPorConferente[]
  concluidosHojePorConferente: ConcluidosHojePorConferente[]
}

// AlcadaConferenteResponse (Api) — "quem pode conferir este ato especificamente" (RF-18a).
// Motor v3: uma decisão só por candidato (não mais regraEtapaId/regraTipoId separados) — regraId
// nulo não significa "sem alçada" (pode ser padrão aberto), só `elegivel` decide isso; `motivo`
// e `trilha` só vêm preenchidos quando faz sentido explicar o "por quê" de um bloqueio. Mesmo
// formato de `AvaliacaoAlcada` (entities/regraAlcada), reaproveitado aqui pelo painel de
// detalhe do protocolo.
export type AlcadaConferente = AvaliacaoAlcada

// DetalheProtocoloResponse (Api) — painel de detalhe (RF-18a/b), aberto ao clicar em qualquer
// card de protocolo em Distribuição.
export type DetalheProtocolo = {
  id: string
  numero: string
  tipoAtoId: string | null
  tipoAtoNomeOriginal: string | null
  escreventeId: string
  etapa: Etapa
  prioridade: Prioridade
  andamentoEm: string
  prazo: TipoPrazo | null
  vencimentoEm: string | null
  status: StatusProtocolo
  donoId: string | null
  motivoExcecao: string | null
  observacao: string | null
  atribuidoEm: string | null
  iniciadoEm: string | null
  concluidoEm: string | null
  regraAplicadaId: string | null
  corrigidoEm: string | null
  reabertoEm: string | null
  pausadoEm: string | null
  semaforo: FaixaSemaforo | null
  alcada: AlcadaConferente[]
  historicoConferencias: HistoricoConferencia[]
  // Pedido do dono ("como garantir que ninguém abusa da pausa pra melhorar o tempo dela?") —
  // visibilidade, não bloqueio: quantas vezes e por quanto tempo este ato ficou pausado.
  pausas: PausaConferencia[]
  duracao: string | null
  // Pedido do dono ("como distribuidora e admin, quero editar o tempo de conferência de um
  // protocolo") — histórico de ajustes manuais já aplicados (RNF-02: quem, quando, valor
  // anterior/novo, motivo).
  ajustesDeDuracao: AjusteDeDuracao[]
  // RF-24k — mesmo campo de ProtocoloResumo.
  numeroDaConferencia: number
}

// PausaConferenciaResponse (Api) — uma pausa já encerrada (pausar/retomar, RF não numerado).
export type PausaConferencia = {
  pausadoEm: string
  retomadoEm: string
  duracao: string
}

// AjusteDeDuracaoResponse (Api) — um ajuste manual de duração já aplicado. Exceção ao padrão
// "back manda o fato cru, front resolve o nome": AjustadoPorId é sempre uma Distribuidora, não
// necessariamente alguém na lista de Conferentes que o front já carrega — sem GET /usuarios
// geral, o back resolve o nome e manda já pronto (`ajustadoPorNome`), não o id cru.
export type AjusteDeDuracao = {
  ajustadoPorNome: string
  ajustadoEm: string
  duracaoAnterior: string | null
  duracaoNova: string
  motivo: string | null
}

// HistoricoConferenciaResponse (Api) — continuidade de conferência: outras linhas com o mesmo
// Número (RF-07, Numero não é único de propósito, um item pode ter várias linhas ao longo do
// tempo). Não é RF numerado nem está no protótipo aprovado — pedido do dono, mesmo formato cru
// do back (front resolve nome do dono/rótulo de status, igual todo o resto do projeto).
export type HistoricoConferencia = {
  protocoloId: string
  andamentoEm: string
  status: StatusProtocolo
  donoId: string | null
  concluidoEm: string | null
  // RF-24k: nº da conferência desta linha e a observação dela — o "motivo da não aprovação" que
  // o painel mostra (decisão do dono: o "Não aprovar" não pede motivo à parte).
  numeroDaConferencia: number
  observacao: string | null
}

// Nomes resolvidos localmente a partir de ProtocoloResumo (que só traz EscreventeId/TipoAtoId
// crus) — cruzando com entities/escrevente, entities/equipe e entities/tipoAto. RF-14: a
// equipe é o único campo que distingue "sem equipe" (null) de "ainda não resolvido/carregando"
// — aqui ela já vem resolvida, então null significa mesmo "sem equipe".
export type InfoProtocolo = {
  tipoAtoNome: string | null
  escreventeNome: string | null
  // `equipeId` fica junto do nome (não só o nome) pra filtrar por equipe sem depender de nome
  // não colidir entre equipes diferentes (BarraDeFiltros usa o id, não o nome, como valor).
  equipeId: string | null
  equipeNome: string | null
}

// SimulacaoProtocoloManualResponse — prévia sem persistir (RF-18f), mostrada no modal "Novo
// protocolo"/"Editar protocolo" antes de confirmar.
export type SimulacaoProtocolo = {
  numeroDisponivel: boolean
  grupo: GrupoTipoAto | null
  equipeNome: string | null
  semEquipeSinalizado: boolean
  prazo: TipoPrazo
  vencimentoEm: string
  destino: 'Atribuido' | 'EnviadoParaPool' | 'Excecao'
  conferenteId: string | null
  motivo: string | null
}

// DistribuirProtocoloResponse (Api) — mesma resposta do endpoint avulso e de criar manual
// (RF-18f, POST /protocolos/manual).
export type ResultadoDistribuicaoProtocolo = {
  protocoloId: string
  resultado: 'Atribuido' | 'EnviadoParaPool' | 'Excecao'
  conferenteId: string | null
  motivo: string | null
  vencimentoEm: string | null
}

export type ProtocoloConcluidoResumo = {
  id: string
  numero: string
  tipoAtoId: string | null
  etapa: Etapa
  status: StatusProtocolo
  concluidoEm: string | null
  duracao: string | null
  // RF-24a/b — janela de correção (15min) e pedido de reabertura pendente, se houver.
  corrigidoEm: string | null
  pedidoReaberturaPendenteId: string | null
}
