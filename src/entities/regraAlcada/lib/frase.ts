import { NIVEL_LABEL } from '@/entities/conferente'
import { ETAPA_LABEL } from '@/entities/protocolo'

import { PERMISSAO_LABEL } from './rotulos'
import type { RegraAlcada } from '../model/types'

export type LookupsFraseRegra = {
  nomeConferente: (id: string) => string
  nomeTipoAto: (id: string) => string
}

// "Quem → pode/não pode → o quê" (RF-31/RF-32) — back manda o fato cru (XOR de ids/enums),
// o front monta a frase; não existe rótulo pronto vindo do servidor.
export const fraseDaRegra = (regra: RegraAlcada, lookups: LookupsFraseRegra): string => {
  const quem = regra.sujeitoNivel
    ? `Nível ${NIVEL_LABEL[regra.sujeitoNivel]}`
    : regra.sujeitoConferenteId
      ? lookups.nomeConferente(regra.sujeitoConferenteId)
      : '—'

  const alvo = regra.alvoEtapa
    ? `fazer ${ETAPA_LABEL[regra.alvoEtapa]}`
    : regra.alvoTipoAtoId
      ? `conferir ${lookups.nomeTipoAto(regra.alvoTipoAtoId)}`
      : '—'

  return `${quem} ${PERMISSAO_LABEL[regra.permissao]} ${alvo}`
}
