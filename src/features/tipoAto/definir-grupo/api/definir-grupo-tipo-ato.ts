import type { GrupoTipoAto } from '@/entities/tipoAto'
import { httpClient } from '@/shared/api/http-client'

export type DefinirGrupoTipoAtoRequest = {
  tipoAtoId: string
  grupo: GrupoTipoAto | null
}

// PUT /tipos-ato/{id}/grupo — classificação vista na Matriz da aba Alçada do protótipo v2.
export const definirGrupoTipoAto = async ({ tipoAtoId, grupo }: DefinirGrupoTipoAtoRequest): Promise<void> => {
  await httpClient.put(`/tipos-ato/${tipoAtoId}/grupo`, { grupo })
}
