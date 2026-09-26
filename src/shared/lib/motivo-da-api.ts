import { isAxiosError } from 'axios'

// O `motivo` que a API devolve no corpo de erro (`{ codigo?, motivo }`, dispatch-api
// docs/patterns/endpoints.md) — texto já pronto pra pessoa. `undefined` quando não veio (rede,
// 500, formato diferente): quem chama decide o texto genérico.
export const motivoDaApi = (erro: unknown): string | undefined => {
  if (!isAxiosError(erro)) return undefined
  const dados = erro.response?.data as { motivo?: unknown } | undefined
  return typeof dados?.motivo === 'string' ? dados.motivo : undefined
}
