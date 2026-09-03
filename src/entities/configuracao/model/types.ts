// Espelha ConfiguracaoResponse (ConfiguracaoEndpoints.cs) — seção 8 do documento de
// requisitos. Só leitura por enquanto (GET /config) — o PUT existe no back mas ainda não tem
// tela própria no front (decisão consciente, ver dispatch-api/CLAUDE.md).
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
}
