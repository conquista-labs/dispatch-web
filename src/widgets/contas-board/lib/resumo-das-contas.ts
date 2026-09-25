import type { Conta } from '@/entities/conta'

// "3 ativas · 1 administrador" — o fim do subtítulo da tela, igual ao protótipo aprovado.
export const resumoDasContas = (contas: Conta[]) => {
  const ativas = contas.filter((c) => c.ativo)
  const administradores = ativas.filter((c) => c.papel === 'Administrador').length
  return `${ativas.length} ${ativas.length === 1 ? 'ativa' : 'ativas'} · ${administradores} ${
    administradores === 1 ? 'administrador' : 'administradores'
  }`
}
