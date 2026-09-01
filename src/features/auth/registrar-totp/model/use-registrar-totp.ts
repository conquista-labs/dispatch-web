import { useMutation } from '@tanstack/react-query'

import { registrarTotp } from '../api/registrar-totp'

export const useRegistrarTotp = () => useMutation({ mutationFn: registrarTotp })
