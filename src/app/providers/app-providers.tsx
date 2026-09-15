import type { PropsWithChildren } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'

import { queryClient } from '@/shared/lib/query-client'
import { Toaster } from '@/shared/ui/sonner'
import { TooltipProvider } from '@/shared/ui/tooltip'

export const AppProviders = ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>
    {/* delayDuration curto — é uma explicação de dado (RF-14), não um menu que precisa evitar
        abrir sem querer; o padrão do shadcn (0ms) ficaria abrindo à toa em qualquer passada de
        mouse, então 300ms (mesmo "sente antes de mostrar" de qualquer tooltip nativo do SO). */}
    <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
    {/* RF-18j: toast de "desfazer" excluir protocolo — um Toaster só, na raiz. */}
    <Toaster />
  </QueryClientProvider>
)
