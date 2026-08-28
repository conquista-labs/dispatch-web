import { httpClient } from '@/shared/api/http-client'

export type EditarPerfilRequest = {
  conferenteId: string
  nome: string
  email: string
}

// PUT /conferentes/{id}/perfil (RF-25) — nome/e-mail, separado de nível/jornada (agregado
// diferente no back: Usuario, não Conferente).
export const editarPerfil = async ({ conferenteId, nome, email }: EditarPerfilRequest): Promise<void> => {
  await httpClient.put(`/conferentes/${conferenteId}/perfil`, { nome, email })
}
