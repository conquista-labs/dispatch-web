import { httpClient } from '@/shared/api/http-client'

export type AlterarStatusTipoAtoRequest = {
  tipoAtoId: string
  ativo: boolean
}

// POST /tipos-ato/{id}/ativar | /desativar (RF-34d) — desativar não apaga histórico, só barra
// protocolos futuros desse tipo (viram exceção com motivo "tipo desativado").
export const alterarStatusTipoAto = async ({ tipoAtoId, ativo }: AlterarStatusTipoAtoRequest): Promise<void> => {
  await httpClient.post(`/tipos-ato/${tipoAtoId}/${ativo ? 'ativar' : 'desativar'}`)
}
