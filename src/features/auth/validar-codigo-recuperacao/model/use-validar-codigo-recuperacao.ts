import { useMutation } from '@tanstack/react-query'

import { validarCodigoRecuperacao } from '../api/validar-codigo-recuperacao'

export const useValidarCodigoRecuperacao = () => useMutation({ mutationFn: validarCodigoRecuperacao })
