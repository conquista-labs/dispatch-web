export type {
  AvaliacaoAlcada,
  CriarRegraAlcadaRequest,
  MotivoAlcada,
  OrigemRegra,
  PassoTrilha,
  PermissaoRegra,
  RegraAlcada,
  TestarAlcadaRequest,
  TestarAlcadaResponse,
} from './model/types'
export { REGRAS_ALCADA_QUERY_KEY, useRegrasAlcada } from './model/use-regras-alcada'
export { useTestarAlcada } from './model/use-testar-alcada'
export { MOTIVO_ALCADA_LABEL, ORIGEM_LABEL, PERMISSAO_LABEL } from './lib/rotulos'
export { fraseDaRegra } from './lib/frase'
export type { LookupsFraseRegra } from './lib/frase'
