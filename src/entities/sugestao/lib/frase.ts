import { NIVEL_LABEL } from '@/entities/conferente'
import { ETAPA_LABEL, TIPO_PRAZO_LABEL } from '@/entities/protocolo'

import type { Sugestao } from '../model/types'

export type LookupsFraseSugestao = {
  nomeEquipe: (id: string) => string
  nomeEscrevente: (id: string) => string
  nomeTipoAto: (id: string) => string
}

// Título + evidência de cada card de sugestão (RF-39) — o back só manda os ids/enums e a
// evidência numérica (`Sugestao.Evidencia`), quem escreve a frase legível é o front (mesma
// decisão de RegraAlcada.fraseDaRegra). Um payload por tipo, ver Dispatch.Domain.Aprendizado.PayloadSugestao.
export const tituloDaSugestao = (sugestao: Sugestao, lookups: LookupsFraseSugestao): string => {
  switch (sugestao.tipo) {
    case 'TipoDesconhecido':
      return `Classificar "${sugestao.tipoDesconhecidoNomeTipo}" como tipo de ato`
    case 'PrazoIrreal':
      return `Ajustar prazo de ${ETAPA_LABEL[sugestao.prazoIrrealEtapa!]} da equipe ${lookups.nomeEquipe(sugestao.prazoIrrealEquipeId!)}`
    case 'EscreventeOrfao':
      return `Alocar ${lookups.nomeEscrevente(sugestao.escreventeOrfaoEscreventeId!)} na equipe ${lookups.nomeEquipe(sugestao.escreventeOrfaoEquipeSugeridaId!)}`
    case 'RiscoQualidade':
      return `Restringir ${lookups.nomeTipoAto(sugestao.riscoQualidadeTipoAtoId!)} pro nível ${NIVEL_LABEL[sugestao.riscoQualidadeNivelRestrito!]}`
  }
}

export const textoBaseDaSugestao = (sugestao: Sugestao): string => {
  switch (sugestao.tipo) {
    case 'TipoDesconhecido':
      return `Apareceu em ${sugestao.ocorrencias} protocolos, resolvido manualmente sobretudo pelo nível ${NIVEL_LABEL[sugestao.tipoDesconhecidoNivelSugerido!]}. Aplicar cadastra esse tipo no catálogo.`
    case 'PrazoIrreal':
      return `Mais de 60% dos protocolos dessa combinação estouram o prazo atual. Aplicar muda o prazo da equipe para ${TIPO_PRAZO_LABEL[sugestao.prazoIrrealPrazoSugerido!]}.`
    case 'EscreventeOrfao':
      return `Apareceu em ${sugestao.ocorrencias} protocolos sem equipe — a maioria dos colegas do mesmo lote está nessa equipe. Aplicar move o escrevente pra lá.`
    case 'RiscoQualidade':
      return `Mais de 50% das conferências desse tipo feitas por esse nível foram reprovadas. Aplicar cria uma regra de alçada negando esse nível para esse tipo.`
  }
}
