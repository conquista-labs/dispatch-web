import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useSessionStore } from '@/entities/usuario'

import { login } from '../api/login'

export const useLogin = () => {
  const setSession = useSessionStore((state) => state.setSession)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      // Defesa extra além do LogoutButton: cobre logar direto sem ter clicado em "Sair" antes
      // (token expirado, por exemplo) — nenhum cache de um usuário anterior sobra pro novo.
      queryClient.clear()
      setSession(data.token, data.usuario)
    },
  })
}
