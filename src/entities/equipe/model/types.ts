import type { TipoPrazo } from '@/entities/protocolo'

// Espelha EquipeResponse (Dispatch.Api/Endpoints/EquipeEndpoints.cs) — RF-35/RF-36.
export type Equipe = {
  id: string
  nome: string
  prazoPreConferencia: TipoPrazo
  prazoPosConferencia: TipoPrazo
}
