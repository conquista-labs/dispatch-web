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

type Builder = {
  sujeitoTipo: SujeitoTipo
  sujeitoNivel: Nivel
  sujeitoConferenteId: string
  permissao: PermissaoRegra
  alvoTipo: AlvoTipo
  alvoSelecionados: string[]
  // Motor v4 — o alvo "equipe não faz etapa" é 2 dimensões (equipe × etapa), não uma lista só
  // como os outros alvos. `alvoSelecionados` guarda as equipes (mesmo formato do alvo "equipe"
  // puro, reaproveitado); esta guarda as etapas escolhidas separadamente — dois seletores lado
  // a lado em vez de um só combinando as duas coisas num valor composto (achado pelo dono: o
  // select único de "equipe · etapa" cruzadas ficava longo e sem indicação de qual dimensão
  // cada opção representava).
  equipeEEtapaEtapas: Etapa[]
}

const builderVazio = (primeiroConferenteId: string): Builder => ({
  sujeitoTipo: 'nivel',
  sujeitoNivel: 'Junior',
  sujeitoConferenteId: primeiroConferenteId,
  permissao: 'Permite',
  alvoTipo: 'tipo',
  alvoSelecionados: [],
  equipeEEtapaEtapas: [],
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
  // no 400 do back sem entender por quê. Sujeito também trava em "por nível" — o desenho
  // original da feature é sempre "ninguém desse nível faz X da equipe Y" (a "equipe" aqui é a
  // do escrevente cujo ato está sendo conferido, não do sujeito da regra); combinar "por
  // pessoa" com esse alvo deixava a frase ambígua sobre de quem era a equipe (achado pelo
  // dono usando a tela: "a regra é por nível, por pessoa ou é por equipe?").
  const setAlvoTipo = (alvoTipo: AlvoTipo) =>
    setBuilder((atual) => ({
      ...atual,
      alvoTipo,
      alvoSelecionados: [],
      equipeEEtapaEtapas: [],
      permissao: alvoTipo === 'equipeEtapa' ? 'Nega' : atual.permissao,
      sujeitoTipo: alvoTipo === 'equipeEtapa' ? 'nivel' : atual.sujeitoTipo,
    }))

  const alternarEtapaEquipeEEtapa = (etapa: Etapa) =>
    setBuilder((atual) => ({
      ...atual,
      equipeEEtapaEtapas: atual.equipeEEtapaEtapas.includes(etapa)
        ? atual.equipeEEtapaEtapas.filter((e) => e !== etapa)
        : [...atual.equipeEEtapaEtapas, etapa],
    }))

  const fechar = () => setAberto(false)

  const quemTexto =
    builder.sujeitoTipo === 'nivel'
      ? `Nível ${NIVEL_LABEL[builder.sujeitoNivel]}`
      : (nomePorConferenteId.get(builder.sujeitoConferenteId) ?? '…')

  const nomeDaEquipe = (valor: string) =>
    valor === SEM_EQUIPE ? 'de escreventes sem equipe' : `da equipe ${nomePorEquipeId.get(valor) ?? valor}`

  // Motor v4 — combinações equipe×etapa (o back só aceita uma regra por combinação, RF-31),
  // reaproveitada tanto pelo preview (alvoTexto) quanto pela criação de verdade
  // (handleCriarRegra) pra não duplicar a mesma lógica de produto cartesiano duas vezes.
  const combosEquipeEEtapa = builder.alvoSelecionados.flatMap((equipeValor) =>
    builder.equipeEEtapaEtapas.map((etapa) => ({ equipeValor, etapa })),
  )

  const alvoTexto =
    builder.alvoTipo === 'todos'
      ? 'conferir todos os atos'
      : builder.alvoTipo === 'equipeEtapa'
        ? combosEquipeEEtapa.length === 0
          ? '…'
          : combosEquipeEEtapa
              .map(({ equipeValor, etapa }) => `fazer ${ETAPA_LABEL[etapa]} ${nomeDaEquipe(equipeValor)}`)
              .join(' e ')
        : builder.alvoSelecionados.length === 0
          ? '…'
          : builder.alvoTipo === 'etapa'
            ? `fazer ${builder.alvoSelecionados.map((e) => ETAPA_LABEL[e as Etapa]).join(' e ')}`
            : builder.alvoTipo === 'equipe'
              ? `conferir atos ${builder.alvoSelecionados.map(nomeDaEquipe).join(' e ')}`
              : builder.alvoTipo === 'grupo'
                ? `conferir atos de ${builder.alvoSelecionados.map((g) => GRUPO_LABEL[g as GrupoTipoAto]).join(' e ')}`
                : `conferir ${builder.alvoSelecionados.map((id) => nomePorTipoAtoId.get(id) ?? id).join(', ')}`

  const podeCriar =
    builder.alvoTipo === 'todos'
      ? true
      : builder.alvoTipo === 'equipeEtapa'
        ? combosEquipeEEtapa.length > 0
        : builder.alvoSelecionados.length > 0

  const podeCriarComSujeito = podeCriar && (builder.sujeitoTipo === 'nivel' || builder.sujeitoConferenteId !== '')

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

    if (builder.alvoTipo === 'equipeEtapa') {
      await Promise.all(
        combosEquipeEEtapa.map(({ equipeValor, etapa }) =>
          criar.mutateAsync({
            ...sujeito,
            permissao: 'Nega',
            alvoEhEquipeEEtapa: true,
            alvoEquipeId: equipeValor === SEM_EQUIPE ? null : equipeValor,
            alvoEtapa: etapa,
          }),
        ),
      )
      setAberto(false)
      return
    }

    // Protótipo permite selecionar vários alvos numa tacada só; o back só aceita um alvo por
    // regra (RF-31: alvo é XOR etapa/tipo/equipe/grupo/todos) — cria uma regra por alvo
    // selecionado pra preservar a mesma UX sem inventar um conceito de "regra composta" que
    // não existe no domínio.
    await Promise.all(
      builder.alvoSelecionados.map((valor) =>
        criar.mutateAsync({
          ...sujeito,
          permissao: builder.permissao,
          ...(builder.alvoTipo === 'etapa'
            ? { alvoEtapa: valor as Etapa }
            : builder.alvoTipo === 'equipe'
              ? { alvoEhEquipe: true, alvoEquipeId: valor === SEM_EQUIPE ? null : valor }
              : builder.alvoTipo === 'grupo'
                ? { alvoGrupo: valor as GrupoTipoAto }
                : { alvoTipoAtoId: valor }),
        }),
      ),
    )
    setAberto(false)
  }

  const ETAPAS = ['PreConferencia', 'PosConferencia'] as const
  const etapaOpcoes = ETAPAS.map((e) => ({ valor: e, label: ETAPA_LABEL[e] }))
  const equipeOpcoes = [
    ...equipes.map((e) => ({ valor: e.id, label: e.nome })),
    { valor: SEM_EQUIPE, label: 'sem equipe' },
  ]

  const alvoOpcoes =
    builder.alvoTipo === 'etapa'
      ? etapaOpcoes
      : builder.alvoTipo === 'equipe' || builder.alvoTipo === 'equipeEtapa'
        ? equipeOpcoes
        : builder.alvoTipo === 'grupo'
          ? GRUPOS.map((g) => ({ valor: g, label: GRUPO_LABEL[g] }))
          : builder.alvoTipo === 'todos'
            ? []
            : tiposAto.map((t) => ({ valor: t.id, label: t.nome }))

  return {
    aberto,
    builder,
    setBuilder,
    setAlvoTipo,
    alternarEtapaEquipeEEtapa,
    abrir,
    abrirParaCamada,
    fechar,
    quemTexto,
    alvoTexto,
    podeCriar: podeCriarComSujeito,
    alvoOpcoes,
    etapaOpcoes,
    handleCriarRegra,
    criando: criar.isPending,
  }
}
