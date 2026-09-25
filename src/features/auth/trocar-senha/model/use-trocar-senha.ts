import { useMutation, useQueryClient } from '@tanstack/react-query'

import { type Usuario, useSessionStore } from '@/entities/usuario'

import { trocarSenha } from '../api/trocar-senha'

export const useTrocarSenha = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: trocarSenha,
    onSuccess: ({ token }) => {
      const { usuario, setSession } = useSessionStore.getState()
      if (!usuario) return
      const atualizado: Usuario = { ...usuario, trocarSenha: false }
      // O SessionBoot regrava a sessão com o cache do /auth/me sempre que o token muda — sem
      // atualizar o cache junto, ele devolveria o `trocarSenha: true` antigo e prenderia a
      // pessoa na tela de troca.
      queryClient.setQueryData<Usuario>(['usuario-atual'], atualizado)
      setSession(token, atualizado)
    },
  })
}
