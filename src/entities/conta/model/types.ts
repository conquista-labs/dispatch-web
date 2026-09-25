// Espelha ContaResumo (dispatch-api, ListarContas) — RF-44. Só contas de gestão: conferente só
// confere e é cadastrado na tela Conferentes.
export type PapelDeConta = 'Distribuidora' | 'Administrador'

export type Conta = {
  id: string
  nome: string
  email: string
  papel: PapelDeConta
  ativo: boolean
  // A mesma pessoa tem um Conferente vinculado (dispatch-api ADR-0028).
  tambemConfere: boolean
  // É a conta de quem está logado — o back compara, o front não precisa guardar o id.
  ehVoce: boolean
}
