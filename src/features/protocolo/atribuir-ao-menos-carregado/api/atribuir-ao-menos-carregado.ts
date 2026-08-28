import { httpClient } from '@/shared/api/http-client'

// POST /protocolos/{id}/atribuir-ao-menos-carregado (RF-18a) — atribui a quem tem alçada e
// está com menos carga agora; não exige exceção (diferente de atribuir-manualmente, RF-17).
export const atribuirAoMenosCarregado = async (protocoloId: string): Promise<void> => {
  await httpClient.post(`/protocolos/${protocoloId}/atribuir-ao-menos-carregado`)
}
