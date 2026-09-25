// Espelha Papel (Dispatch.Domain) e UsuarioResponse (Dispatch.Api) — RF-01/RF-02: o papel vem
// do cadastro, nunca é escolhido no login. O Administrador (§3 do documento v2) chega sempre
// junto com 'Distribuidora' nos papéis — o back soma as duas claims (dispatch-api ADR-0039),
// então tudo que já checava 'Distribuidora' como "é gestão" continua valendo pra ele.
export type Papel = 'Distribuidora' | 'Conferente' | 'Administrador'

// Pedido do dono: uma distribuidora que também confere pessoalmente (mesma conta, os dois
// papéis) — por isso `papeis` é uma lista, não um valor único. Back calcula isso a partir de
// Usuario.Papel + "existe um Conferente vinculado" (PapeisEfetivos, ver
// dispatch-api/docs/decisions/0028-uma-conta-com-dois-papeis.md).
export type Usuario = {
  id: string
  nome: string
  email: string
  papeis: Papel[]
  // RF-45: conta criada por outra pessoa entra com senha inicial e precisa trocar antes de usar
  // o sistema — enquanto isso o back só aceita /auth/me e /auth/trocar-senha (ADR-0040 do back).
  // Opcional porque a sessão persistida antes deste campo existir não o tem.
  trocarSenha?: boolean
}
