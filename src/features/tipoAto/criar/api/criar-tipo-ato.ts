import { httpClient } from '@/shared/api/http-client'

// POST /tipos-ato — cadastro manual (complementa o automático que a importação já faz; nome
// sai normalizado pelo back de qualquer jeito, não precisa normalizar aqui).
export const criarTipoAto = async (nome: string): Promise<{ tipoAtoId: string }> => {
  const { data } = await httpClient.post<{ tipoAtoId: string }>('/tipos-ato', { nome })
  return data
}
