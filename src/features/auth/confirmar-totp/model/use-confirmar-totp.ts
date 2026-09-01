import { useMutation } from '@tanstack/react-query'

import { confirmarTotp } from '../api/confirmar-totp'

export const useConfirmarTotp = () => useMutation({ mutationFn: confirmarTotp })
