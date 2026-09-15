import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Papel, Usuario } from './types'

type SessionState = {
  token: string | null
  usuario: Usuario | null
  setSession: (token: string, usuario: Usuario) => void
  clearSession: () => void
}

// Formato anterior a `papeis` virar lista (ver entities/usuario/model/types.ts) — sessão
// persistida no navegador de quem já estava logado antes desse deploy ainda tem `papel`
// (singular), não `papeis`. Sem migrar, `usuario.papeis.includes(...)` (AppShell, Dashboard,
// RequireRole) quebra com TypeError assim que a página carrega, antes até do GET /auth/me
// corrigir a sessão — achado em produção (conta real, sessão aberta desde antes do deploy).
type UsuarioPersistidoV0 = { id: string; nome: string; email: string; papel: Papel }

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
    {
      name: 'dispatch-session',
      version: 1,
      migrate: (persisted, versaoPersistida) => {
        const estado = persisted as { token: string | null; usuario: UsuarioPersistidoV0 | Usuario | null }
        if (versaoPersistida < 1 && estado.usuario && !('papeis' in estado.usuario) && 'papel' in estado.usuario) {
          const { id, nome, email, papel } = estado.usuario
          return { ...estado, usuario: { id, nome, email, papeis: [papel] } }
        }
        return estado
      },
    },
  ),
)
