// API pública da entidade — o resto do app importa só daqui, nunca de dentro de model/ ou api/
// direto (regra do FSD: slices só se falam pela barrel do nível de cima).
export type { Papel, Usuario } from './model/types'
export { useSessionStore } from './model/session-store'
export { useCurrentUser } from './model/use-current-user'
export { useEhAdministrador } from './model/use-eh-administrador'
export { roleHomeRoute } from './model/role-home-route'
export { avaliarRegrasSenha, type RegraSenha } from './lib/regras-senha'
export { CamposNovaSenha } from './ui/CamposNovaSenha'
export { SeloAdmin, SeloSoAdministracao } from './ui/selos-de-administracao'
export { gerarSenhaInicial, SENHA_INICIAL_MINIMA } from './lib/gerar-senha-inicial'
