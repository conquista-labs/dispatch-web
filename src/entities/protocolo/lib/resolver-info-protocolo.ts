import type { Equipe } from '@/entities/equipe'
import type { Escrevente } from '@/entities/escrevente'
import type { TipoAto } from '@/entities/tipoAto'

import type { InfoProtocolo, ProtocoloResumo } from '../model/types'

// RF-14: tipo de ato/escrevente/equipe do card — back manda só os ids (EscreventeId,
// TipoAtoId), o front resolve o nome cruzando com GET /escreventes, /equipes e /tipos-ato.
// Extraído depois de uma auditoria de qualidade achar essa mesma lógica (Maps + resolver)
// copiada quase idêntica em DistribuicaoBoard/MinhaFilaBoard/FilaDoConferenteBoard/
// PainelDetalheProtocolo — não é hook (não usa nenhum hook do React por dentro, só deriva de
// arrays já buscados pelo chamador), por isso mora em `lib/`, não em `model/`.
export const criarResolverInfoProtocolo = (
  escreventes: Escrevente[] | undefined,
  equipes: Equipe[] | undefined,
  tiposAto: TipoAto[] | undefined,
) => {
  const escreventePorId = new Map((escreventes ?? []).map((e) => [e.id, e]))
  const nomePorEquipeId = new Map((equipes ?? []).map((e) => [e.id, e.nome]))
  const nomePorTipoAtoId = new Map((tiposAto ?? []).map((t) => [t.id, t.nome]))

  const resolverInfo = (protocolo: ProtocoloResumo): InfoProtocolo => {
    const escrevente = escreventePorId.get(protocolo.escreventeId)
    return {
      tipoAtoNome: protocolo.tipoAtoId ? (nomePorTipoAtoId.get(protocolo.tipoAtoId) ?? null) : null,
      escreventeNome: escrevente?.nome ?? null,
      equipeId: escrevente?.equipeId ?? null,
      equipeNome: escrevente?.equipeId ? (nomePorEquipeId.get(escrevente.equipeId) ?? null) : null,
    }
  }

  return { resolverInfo, escreventePorId, nomePorEquipeId, nomePorTipoAtoId }
}
