import { useState } from 'react'

import { useConferentes } from '@/entities/conferente'
import { useConfiguracao } from '@/entities/configuracao'
import { useEquipes } from '@/entities/equipe'
import { useEscreventes } from '@/entities/escrevente'
import { useRegrasAlcada } from '@/entities/regraAlcada'
import { useTiposAto } from '@/entities/tipoAto'
import { useEhAdministrador } from '@/entities/usuario'
import { Button } from '@/shared/ui/button'
import { Carregando } from '@/shared/ui/carregando'
import { Input } from '@/shared/ui/input'
import { SurfaceCard } from '@/shared/ui/surface-card'

import { contagemDaAlcadaEmVigor, itensDeAlcadaEmVigor, type ItemVigor } from '../lib/alcada-em-vigor'
import { contagemDoPrazoEmVigor, itensDePrazoEmVigor } from '../lib/prazo-em-vigor'
import { criarNomesDaCentralDeRegras } from '../lib/nomes'

type GrupoVigor = {
  nome: string
  itens: ItemVigor[]
  editarLabel?: string
  onEditar?: () => void
  /** Alçada já passou de ~95 itens em produção — tem busca própria (achado real do dono). */
  totalSemFiltro?: number
  // Contagem do cabeçalho no formato do protótipo ("4 pessoas e níveis · 6 regras").
  contagem: string
  /** Quantas linhas aparecem antes do "ver as outras N" (protótipo: 4; Operação não corta). */
  limite?: number
}

const LIMITE_POR_GRUPO = 4

// "4h", "1h", "60 min", "1h30" — mesmo formato do `dur()` do protótipo; "4.5h" não é jeito de ler hora.
const formatarMinutos = (minutos: number) => {
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto ? `${horas}h${String(resto).padStart(2, '0')}` : `${horas}h`
}

// Sem os `onIrPara*` (quem não é admin só lê — RF-30a), cada família mostra "só a administração
// edita" no lugar do botão.
type AbaRegrasEmVigorProps = {
  onIrParaAlcada?: () => void
  onIrParaTipos?: () => void
  onIrParaPrazos?: () => void
  onIrParaConfig?: () => void
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
  const ehAdministrador = useEhAdministrador()
  const [buscaAlcada, setBuscaAlcada] = useState('')
  const [abertos, setAbertos] = useState<Set<string>>(new Set())

  if (!regras || !conferentes || !tiposAto || !equipes || !escreventes || !configuracao) {
    return <Carregando />
  }

  const { nomePorConferenteId, nomePorTipoAtoId, nomePorEquipeId } = criarNomesDaCentralDeRegras(
    conferentes,
    tiposAto,
    equipes,
  )

  const alcadaItensTodos = itensDeAlcadaEmVigor(
    regras,
    {
      nomeConferente: (id) => nomePorConferenteId.get(id) ?? '—',
      nomeTipoAto: (id) => nomePorTipoAtoId.get(id) ?? '—',
      nomeEquipe: (id) => nomePorEquipeId.get(id) ?? '—',
    },
    ehAdministrador,
  )
  const qAlcada = buscaAlcada.trim().toLowerCase()
  const alcadaItens = qAlcada
    ? alcadaItensTodos.filter((item) => item.frase.toLowerCase().includes(qAlcada))
    : alcadaItensTodos

  const prazoItens = itensDePrazoEmVigor(equipes, escreventes)

  const desativados = tiposAto.filter((t) => !t.ativo)
  const catalogoItens: ItemVigor[] = [
    {
      frase: `${tiposAto.length} tipos de ato reconhecidos — o que não estiver na lista vai para exceção`,
      detalhe: `${tiposAto.length - desativados.length} ativos · ${desativados.length} desativados`,
    },
    ...desativados.map((t) => ({
      frase: `“${t.nome}” está desativado: novos protocolos desse tipo vão para exceção`,
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
      detalhe:
        configuracao.limiteDeAtosSimultaneos === 1
          ? 'iniciar outro exige concluir o atual'
          : 'iniciar outro exige concluir um dos atuais',
    },
    {
      frase: `Semáforo: amarelo abaixo de ${formatarMinutos(configuracao.faixaAtencaoMinutos)}, laranja abaixo de ${formatarMinutos(configuracao.faixaUrgenteMinutos)}`,
      detalhe: 'vermelho quando o vencimento passa',
    },
    {
      frase: `Correção de resultado pelo conferente: ${formatarMinutos(configuracao.janelaDeCorrecaoMinutos)} após concluir`,
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
    {
      nome: 'Alçada — quem confere o quê',
      itens: alcadaItens,
      editarLabel: 'Editar alçada',
      onEditar: onIrParaAlcada,
      totalSemFiltro: alcadaItensTodos.length,
      contagem: contagemDaAlcadaEmVigor(regras),
    },
    {
      nome: 'Prazo — de onde vem o vencimento',
      itens: prazoItens,
      contagem: contagemDoPrazoEmVigor(equipes, escreventes),
      editarLabel: 'Editar prazos',
      onEditar: onIrParaPrazos,
    },
    {
      nome: 'Catálogo de atos',
      itens: catalogoItens,
      contagem: plural(tiposAto.length, 'tipo de ato', 'tipos de ato'),
      editarLabel: 'Editar tipos',
      onEditar: onIrParaTipos,
    },
    {
      nome: 'Operação',
      itens: operacaoItens,
      contagem: plural(operacaoItens.length, 'parâmetro', 'parâmetros'),
      editarLabel: 'Editar operação',
      onEditar: onIrParaConfig,
      limite: Infinity,
    },
  ]

  const alternar = (nome: string) =>
    setAbertos((atual) => {
      const proximo = new Set(atual)
      if (proximo.has(nome)) proximo.delete(nome)
      else proximo.add(nome)
      return proximo
    })

  return (
    <div className="max-w-[900px]">
      {/* O cabeçalho da aba é só do admin (protótipo: `centralCompleta`) — a distribuidora já tem o
          título e a explicação da Central logo acima, e repetir os dois ficava redundante. */}
      {ehAdministrador && (
        <>
          <h2 className="m-0 text-xl font-semibold tracking-[-0.015em]">Tudo o que o sistema aplica hoje</h2>
          <p className="mt-1.5 max-w-[72ch] text-[13px] text-pretty text-text-2">
            O que o motor aplica hoje, escrito em português e na ordem em que ele consulta. Cada bloco mostra o
            essencial — abra para ver o resto, ou edite na aba correspondente.
          </p>
        </>
      )}

      <div className="mt-4.5 flex flex-col gap-3.5">
        {grupos.map((grupo) => {
          // Com busca, mostra tudo o que bate — cortar resultado de busca esconderia o que se procurou.
          const buscando = grupo.totalSemFiltro !== undefined && qAlcada !== ''
          const limite = grupo.limite ?? LIMITE_POR_GRUPO
          const aberto = abertos.has(grupo.nome) || buscando
          const visiveis = aberto ? grupo.itens : grupo.itens.slice(0, limite)
          const ocultos = grupo.itens.length - limite
          return (
            <div key={grupo.nome}>
              <div className="mb-1.75 flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <strong className="text-[13.5px] font-semibold">{grupo.nome}</strong>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {buscando ? `${grupo.itens.length} de ${grupo.totalSemFiltro}` : grupo.contagem}
                  </span>
                </div>
                {grupo.onEditar ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={grupo.onEditar}
                    className="h-6.5 flex-none px-2.5 text-[12px] text-text-2"
                  >
                    {grupo.editarLabel}
                  </Button>
                ) : (
                  <span className="flex-none text-[11.5px] text-muted-foreground">só a administração edita</span>
                )}
              </div>
              {grupo.totalSemFiltro !== undefined && (
                <Input
                  value={buscaAlcada}
                  onChange={(e) => setBuscaAlcada(e.target.value)}
                  placeholder={
                    ehAdministrador
                      ? 'buscar por nível, pessoa, tipo de ato, equipe…'
                      : 'buscar por pessoa, tipo de ato, equipe…'
                  }
                  className="mb-1.5"
                />
              )}
              {/* Protótipo v2: cada bloco mostra as 4 primeiras linhas e "ver as outras N" — no lugar da
                rolagem interna de 420px que a Alçada tinha (lista dentro de lista, achado do dono com
                ~95 regras em produção). */}
              <SurfaceCard className="p-0 px-3.5">
                {visiveis.map((item, indice) => (
                  <div key={indice} className="border-t border-secondary py-2.25 first:border-t-0">
                    <div className="text-[13px] text-pretty text-text-5">{item.frase}</div>
                    <div className="mt-0.5 text-[11.5px] text-pretty text-muted-foreground">{item.detalhe}</div>
                  </div>
                ))}
                {buscando && grupo.itens.length === 0 && (
                  <p className="py-2.25 text-[12.5px] text-muted-foreground">Nenhuma regra bate com a busca.</p>
                )}
                {!buscando && ocultos > 0 && (
                  <button
                    type="button"
                    onClick={() => alternar(grupo.nome)}
                    className="w-full border-t border-secondary py-2.25 text-left text-[12px] font-medium text-text-2 hover:text-foreground max-mobile:min-h-11"
                  >
                    {aberto ? 'mostrar menos' : `ver as outras ${ocultos}`}
                  </button>
                )}
              </SurfaceCard>
            </div>
          )
        })}
      </div>
    </div>
  )
}
