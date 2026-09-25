import { httpClient } from '@/shared/api/http-client'

// POST /contas/{id}/desativar (RF-46/RF-47) — 204 tira o acesso na hora (o token dela para de
// valer) e preserva o histórico; se a pessoa também confere, sai da escala e os atribuídos voltam
// ao pool. 409 com `codigo` quando uma trava impede (a própria conta, o último administrador).
export const desativarConta = async (contaId: string): Promise<void> => {
  await httpClient.post(`/contas/${contaId}/desativar`)
}
