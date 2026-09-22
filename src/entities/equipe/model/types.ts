import type { TipoPrazo } from '@/entities/protocolo'

// Espelha EquipeResponse (Dispatch.Api/Endpoints/EquipeEndpoints.cs) — RF-35/RF-36.
// Corte*HorarioCorte/HorarioVencimento (pedido do dono: "equipe X entra na etapa Y depois das
// 16h, vence às 10h do dia seguinte") — acréscimo opcional ao TipoPrazo normal de cada etapa,
// genérico por Equipe. `TimeOnly` do back chega como string "HH:mm:ss" (ISO); null nos dois de
// uma etapa = sem corte configurado ali.
export type Equipe = {
  id: string
  nome: string
  prazoPreConferencia: TipoPrazo
  prazoPosConferencia: TipoPrazo
  cortePreConferenciaHorarioCorte: string | null
  cortePreConferenciaHorarioVencimento: string | null
  cortePosConferenciaHorarioCorte: string | null
  cortePosConferenciaHorarioVencimento: string | null
}
