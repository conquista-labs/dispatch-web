import { ETAPA_LABEL } from '@/entities/protocolo'
import { fraseDaRegra, type LookupsFraseRegra, type RegraAlcada } from '@/entities/regraAlcada'

export type ItemVigor = { frase: string; detalhe: string }

const plural = (n: number, um: string, muitos: string) => `${n} ${n === 1 ? um : muitos}`

// "definida por você" só faz sentido pra quem cria regra; a distribuidora lê regras que a
// administração definiu (RF-30a).
const detalheDeOrigem = (regra: RegraAlcada, ehAdministrador: boolean) =>
  regra.origem === 'Aprendida'
    ? 'aprendida pelo sistema'
    : ehAdministrador
      ? 'definida por você'
      : 'definida pela administração'

// "Equipe não faz etapa" com o nível escondido — no back são 3 regras (uma por nível, ADR-0024),
// sem o nível ficariam 3 linhas idênticas.
const ehEquipeEEtapaSemNivel = (regra: RegraAlcada) =>
  regra.alvoEhEquipeEEtapa && regra.sujeitoNivel === null && regra.sujeitoConferenteId === null

// Regras ativas da alçada, em frase, pra aba "Regras em vigor". O admin vê uma linha por regra. Quem
// não é admin recebe as de nível sem o nível (RF-30a): as regras base viram uma linha só, e cada
// trio "equipe não faz etapa" vira uma linha por equipe+etapa.
export const itensDeAlcadaEmVigor = (
  regras: RegraAlcada[],
  lookups: LookupsFraseRegra,
  ehAdministrador: boolean,
): ItemVigor[] => {
  const ativas = regras.filter((r) => r.ativa)
  if (ehAdministrador)
    return ativas.map((r) => ({ frase: fraseDaRegra(r, lookups), detalhe: detalheDeOrigem(r, true) }))

  const itens: ItemVigor[] = []

  const base = ativas.filter((r) => r.regraBase)
  if (base.length > 0) {
    const aplicacoes = base.reduce((soma, r) => soma + r.usos, 0)
    itens.push({
      frase: 'Regra base da alçada: vale para todos, conforme o cadastro de cada pessoa',
      detalhe: `${plural(base.length, 'regra', 'regras')} · ${plural(aplicacoes, 'aplicação', 'aplicações')}`,
    })
  }

  const equipeEEtapa = new Map<string, RegraAlcada[]>()
  for (const regra of ativas.filter(ehEquipeEEtapaSemNivel)) {
    const chave = `${regra.alvoEquipeId ?? 'sem-equipe'}|${regra.alvoEtapa}`
    equipeEEtapa.set(chave, [...(equipeEEtapa.get(chave) ?? []), regra])
  }
  for (const grupo of equipeEEtapa.values()) {
    const [primeira] = grupo
    const etapa = ETAPA_LABEL[primeira.alvoEtapa!]
    itens.push({
      frase: primeira.alvoEquipeId
        ? `Equipe ${lookups.nomeEquipe(primeira.alvoEquipeId)} não faz ${etapa}`
        : `Escreventes sem equipe não fazem ${etapa}`,
      detalhe: plural(
        grupo.reduce((soma, r) => soma + r.usos, 0),
        'aplicação',
        'aplicações',
      ),
    })
  }

  for (const regra of ativas.filter((r) => !r.regraBase && !ehEquipeEEtapaSemNivel(r))) {
    itens.push({ frase: fraseDaRegra(regra, lookups), detalhe: detalheDeOrigem(regra, false) })
  }

  return itens
}
