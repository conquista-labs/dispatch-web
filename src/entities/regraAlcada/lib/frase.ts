import { NIVEL_LABEL } from '@/entities/conferente'
import { ETAPA_LABEL } from '@/entities/protocolo'
import { GRUPO_LABEL } from '@/entities/tipoAto'

import { PERMISSAO_LABEL } from './rotulos'
import type { RegraAlcada } from '../model/types'

export type LookupsFraseRegra = {
  nomeConferente: (id: string) => string
  nomeTipoAto: (id: string) => string
  nomeEquipe: (id: string) => string
}

// "Quem → pode/não pode → o quê" (RF-31/RF-32) — back manda o fato cru (um entre cinco jeitos
// de alvo), o front monta a frase; não existe rótulo pronto vindo do servidor.
export const fraseDaRegra = (regra: RegraAlcada, lookups: LookupsFraseRegra): string => {
  const quem = regra.sujeitoNivel
    ? `Nível ${NIVEL_LABEL[regra.sujeitoNivel]}`
    : regra.sujeitoConferenteId
      ? lookups.nomeConferente(regra.sujeitoConferenteId)
      : '—'

  // Reserva usa um molde de frase próprio ("só X confere Y"), sem o verbo pode/não pode — mesmo
  // padrão do simulador do protótipo (Motor v3).
  if (regra.permissao === 'Reserva') {
    const objeto = regra.alvoEtapa
      ? ETAPA_LABEL[regra.alvoEtapa]
      : regra.alvoTipoAtoId
        ? lookups.nomeTipoAto(regra.alvoTipoAtoId)
        : regra.alvoEhEquipe
          ? `atos ${regra.alvoEquipeId ? `da equipe ${lookups.nomeEquipe(regra.alvoEquipeId)}` : 'de escreventes sem equipe'}`
          : regra.alvoGrupo
            ? `atos de ${GRUPO_LABEL[regra.alvoGrupo]}`
            : regra.alvoTodosOsAtos
              ? 'qualquer ato'
              : '—'

    return `Só ${quem} confere ${objeto}`
  }

  const alvo = regra.alvoEtapa
    ? `fazer ${ETAPA_LABEL[regra.alvoEtapa]}`
    : regra.alvoTipoAtoId
      ? `conferir ${lookups.nomeTipoAto(regra.alvoTipoAtoId)}`
      : regra.alvoEhEquipe
        ? `conferir atos ${regra.alvoEquipeId ? `da equipe ${lookups.nomeEquipe(regra.alvoEquipeId)}` : 'de escreventes sem equipe'}`
        : regra.alvoGrupo
          ? `conferir atos de ${GRUPO_LABEL[regra.alvoGrupo]}`
          : regra.alvoTodosOsAtos
            ? 'conferir todos os atos'
            : '—'

  return `${quem} ${PERMISSAO_LABEL[regra.permissao]} ${alvo}`
}
