// Espelha TipoAtoResponse (Dispatch.Api/Endpoints/TipoAtoEndpoints.cs).
export type TipoAto = {
  id: string
  nome: string
  ativo: boolean
  grupo: GrupoTipoAto | null
}

// Categoria vista na Matriz da aba Alçada do protótipo v2 — sem tela de gestão de grupo lá
// (só leitura agrupada), então virou um seletor aqui mesmo, na aba Tipos de ato.
export type GrupoTipoAto = 'Transmissoes' | 'Sucessoes' | 'Familia' | 'Garantias' | 'Notariais'

// Espelha TipoAtoComUsoResponse — leitura agregada pra tabela da aba Tipos de ato (RF-34a).
export type TipoAtoComUso = {
  id: string
  nome: string
  ativo: boolean
  pesoComplexidade: number
  grupo: GrupoTipoAto | null
  volume: number
  conferentesComAlcada: number
}
