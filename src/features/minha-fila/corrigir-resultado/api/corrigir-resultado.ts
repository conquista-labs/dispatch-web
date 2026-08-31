import { httpClient } from '@/shared/api/http-client'

// POST /minha-fila/{id}/corrigir-resultado (RF-24a) — troca aprovado↔reprovado, dentro da
// janela de 15 min. Sem body: o back sempre inverte o resultado atual.
export const corrigirResultado = async (protocoloId: string): Promise<void> => {
  await httpClient.post(`/minha-fila/${protocoloId}/corrigir-resultado`)
}
