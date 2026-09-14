import type { AtualizarConfiguracaoRequest } from '@/entities/configuracao'
import { httpClient } from '@/shared/api/http-client'

// PUT /config (seção 8) — substitui os 12 valores juntos, sem edição parcial.
export const atualizarConfiguracao = async (request: AtualizarConfiguracaoRequest): Promise<void> => {
  await httpClient.put('/config', request)
}
