import type { Equipe } from '@/entities/equipe'
import type { Escrevente } from '@/entities/escrevente'
import { TIPO_PRAZO_LABEL } from '@/entities/protocolo'

import type { ItemVigor } from './alcada-em-vigor'

const plural = (n: number, um: string, muitos: string) => `${n} ${n === 1 ? um : muitos}`
const NOMES_VISIVEIS = 4

// O mesmo prazo = mesmo tipo nas duas etapas e o mesmo corte de horário (ADR-0037 do back).
export const chaveDoPrazo = (e: Equipe) =>
  [
    e.prazoPreConferencia,
    e.prazoPosConferencia,
    e.cortePreConferenciaHorarioCorte,
    e.cortePreConferenciaHorarioVencimento,
    e.cortePosConferenciaHorarioCorte,
    e.cortePosConferenciaHorarioVencimento,
  ].join('|')

// "pré e pós-conferência em D+1" quando as duas etapas têm o mesmo prazo (protótipo v2).
export const fraseDoPrazo = (e: Equipe) =>
  e.prazoPreConferencia === e.prazoPosConferencia
    ? `pré e pós-conferência em ${TIPO_PRAZO_LABEL[e.prazoPreConferencia]}`
    : `pré-conferência em ${TIPO_PRAZO_LABEL[e.prazoPreConferencia]}, pós-conferência em ${TIPO_PRAZO_LABEL[e.prazoPosConferencia]}`

// "Equipe 5º andar" como no protótipo — sem repetir a palavra quando o nome já começa com ela
// ("Equipe RIO" não vira "Equipe Equipe RIO").
export const rotuloDaEquipe = (nome: string) => (/^equipe\b/i.test(nome) ? nome : `Equipe ${nome}`)

// Prazo nas "Regras em vigor" (protótipo v2): o prazo mais comum vira uma linha só ("10 equipes no
// prazo padrão: …", com os nomes), e só as equipes com prazo próprio aparecem uma a uma — com 30
// equipes a lista inteira escondia as poucas que fogem do padrão.
export const itensDePrazoEmVigor = (equipes: Equipe[], escreventes: Escrevente[]): ItemVigor[] => {
  const porChave = new Map<string, Equipe[]>()
  for (const equipe of equipes)
    porChave.set(chaveDoPrazo(equipe), [...(porChave.get(chaveDoPrazo(equipe)) ?? []), equipe])
  const padrao = [...porChave.values()].sort((a, b) => b.length - a.length)[0] ?? []
  const agrupar = padrao.length > 1

  const itens: ItemVigor[] = []
  if (agrupar) {
    const nomes = padrao.map((e) => e.nome)
    const visiveis = nomes.slice(0, NOMES_VISIVEIS).join(', ')
    const resto = nomes.length - NOMES_VISIVEIS
    itens.push({
      frase: `${plural(padrao.length, 'equipe', 'equipes')} no prazo padrão: ${fraseDoPrazo(padrao[0])}`,
      detalhe: resto > 0 ? `${visiveis} e mais ${resto}` : visiveis,
    })
  }

  for (const equipe of equipes) {
    if (agrupar && padrao.includes(equipe)) continue
    const doTime = escreventes.filter((e) => e.equipeId === equipe.id)
    itens.push({
      frase: `${rotuloDaEquipe(equipe.nome)}: ${fraseDoPrazo(equipe)}`,
      // RNF-10: nome completo — dois escreventes com o mesmo primeiro nome ficariam indistinguíveis.
      detalhe: doTime.length
        ? `${plural(doTime.length, 'escrevente', 'escreventes')} · ${doTime.map((e) => e.nome).join(', ')}`
        : 'nenhum escrevente nesta equipe',
    })
  }

  const orfaos = escreventes.filter((e) => !e.equipeId)
  if (orfaos.length > 0) {
    itens.push({
      frase: 'Escrevente sem equipe: prazo padrão D+1',
      detalhe: `${plural(orfaos.length, 'escrevente', 'escreventes')} hoje sem equipe`,
    })
  }
  return itens
}

export const contagemDoPrazoEmVigor = (equipes: Equipe[], escreventes: Escrevente[]) => {
  const orfaos = escreventes.filter((e) => !e.equipeId).length
  return `${plural(equipes.length, 'equipe', 'equipes')}${orfaos ? ` · ${orfaos} sem equipe` : ''}`
}

// Separa as equipes no prazo mais comum (só se mais de uma compartilha) das que têm prazo próprio —
// a aba Prazos por equipe recolhe as do padrão num card só (protótipo v2).
export const separarPorPrazoPadrao = (equipes: Equipe[]): { padrao: Equipe[]; proprias: Equipe[] } => {
  const porChave = new Map<string, Equipe[]>()
  for (const equipe of equipes)
    porChave.set(chaveDoPrazo(equipe), [...(porChave.get(chaveDoPrazo(equipe)) ?? []), equipe])
  const maior = [...porChave.values()].sort((a, b) => b.length - a.length)[0] ?? []
  if (maior.length < 2) return { padrao: [], proprias: equipes }
  return { padrao: maior, proprias: equipes.filter((e) => !maior.includes(e)) }
}
