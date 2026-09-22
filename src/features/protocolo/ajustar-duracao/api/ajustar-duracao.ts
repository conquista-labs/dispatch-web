import { httpClient } from '@/shared/api/http-client'

export type AjustarDuracaoRequest = {
  protocoloId: string
  duracaoMinutos: number
  motivo: string | null
}

// POST /protocolos/{id}/ajustar-duracao — pedido do dono: distribuidora (admin) corrige o
// tempo final de conferência de um protocolo já concluído. Minutos, não TimeSpan cru (mesmo
// padrão já usado em Configuracao).
export const ajustarDuracao = async ({ protocoloId, duracaoMinutos, motivo }: AjustarDuracaoRequest): Promise<void> => {
  await httpClient.post(`/protocolos/${protocoloId}/ajustar-duracao`, { duracaoMinutos, motivo })
}
