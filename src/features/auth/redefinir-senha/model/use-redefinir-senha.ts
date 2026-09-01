import { useMutation } from '@tanstack/react-query'

import { redefinirSenha } from '../api/redefinir-senha'

export const useRedefinirSenha = () => useMutation({ mutationFn: redefinirSenha })
