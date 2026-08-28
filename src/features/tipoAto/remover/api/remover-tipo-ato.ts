import { httpClient } from '@/shared/api/http-client'

// DELETE /tipos-ato/{id} (RF-34e) — exclusão de verdade, mas o back rejeita com 409 se o tipo
// estiver em uso (protocolo ou regra de alçada referenciando).
export const removerTipoAto = async (tipoAtoId: string): Promise<void> => {
  await httpClient.delete(`/tipos-ato/${tipoAtoId}`)
}
