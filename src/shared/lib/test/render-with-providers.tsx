import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'

// O `queryClient` de shared/lib/query-client.ts é o singleton do app — reaproveitá-lo em teste
// vazaria cache de um caso pro outro. Cada render de teste ganha um QueryClient próprio, com
// `retry: false` (teste não deve esperar 1 tentativa extra pra ver um erro que já é esperado).
const criarQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  })

// MemoryRouter entra porque componente com <Link>/useNavigate quebra fora de um Router —
// acontece em boa parte das telas deste app (LoginForm tem dois <Link>, por exemplo).
export const renderWithProviders = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  const queryClient = criarQueryClient()

  const Providers = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )

  return { queryClient, ...render(ui, { wrapper: Providers, ...options }) }
}
