// Espelha Papel (Dispatch.Domain) e UsuarioResponse (Dispatch.Api) — RF-01/RF-02: o papel vem
// do cadastro, nunca é escolhido no login. Quando "Subscritor" existir no back, entra aqui
// como um valor novo da união, e mais nada nesta entidade muda.
export type Papel = 'Distribuidora' | 'Conferente'

// Pedido do dono: uma distribuidora que também confere pessoalmente (mesma conta, os dois
// papéis) — por isso `papeis` é uma lista, não um valor único. Back calcula isso a partir de
// Usuario.Papel + "existe um Conferente vinculado" (PapeisEfetivos, ver
// dispatch-api/docs/decisions/0028-uma-conta-com-dois-papeis.md).
export type Usuario = {
  id: string
  nome: string
  email: string
  papeis: Papel[]
}
