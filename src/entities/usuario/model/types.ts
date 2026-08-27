// Espelha Papel (Dispatch.Domain) e UsuarioResponse (Dispatch.Api) — RF-01/RF-02: o papel vem
// do cadastro, nunca é escolhido no login. Quando "Subscritor" existir no back, entra aqui
// como um valor novo da união, e mais nada nesta entidade muda.
export type Papel = 'Distribuidora' | 'Conferente'

export type Usuario = {
  id: string
  nome: string
  email: string
  papel: Papel
}
