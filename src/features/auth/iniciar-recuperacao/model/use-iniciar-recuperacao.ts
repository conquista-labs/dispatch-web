import { useMutation } from '@tanstack/react-query'

import { iniciarRecuperacao } from '../api/iniciar-recuperacao'

export const useIniciarRecuperacao = () => useMutation({ mutationFn: iniciarRecuperacao })
