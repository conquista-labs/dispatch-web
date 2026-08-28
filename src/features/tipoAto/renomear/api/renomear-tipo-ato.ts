import { httpClient } from '@/shared/api/http-client'

export type RenomearTipoAtoRequest = {
  tipoAtoId: string
  nome: string
}

// PUT /tipos-ato/{id} (RF-34b) — renomear não migra protocolo/regra nenhum, os dois
// referenciam por Id. Nome sai normalizado pelo back de qualquer jeito.
export const renomearTipoAto = async ({ tipoAtoId, nome }: RenomearTipoAtoRequest): Promise<void> => {
  await httpClient.put(`/tipos-ato/${tipoAtoId}`, { nome })
}
