import { NIVEL_LABEL } from '@/entities/conferente'
import { ETAPA_LABEL } from '@/entities/protocolo'
import { fraseDaRegra, type LookupsFraseRegra, type RegraAlcada } from '@/entities/regraAlcada'

export type ItemVigor = { frase: string; detalhe: string }

const plural = (n: number, um: string, muitos: string) => `${n} ${n === 1 ? um : muitos}`

// A distribuidora lê regras que a administração definiu (RF-30a) — nunca "definida por você".
const detalheDeOrigem = (regra: RegraAlcada) =>
  regra.origem === 'Aprendida' ? 'aprendida pelo sistema' : 'definida pela administração'

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
  if (ehAdministrador) return itensAgrupadosPorSujeito(ativas, lookups)

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

  // Regras por pessoa: uma linha por pessoa com o resumo, como na visão do admin (protótipo v2) —
  // uma linha por regra repetia o nome da mesma pessoa várias vezes seguidas.
  const restantes = ativas.filter((r) => !r.regraBase && !ehEquipeEEtapaSemNivel(r))
  const porPessoa = new Map<string, RegraAlcada[]>()
  for (const regra of restantes.filter((r) => r.sujeitoConferenteId)) {
    porPessoa.set(regra.sujeitoConferenteId!, [...(porPessoa.get(regra.sujeitoConferenteId!) ?? []), regra])
  }
  ;[...porPessoa.entries()]
    .map(([id, grupo]) => ({ nome: lookups.nomeConferente(id), grupo }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .forEach(({ nome, grupo }) =>
      itens.push({ frase: `${nome}: ${resumoDasRegras(grupo, lookups)}`, detalhe: contagemDeRegras(grupo) }),
    )
  for (const regra of restantes.filter((r) => !r.sujeitoConferenteId)) {
    itens.push({ frase: fraseDaRegra(regra, lookups), detalhe: detalheDeOrigem(regra) })
  }

  return itens
}

const ORDEM_DOS_NIVEIS = ['Junior', 'Pleno', 'Senior'] as const

const contagemDeRegras = (grupo: RegraAlcada[]) =>
  `${plural(grupo.length, 'regra', 'regras')} · ${plural(
    grupo.reduce((soma, r) => soma + r.usos, 0),
    'aplicação',
    'aplicações',
  )}`

// "libera 5 tipos, 1 grupo · bloqueia pré-conferência" — o resumo do protótipo aprovado
// (`resumoRegras`) sobre o que as regras de um mesmo sujeito fazem juntas.
export const resumoDasRegras = (grupo: RegraAlcada[], lookups: LookupsFraseRegra): string => {
  const partes: string[] = []
  const reservas = grupo.filter((r) => r.permissao === 'Reserva')
  if (reservas.length > 0) {
    partes.push(`atende só ${reservas.map((r) => fraseDaRegra(r, lookups).replace(/^Só .+? confere /, '')).join(', ')}`)
  }
  for (const [permissao, verbo] of [
    ['Permite', 'libera'],
    ['Nega', 'bloqueia'],
  ] as const) {
    const lista = grupo.filter((r) => r.permissao === permissao)
    if (lista.length === 0) continue
    if (lista.some((r) => r.alvoTodosOsAtos)) {
      partes.push(`${verbo} todos os atos`)
      continue
    }
    const tipos = lista.filter((r) => r.alvoTipoAtoId).length
    const grupos = lista.filter((r) => r.alvoGrupo).length
    const equipes = lista.filter((r) => r.alvoEhEquipe && !r.alvoEhEquipeEEtapa).length
    const etapas = [
      ...new Set(lista.filter((r) => r.alvoEtapa && !r.alvoEhEquipeEEtapa).map((r) => ETAPA_LABEL[r.alvoEtapa!])),
    ]
    const alvos = [
      tipos && plural(tipos, 'tipo', 'tipos'),
      grupos && plural(grupos, 'grupo', 'grupos'),
      equipes && plural(equipes, 'equipe', 'equipes'),
      ...etapas,
    ].filter(Boolean)
    if (alvos.length > 0) partes.push(`${verbo} ${alvos.join(', ')}`)
  }
  return partes.join(' · ') || 'nenhuma regra ativa'
}

// Visão do admin (protótipo v2): uma linha por sujeito — níveis primeiro, depois pessoas por nome —
// com o resumo do que as regras dele fazem; os trios "equipe não faz etapa" (uma regra por nível no
// back, ADR-0024) viram uma linha por equipe+etapa. O detalhe regra a regra fica na aba Alçada.
const itensAgrupadosPorSujeito = (ativas: RegraAlcada[], lookups: LookupsFraseRegra): ItemVigor[] => {
  const itens: ItemVigor[] = []

  const porNivel = new Map<string, RegraAlcada[]>()
  const porPessoa = new Map<string, RegraAlcada[]>()
  const equipeEEtapa = new Map<string, RegraAlcada[]>()
  for (const regra of ativas) {
    if (regra.alvoEhEquipeEEtapa) {
      const chave = `${regra.alvoEquipeId ?? 'sem-equipe'}|${regra.alvoEtapa}`
      equipeEEtapa.set(chave, [...(equipeEEtapa.get(chave) ?? []), regra])
    } else if (regra.sujeitoNivel) {
      porNivel.set(regra.sujeitoNivel, [...(porNivel.get(regra.sujeitoNivel) ?? []), regra])
    } else if (regra.sujeitoConferenteId) {
      porPessoa.set(regra.sujeitoConferenteId, [...(porPessoa.get(regra.sujeitoConferenteId) ?? []), regra])
    }
  }

  for (const nivel of ORDEM_DOS_NIVEIS) {
    const grupo = porNivel.get(nivel)
    if (grupo) {
      itens.push({
        frase: `Analista ${NIVEL_LABEL[nivel]}: ${resumoDasRegras(grupo, lookups)}`,
        detalhe: contagemDeRegras(grupo),
      })
    }
  }
  ;[...porPessoa.entries()]
    .map(([id, grupo]) => ({ nome: lookups.nomeConferente(id), grupo }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .forEach(({ nome, grupo }) =>
      itens.push({ frase: `${nome}: ${resumoDasRegras(grupo, lookups)}`, detalhe: contagemDeRegras(grupo) }),
    )
  for (const grupo of equipeEEtapa.values()) {
    const [primeira] = grupo
    const etapa = ETAPA_LABEL[primeira.alvoEtapa!]
    itens.push({
      frase: primeira.alvoEquipeId
        ? `Equipe ${lookups.nomeEquipe(primeira.alvoEquipeId)} não faz ${etapa}`
        : `Escreventes sem equipe não fazem ${etapa}`,
      detalhe: contagemDeRegras(grupo),
    })
  }
  return itens
}

// Contagem do cabeçalho "Alçada — quem confere o quê" na visão do admin: "4 pessoas e níveis · 6 regras".
export const contagemDaAlcadaEmVigor = (regras: RegraAlcada[]) => {
  const ativas = regras.filter((r) => r.ativa && !r.alvoEhEquipeEEtapa)
  const sujeitos = new Set(ativas.map((r) => r.sujeitoNivel ?? r.sujeitoConferenteId))
  return `${plural(sujeitos.size, 'pessoa ou nível', 'pessoas e níveis')} · ${plural(
    regras.filter((r) => r.ativa).length,
    'regra',
    'regras',
  )}`
}
