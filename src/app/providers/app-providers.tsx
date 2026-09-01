import type { PropsWithChildren } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'

import { queryClient } from '@/shared/lib/query-client'
import { Toaster } from '@/shared/ui/sonner'

export const AppProviders = ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>
    {children}
    {/* RF-18j: toast de "desfazer" excluir protocolo — um Toaster só, na raiz. */}
    <Toaster />
  </QueryClientProvider>
)
