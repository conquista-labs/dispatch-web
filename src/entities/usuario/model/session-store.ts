import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Usuario } from './types'

type SessionState = {
  token: string | null
  usuario: Usuario | null
  setSession: (token: string, usuario: Usuario) => void
  clearSession: () => void
}

// Persistido no localStorage pra sobreviver a um F5 — mas o token guardado aqui é só um
// ponto de partida otimista pro boot da aplicação. Quem confirma que ele ainda é válido de
// verdade é o GET /auth/me (ver entities/usuario/model/use-current-user.ts), nunca o valor
// decodificado do token — essa foi a decisão tomada com a API (ver CLAUDE.md do dispatch-api).
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      usuario: null,
      setSession: (token, usuario) => set({ token, usuario }),
      clearSession: () => set({ token: null, usuario: null }),
    }),
    { name: 'dispatch-session' },
  ),
)
