import type { Conta } from '../model/types'

// Os mesmos códigos do 409 de POST /contas/{id}/desativar (RF-47). A regra é do back; aqui ela é
// lida da lista só pra abrir direto o aviso "Entendi" (como o protótipo aprovado), em vez de
// deixar a pessoa confirmar algo que vai ser recusado. Se a lista estiver velha, o 409 do back
// cai no mesmo texto.
export type TravaDeDesativacao = 'propria_conta' | 'ultimo_administrador' | 'propria_e_ultimo_administrador'

export const travaDeDesativacao = (conta: Conta, contas: Conta[]): TravaDeDesativacao | null => {
  const administradoresAtivos = contas.filter((c) => c.ativo && c.papel === 'Administrador').length
  const ultimoAdministrador = conta.papel === 'Administrador' && administradoresAtivos <= 1
  if (conta.ehVoce && ultimoAdministrador) return 'propria_e_ultimo_administrador'
  if (conta.ehVoce) return 'propria_conta'
  if (ultimoAdministrador) return 'ultimo_administrador'
  return null
}

const primeiroNome = (nome: string) => nome.split(' ')[0]

// Textos do protótipo aprovado (Dispatch v2, diálogo de desativar conta).
export const MOTIVO_DA_TRAVA: Record<TravaDeDesativacao, (conta: Conta) => string> = {
  propria_e_ultimo_administrador: () =>
    'Você é o último administrador ativo. Sem um administrador, ninguém mais consegue criar contas nem ver cargos e avaliação. Crie outra conta de administrador antes — e peça a ela para desativar a sua.',
  propria_conta: () => 'Você não pode desativar a sua própria conta. Peça a outro administrador.',
  ultimo_administrador: (conta) =>
    `${primeiroNome(conta.nome)} é o último administrador ativo. Sem um administrador, ninguém mais consegue criar contas nem ver cargos e avaliação.`,
}

export const ehTravaDeDesativacao = (codigo: unknown): codigo is TravaDeDesativacao =>
  typeof codigo === 'string' && codigo in MOTIVO_DA_TRAVA
