// API pública da entidade — o resto do app importa só daqui, nunca de dentro de model/ ou api/
// direto (regra do FSD: slices só se falam pela barrel do nível de cima).
export type { Papel, Usuario } from './model/types'
export { useSessionStore } from './model/session-store'
export { useCurrentUser } from './model/use-current-user'
export { roleHomeRoute } from './model/role-home-route'
