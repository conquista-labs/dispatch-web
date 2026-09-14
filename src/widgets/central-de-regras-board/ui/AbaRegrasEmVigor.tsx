import { useConferentes } from '@/entities/conferente'
import { useConfiguracao } from '@/entities/configuracao'
import { useEquipes } from '@/entities/equipe'
import { useEscreventes } from '@/entities/escrevente'
import { TIPO_PRAZO_LABEL } from '@/entities/protocolo'
import { fraseDaRegra, useRegrasAlcada } from '@/entities/regraAlcada'
import { useTiposAto } from '@/entities/tipoAto'
import { Button } from '@/shared/ui/button'
import { Carregando } from '@/shared/ui/carregando'
import { SurfaceCard } from '@/shared/ui/surface-card'

import { criarNomesDaCentralDeRegras } from '../lib/nomes'

type ItemVigor = { frase: string; detalhe: string }
type GrupoVigor = { nome: string; itens: ItemVigor[]; editarLabel?: string; onEditar?: () => void }

type AbaRegrasEmVigorProps = {
  onIrParaAlcada: () => void
  onIrParaTipos: () => void
  onIrParaPrazos: () => void
  onIrParaConfig: () => void
}

const plural = (n: number, um: string, muitos: string) => `${n} ${n === 1 ? um : muitos}`

// RF-30b-d — aba padrão da Central de Regras (mesmo default do protótipo): leitura agregada de
// tudo que o motor consulta hoje, na ordem em que consulta, agrupado por família. Nenhum
// endpoint novo — é só reler o que `useRegrasAlcada`/`useEquipes`/`useEscreventes`/`useTiposAto`
// já trazem pras outras abas, reaproveitando `fraseDaRegra` (mesma frase da aba Alçada).
//
// "Operação" mostra só o que de fato está implementado hoje (RF-30c): modo de distribuição
// (Híbrido — é o único que o motor sabe fazer, não existe toggle de configuração ainda), e o
// limite de simultâneos + faixas do semáforo, agora lidos de GET /config (tabela `config`,
// seção 8 — antes eram hardcoded, texto fixo aqui teria ficado desatualizado assim que alguém
// editasse via PUT /config). "Editar operação" agora navega pra aba Configuração de verdade
// (antes não tinha pra onde ir — a tela não existia).
export const AbaRegrasEmVigor = ({
  onIrParaAlcada,
  onIrParaTipos,
  onIrParaPrazos,
  onIrParaConfig,
}: AbaRegrasEmVigorProps) => {
  const { data: regras } = useRegrasAlcada()
  const { data: conferentes } = useConferentes()
  const { data: tiposAto } = useTiposAto()
  const { data: equipes } = useEquipes()
  const { data: escreventes } = useEscreventes()
  const { data: configuracao } = useConfiguracao()

  if (!regras || !conferentes || !tiposAto || !equipes || !escreventes || !configuracao) {
    return <Carregando className="mt-5" />
  }

  const { nomePorConferenteId, nomePorTipoAtoId, nomePorEquipeId } = criarNomesDaCentralDeRegras(
    conferentes,
    tiposAto,
    equipes,
  )

  const alcadaItens: ItemVigor[] = regras
    .filter((r) => r.ativa)
    .map((r) => ({
      frase: fraseDaRegra(r, {
        nomeConferente: (id) => nomePorConferenteId.get(id) ?? '—',
        nomeTipoAto: (id) => nomePorTipoAtoId.get(id) ?? '—',
        nomeEquipe: (id) => nomePorEquipeId.get(id) ?? '—',
      }),
      detalhe: r.origem === 'Manual' ? 'definida por você' : 'aprendida pelo sistema',
    }))

  const orfaos = escreventes.filter((e) => !e.equipeId)
  const prazoItens: ItemVigor[] = equipes
    .map((equipe) => {
      const doTime = escreventes.filter((e) => e.equipeId === equipe.id)
      return {
        frase: `Escreventes de ${equipe.nome}: pré-conferência em ${TIPO_PRAZO_LABEL[equipe.prazoPreConferencia]}, pós-conferência em ${TIPO_PRAZO_LABEL[equipe.prazoPosConferencia]}`,
        // RNF-10: nome completo — dois escreventes com o mesmo primeiro nome na mesma equipe
        // ficariam indistinguíveis nessa lista.
        detalhe: doTime.length
          ? `${plural(doTime.length, 'escrevente', 'escreventes')} · ${doTime.map((e) => e.nome).join(', ')}`
          : 'nenhum escrevente nesta equipe',
      }
    })
    .concat(
      orfaos.length > 0
        ? [
            {
              frase: 'Escrevente sem equipe: prazo padrão D+1',
              detalhe: `${plural(orfaos.length, 'escrevente', 'escreventes')} hoje sem equipe`,
            },
          ]
        : [],
    )

  const desativados = tiposAto.filter((t) => !t.ativo)
  const catalogoItens: ItemVigor[] = [
    {
      frase: `${tiposAto.length} tipos de ato reconhecidos — o que não estiver na lista vai para exceção`,
      detalhe: `${tiposAto.length - desativados.length} ativos · ${desativados.length} desativados`,
    },
    ...desativados.map((t) => ({
      frase: `"${t.nome}" está desativado: novos protocolos desse tipo vão para exceção`,
      detalhe: 'reative ou mescle em outro tipo',
    })),
  ]

  // 6 itens (era 3) — protótipo reexportado ampliou o resumo de Operação com mais 3 linhas que
  // já tinham dado (config lida de GET /config, mesmo padrão dos 3 originais): janela de
  // correção, tempo médio por ato (capacidade estimada) e memória do descarte de sugestões.
  const operacaoItens: ItemVigor[] = [
    { frase: 'Modo de distribuição: Híbrido', detalhe: 'urgentes recebem dono; o resto fica no pool' },
    {
      frase: `Cada conferente conduz ${plural(configuracao.limiteDeAtosSimultaneos, 'ato', 'atos')} por vez`,
      detalhe: 'iniciar outro exige concluir o(s) atual(is)',
    },
    {
      frase: `Semáforo: amarelo abaixo de ${configuracao.faixaAtencaoMinutos / 60}h, laranja abaixo de ${configuracao.faixaUrgenteMinutos}min`,
      detalhe: 'vermelho quando o vencimento passa',
    },
    {
      frase: `Correção de resultado pelo conferente: ${configuracao.janelaDeCorrecaoMinutos} min após concluir`,
      detalhe: 'depois disso, só reabertura autorizada pela distribuidora',
    },
    {
      frase: `Capacidade estimada usa ${configuracao.tempoMedioPorAtoMinutos} min por ato`,
      detalhe: 'base do número de atos que cabem no dia',
    },
    {
      frase: `Aprendizado: descarte lembrado por ${configuracao.diasDeMemoriaDescarte} dias`,
      detalhe: 'sugestão recusada não volta nesse período',
    },
  ]

  const grupos: GrupoVigor[] = [
    { nome: 'Alçada — quem confere o quê', itens: alcadaItens, editarLabel: 'Editar alçada', onEditar: onIrParaAlcada },
    {
      nome: 'Prazo — de onde vem o vencimento',
      itens: prazoItens,
      editarLabel: 'Editar prazos',
      onEditar: onIrParaPrazos,
    },
    { nome: 'Catálogo de atos', itens: catalogoItens, editarLabel: 'Editar tipos', onEditar: onIrParaTipos },
    { nome: 'Operação', itens: operacaoItens, editarLabel: 'Editar operação', onEditar: onIrParaConfig },
  ]

  return (
    <div className="max-w-[900px]">
      <h2 className="mt-5.5 mb-0 text-[15px] font-semibold tracking-[-0.01em]">Tudo o que o sistema aplica hoje</h2>
      <p className="mt-1.5 max-w-[72ch] text-[13px] text-pretty text-text-2">
        Todas as regras ativas, escritas em português, na ordem em que o motor as consulta. É esta lista que explica o
        destino de qualquer protocolo.
      </p>

      <div className="mt-4.5 flex flex-col gap-3.5">
        {grupos.map((grupo) => (
          <div key={grupo.nome}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <div className="flex min-w-0 items-baseline gap-2">
                <strong className="text-[13.5px] font-semibold">{grupo.nome}</strong>
                <span className="flex-none font-mono text-[11px] text-muted-foreground">{grupo.itens.length}</span>
              </div>
              {grupo.onEditar ? (
                <Button variant="outline" size="sm" onClick={grupo.onEditar} className="flex-none">
                  {grupo.editarLabel}
                </Button>
              ) : (
                <span className="flex-none text-[11.5px] text-muted-foreground">configuração do sistema</span>
              )}
            </div>
            <SurfaceCard className="p-0 px-3.5">
              {grupo.itens.map((item, indice) => (
                <div key={indice} className="border-t border-secondary py-2.25 first:border-t-0">
                  <div className="text-[13px] text-pretty text-text-5">{item.frase}</div>
                  <div className="mt-0.5 text-[11.5px] text-pretty text-muted-foreground">{item.detalhe}</div>
                </div>
              ))}
            </SurfaceCard>
          </div>
        ))}
      </div>
    </div>
  )
}
