import { httpClient } from '@/shared/api/http-client'

import type { PaginaDeTipoAtoComUso, TipoAtoComUso } from '../model/types'

export type ParametrosTiposAtoComUso = {
  busca?: string
  pagina?: number
  tamanhoPagina?: number
}

// GET /tipos-ato/com-uso — catálogo com volume e cobertura de alçada, pra tabela da aba
// Tipos de ato (RF-34a). Paginado no back — primeira paginação de verdade do sistema (pedido
// do dono ao ver o catálogo real crescer; até aqui todo o resto do app usa busca + rolagem
// contida no front, ver
// docs/decisions/0019-listas-longas-busca-no-cliente-paginacao-so-em-tipos-de-ato.md).
export const getTiposAtoComUso = async (
  params: ParametrosTiposAtoComUso,
): Promise<PaginaDeTipoAtoComUso<TipoAtoComUso>> => {
  const { data } = await httpClient.get<PaginaDeTipoAtoComUso<TipoAtoComUso>>('/tipos-ato/com-uso', { params })
  return data
}
