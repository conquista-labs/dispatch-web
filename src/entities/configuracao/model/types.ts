// Espelha ConfiguracaoResponse (ConfiguracaoEndpoints.cs) — seção 8 do documento de requisitos.
export type Configuracao = {
  faixaAtencaoMinutos: number
  faixaUrgenteMinutos: number
  limiteDeAtosSimultaneos: number
  janelaDeCorrecaoMinutos: number
  diasDeMemoriaDescarte: number
  tempoMedioPorAtoMinutos: number
  limiarTipoDesconhecido: number
  limiarPrazoIrrealCasos: number
  limiarPrazoIrrealEstouro: number
  limiarEscreventeOrfao: number
  limiarRiscoQualidadeCasos: number
  limiarRiscoQualidadeReprovacao: number
  // Fatia 2 do Dashboard v2 — metas da gestão (frações 0–1) e pesos do score (inteiros que somam
  // 100). Opcionais porque a API anterior não manda: sem eles a seção "Metas e score" não aparece.
  metaNoPrazo?: number
  metaAprovadoNaPrimeira?: number
  pesoVolume?: number
  pesoPrazo?: number
  pesoQualidade?: number
  pesoComplexidade?: number
  // Regra do pool (decisão do dono, 2026-09-26): até quantos atos na mão (atribuídos + em
  // conferência) o conferente pode pegar do pool, e se ele pega na ordem da fila. Opcionais pela
  // mesma razão acima.
  limiteDeAtosNaMao?: number
  poolEmOrdemObrigatoria?: boolean
}

// Mesmo shape de Configuracao — os campos juntos, sem edição parcial (mesmo padrão de PUT
// já usado em Equipe/TipoAto). Tipo próprio (não um alias de Configuracao) só pra deixar
// explícito, no ponto de uso, que é o payload de escrita.
export type AtualizarConfiguracaoRequest = Configuracao
