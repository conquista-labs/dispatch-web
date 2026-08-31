import type { Etapa, StatusProtocolo } from '@/entities/protocolo'

// PedidoReaberturaResponse (Dispatch.Api/Endpoints/ProtocoloEndpoints.cs) — RF-24c.
export type PedidoReabertura = {
  pedidoId: string
  protocoloId: string
  protocoloNumero: string
  tipoAtoId: string | null
  etapa: Etapa
  statusAtual: StatusProtocolo
  solicitanteId: string
  nomeSolicitante: string
  criadoEm: string
}
