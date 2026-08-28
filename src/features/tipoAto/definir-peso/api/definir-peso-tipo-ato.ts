import { httpClient } from '@/shared/api/http-client'

export type DefinirPesoTipoAtoRequest = {
  tipoAtoId: string
  peso: number
}

// PUT /tipos-ato/{id}/peso (RF-34f) — alimenta o score do conferente (RF-46, Dashboard, ainda
// não construído).
export const definirPesoTipoAto = async ({ tipoAtoId, peso }: DefinirPesoTipoAtoRequest): Promise<void> => {
  await httpClient.put(`/tipos-ato/${tipoAtoId}/peso`, { peso })
}
