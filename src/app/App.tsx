import { useSessionStore } from '@/entities/usuario'
import { configureHttpClient } from '@/shared/api/http-client'
import { queryClient } from '@/shared/lib/query-client'

import { AppProviders } from './providers/app-providers'
import { Router } from './routing/router'

// Roda uma vez, no import do módulo — antes de qualquer request sair. `shared/api/http-client`
// não conhece Zustand nem `entities/usuario` diretamente (regra de dependência do FSD: shared
// é a camada mais de baixo); aqui em `app`, que pode importar de qualquer camada, é onde os
// dois se conectam. Mesma ideia do AuthProvider/adapter do financas-front, sem a interface.
configureHttpClient({
  getToken: () => useSessionStore.getState().token,
  onUnauthorized: () => {
    // queryClient.clear() aqui também — um 401 no meio da sessão (token expirou) não pode
    // deixar cache de "quem era" sobrevivendo pro próximo login, mesmo problema que o
    // LogoutButton/useLogin já cobrem pros dois caminhos normais.
    useSessionStore.getState().clearSession()
    queryClient.clear()
  },
})

export const App = () => (
  <AppProviders>
    <Router />
  </AppProviders>
)
