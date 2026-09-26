import { httpClient } from '@/shared/api/http-client'

import type { RelatorioConvertido } from '../model/types'

// POST /protocolos/importar/converter (multipart, campo "arquivo") — só lê e converte, não grava.
// O axios monta o Content-Type com o boundary sozinho quando recebe um FormData.
export const converterRelatorio = async (arquivo: File): Promise<RelatorioConvertido> => {
  const formulario = new FormData()
  formulario.append('arquivo', arquivo)
  const { data } = await httpClient.post<RelatorioConvertido>('/protocolos/importar/converter', formulario)
  return data
}
