import { useMutation } from '@tanstack/react-query'

import { useSessionStore } from '@/entities/usuario'

import { login } from '../api/login'

export const useLogin = () => {
  const setSession = useSessionStore((state) => state.setSession)

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => setSession(data.token, data.usuario),
  })
}
