import { useSessionStore } from './session-store'

// §3 do documento v2: cargo, avaliação, cadastro de pessoas, edição de regras e contas são só do
// Administrador. O servidor já corta o dado e barra a escrita (dispatch-api ADR-0039) — isto só
// decide que controle aparecer, pra ninguém ver um botão que devolveria 403.
export const useEhAdministrador = () =>
  useSessionStore((state) => state.usuario?.papeis.includes('Administrador') ?? false)
