import { useState } from 'react'

import { NIVEL_LABEL, type Conferente, type Nivel } from '@/entities/conferente'
import type { Equipe } from '@/entities/equipe'
import { ETAPA_LABEL, type Etapa } from '@/entities/protocolo'
import type { PermissaoRegra } from '@/entities/regraAlcada'
import { GRUPO_LABEL, GRUPOS, type GrupoTipoAto, type TipoAto } from '@/entities/tipoAto'
import { useCriarRegraAlcada } from '@/features/regra-alcada/criar'

import { SEM_EQUIPE } from '../lib/sem-equipe'
import type { Camada } from '../ui/AbaAlcadaCamadas'

export type SujeitoTipo = 'nivel' | 'pessoa'
export type AlvoTipo = 'tipo' | 'etapa' | 'equipe' | 'todos' | 'grupo' | 'equipeEtapa'

// Motor v4 — separador do valor composto usado pelo alvo "equipe + etapa" (equipeId ?? SEM_EQUIPE
// e a etapa, colados numa string só pra caber no mecanismo de multi-seleção existente, que só
// aceita string[]). "::" não aparece em nenhum Guid nem em nenhum valor de Etapa.
const SEPARADOR_EQUIPE_ETAPA = '::'

type Builder = {
  sujeitoTipo: SujeitoTipo
  sujeitoNivel: Nivel
  sujeitoConferenteId: string
  permissao: PermissaoRegra
  alvoTipo: AlvoTipo
  alvoSelecionados: string[]
}

const builderVazio = (primeiroConferenteId: string): Builder => ({
  sujeitoTipo: 'nivel',
  sujeitoNivel: 'Junior',
  sujeitoConferenteId: primeiroConferenteId,
  permissao: 'Permite',
  alvoTipo: 'tipo',
  alvoSelecionados: [],
})

// Pré-seleção do construtor a partir dos botões "Nova regra de X" de cada camada (aba
// Camadas) — mesmo espírito do protótipo (cada camada tem seu próprio atalho de criação).
const builderParaCamada = (camada: Camada, primeiroConferenteId: string): Builder => ({
  ...builderVazio(primeiroConferenteId),
  sujeitoTipo: camada === 'nivel' ? 'nivel' : 'pessoa',
  alvoTipo: camada === 'equipe' ? 'equipe' : 'tipo',
})

type UseAlcadaBuilderParams = {
  conferentes: Conferente[]
  equipes: Equipe[]
  tiposAto: TipoAto[]
  nomePorConferenteId: Map<string, string>
  nomePorTipoAtoId: Map<string, string>
  nomePorEquipeId: Map<string, string>
}

// Extraído de AbaAlcada.tsx (achado numa auditoria de qualidade — o componente misturava
// fetch, estado do construtor de regra e a montagem do payload de criação, tudo numa função
// só, ~300 linhas). Estado + lógica derivada do construtor guiado (RF-32) — o card em si
// (JSX) fica em AlcadaBuilderCard.tsx.
export const useAlcadaBuilder = ({
  conferentes,
  equipes,
  tiposAto,
  nomePorConferenteId,
  nomePorTipoAtoId,
  nomePorEquipeId,
}: UseAlcadaBuilderParams) => {
  const criar = useCriarRegraAlcada()
  const [aberto, setAberto] = useState(false)
  const [builder, setBuilder] = useState<Builder>(builderVazio(''))

  const abrir = () => {
    setBuilder(builderVazio(conferentes[0]?.id ?? ''))
    setAberto(true)
  }

  const abrirParaCamada = (camada: Camada) => {
    setBuilder(builderParaCamada(camada, conferentes[0]?.id ?? ''))
    setAberto(true)
  }

  // Motor v4 — o alvo equipe+etapa só existe como Nega (ver CLAUDE.md do back, "Motor de
  // alçada v4": permitir isso entraria na lista fechada por dimensão, um efeito colateral
  // desproporcional pra uma exceção pontual). Travar a permissão aqui evita o usuário bater
  // no 400 do back sem entender por quê.
  const setAlvoTipo = (alvoTipo: AlvoTipo) =>
    setBuilder((atual) => ({
      ...atual,
      alvoTipo,
      alvoSelecionados: [],
      permissao: alvoTipo === 'equipeEtapa' ? 'Nega' : atual.permissao,
    }))

  const fechar = () => setAberto(false)

  const quemTexto =
    builder.sujeitoTipo === 'nivel'
      ? `Nível ${NIVEL_LABEL[builder.sujeitoNivel]}`
      : (nomePorConferenteId.get(builder.sujeitoConferenteId) ?? '…')

  const textoEquipeEtapa = (valor: string) => {
    const [equipeId, etapa] = valor.split(SEPARADOR_EQUIPE_ETAPA)
    const nomeEquipe =
      equipeId === SEM_EQUIPE ? 'de escreventes sem equipe' : `da equipe ${nomePorEquipeId.get(equipeId) ?? equipeId}`
    return `fazer ${ETAPA_LABEL[etapa as Etapa]} ${nomeEquipe}`
  }

  const alvoTexto =
    builder.alvoTipo === 'todos'
      ? 'conferir todos os atos'
      : builder.alvoSelecionados.length === 0
        ? '…'
        : builder.alvoTipo === 'etapa'
          ? `fazer ${builder.alvoSelecionados.map((e) => ETAPA_LABEL[e as Etapa]).join(' e ')}`
          : builder.alvoTipo === 'equipe'
            ? `conferir atos ${builder.alvoSelecionados.map((v) => (v === SEM_EQUIPE ? 'de escreventes sem equipe' : `da equipe ${nomePorEquipeId.get(v) ?? v}`)).join(' e ')}`
            : builder.alvoTipo === 'grupo'
              ? `conferir atos de ${builder.alvoSelecionados.map((g) => GRUPO_LABEL[g as GrupoTipoAto]).join(' e ')}`
              : builder.alvoTipo === 'equipeEtapa'
                ? builder.alvoSelecionados.map(textoEquipeEtapa).join(' e ')
                : `conferir ${builder.alvoSelecionados.map((id) => nomePorTipoAtoId.get(id) ?? id).join(', ')}`

  const podeCriar =
    (builder.alvoTipo === 'todos' || builder.alvoSelecionados.length > 0) &&
    (builder.sujeitoTipo === 'nivel' || builder.sujeitoConferenteId !== '')

  const handleCriarRegra = async () => {
    const sujeito =
      builder.sujeitoTipo === 'nivel'
        ? { sujeitoNivel: builder.sujeitoNivel }
        : { sujeitoConferenteId: builder.sujeitoConferenteId }

    if (builder.alvoTipo === 'todos') {
      await criar.mutateAsync({ ...sujeito, permissao: builder.permissao, alvoTodosOsAtos: true })
      setAberto(false)
      return
    }

    // Protótipo permite selecionar vários alvos numa tacada só; o back só aceita um alvo por
    // regra (RF-31: alvo é XOR etapa/tipo/equipe/grupo/todos) — cria uma regra por alvo
    // selecionado pra preservar a mesma UX sem inventar um conceito de "regra composta" que
    // não existe no domínio.
    await Promise.all(
      builder.alvoSelecionados.map((valor) => {
        if (builder.alvoTipo === 'equipeEtapa') {
          const [equipeId, etapa] = valor.split(SEPARADOR_EQUIPE_ETAPA)
          return criar.mutateAsync({
            ...sujeito,
            permissao: 'Nega',
            alvoEhEquipeEEtapa: true,
            alvoEquipeId: equipeId === SEM_EQUIPE ? null : equipeId,
            alvoEtapa: etapa as Etapa,
          })
        }

        return criar.mutateAsync({
          ...sujeito,
          permissao: builder.permissao,
          ...(builder.alvoTipo === 'etapa'
            ? { alvoEtapa: valor as Etapa }
            : builder.alvoTipo === 'equipe'
              ? { alvoEhEquipe: true, alvoEquipeId: valor === SEM_EQUIPE ? null : valor }
              : builder.alvoTipo === 'grupo'
                ? { alvoGrupo: valor as GrupoTipoAto }
                : { alvoTipoAtoId: valor }),
        })
      }),
    )
    setAberto(false)
  }

  const ETAPAS = ['PreConferencia', 'PosConferencia'] as const

  const alvoOpcoes =
    builder.alvoTipo === 'etapa'
      ? ETAPAS.map((e) => ({ valor: e, label: ETAPA_LABEL[e] }))
      : builder.alvoTipo === 'equipe'
        ? [...equipes.map((e) => ({ valor: e.id, label: e.nome })), { valor: SEM_EQUIPE, label: 'sem equipe' }]
        : builder.alvoTipo === 'grupo'
          ? GRUPOS.map((g) => ({ valor: g, label: GRUPO_LABEL[g] }))
          : builder.alvoTipo === 'equipeEtapa'
            ? [...equipes.map((e) => ({ id: e.id, nome: e.nome })), { id: SEM_EQUIPE, nome: 'sem equipe' }].flatMap(
                (e) =>
                  ETAPAS.map((etapa) => ({
                    valor: `${e.id}${SEPARADOR_EQUIPE_ETAPA}${etapa}`,
                    label: `${e.nome} · ${ETAPA_LABEL[etapa]}`,
                  })),
              )
            : builder.alvoTipo === 'todos'
              ? []
              : tiposAto.map((t) => ({ valor: t.id, label: t.nome }))

  return {
    aberto,
    builder,
    setBuilder,
    setAlvoTipo,
    abrir,
    abrirParaCamada,
    fechar,
    quemTexto,
    alvoTexto,
    podeCriar,
    alvoOpcoes,
    handleCriarRegra,
    criando: criar.isPending,
  }
}
