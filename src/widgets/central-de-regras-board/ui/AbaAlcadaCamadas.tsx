import { useState } from 'react'

import { NIVEL_LABEL, rotuloAnalista, type AlcanceDoConferente, type Conferente } from '@/entities/conferente'
import { ETAPA_LABEL } from '@/entities/protocolo'
import { fraseDaRegra, type RegraAlcada } from '@/entities/regraAlcada'
import { useAlterarStatusRegraAlcada } from '@/features/regra-alcada/alterar-status'
import { useRemoverRegraAlcada } from '@/features/regra-alcada/remover'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { SurfaceCard } from '@/shared/ui/surface-card'

import { resumoDasRegras } from '../lib/alcada-em-vigor'

export type Camada = 'nivel' | 'equipe' | 'pessoa'

const CAMADA_INFO: Record<Camada, { nome: string; explica: string; novaLabel: string }> = {
  nivel: {
    nome: 'Base por nível',
    explica: 'vale para todo mundo daquele nível — é o que evita regra por pessoa',
    novaLabel: 'Nova regra de nível',
  },
  equipe: {
    nome: 'Ajuste por equipe',
    explica: 'restringe ou reserva uma equipe; sobrescreve a base',
    novaLabel: 'Nova regra de equipe',
  },
  pessoa: {
    nome: 'Exceção por pessoa',
    explica: 'só o que é genuinamente individual; sobrescreve tudo acima',
    novaLabel: 'Nova exceção',
  },
}

const CAMADAS: Camada[] = ['nivel', 'equipe', 'pessoa']

// Mesma classificação do back (ResolvedorAlcada.CamadaDe, Motor v3) — nível-sujeito é sempre
// "Base por nível"; pessoa-sujeito com alvo equipe é "Ajuste por equipe"; o resto de pessoa é
// "Exceção por pessoa". Puramente pra agrupar a leitura aqui, não decide alçada nenhuma.
const camadaDe = (regra: RegraAlcada): Camada =>
  regra.sujeitoNivel ? 'nivel' : regra.alvoEhEquipe || regra.alvoEhEquipeEEtapa ? 'equipe' : 'pessoa'

type AbaAlcadaCamadasProps = {
  regras: RegraAlcada[]
  conferentes: Conferente[]
  alcance: AlcanceDoConferente[]
  totalTipos: number
  nomePorConferenteId: Map<string, string>
  nomePorTipoAtoId: Map<string, string>
  nomePorEquipeId: Map<string, string>
  onAbrirBuilderParaCamada: (camada: Camada) => void
}

// Motor v3 — regras de alçada lidas em 3 camadas (a de baixo vence a de cima), mesma estrutura
// da aba "Camadas" do protótipo. Reaproveita o card de regra (frase/origem/ativar/remover) já
// existente, só reagrupado por camada em vez de lista única achatada.
export const AbaAlcadaCamadas = ({
  regras,
  conferentes,
  alcance,
  totalTipos,
  nomePorConferenteId,
  nomePorTipoAtoId,
  nomePorEquipeId,
  onAbrirBuilderParaCamada,
}: AbaAlcadaCamadasProps) => {
  const alterarStatus = useAlterarStatusRegraAlcada()
  const remover = useRemoverRegraAlcada()
  const alcancePorConferenteId = new Map(alcance.map((a) => [a.conferenteId, a]))

  // Achado com o dono: com uma regra por alvo selecionado no construtor (ver
  // docs/decisions/0010-divergencias-deliberadas-do-prototipo.md — o back só aceita um alvo
  // por regra), "Base por nível" facilmente passa de 80 linhas — sem
  // filtro/rolagem própria a tela inteira virava uma página só de scroll. `nomesDaFrase` reusa
  // o mesmo texto já montado pra exibir, não recalcula nada novo pra filtrar.
  const [busca, setBusca] = useState('')
  const nomesDaFrase = {
    nomeConferente: (id: string) => nomePorConferenteId.get(id) ?? '—',
    nomeTipoAto: (id: string) => nomePorTipoAtoId.get(id) ?? '—',
    nomeEquipe: (id: string) => nomePorEquipeId.get(id) ?? '—',
  }
  const q = busca.trim().toLowerCase()
  const passaNaBusca = (regra: RegraAlcada) => !q || fraseDaRegra(regra, nomesDaFrase).toLowerCase().includes(q)

  // Protótipo v2: quem está na escala e não alcança nenhum tipo aparece num alerta no topo — é o
  // efeito colateral mais caro de uma regra mal feita (a pessoa some da distribuição sem aviso).
  // Sem tipo nenhum OU sem etapa nenhuma dá no mesmo: a pessoa não recebe ato (protótipo conta os dois).
  const semAlcance = conferentes.filter((c) => {
    const a = alcancePorConferenteId.get(c.id)
    return (
      c.ativo && c.naEscala && ((a?.tiposPermitidosIds.length ?? 0) === 0 || (a?.etapasPermitidas.length ?? 0) === 0)
    )
  })

  return (
    <div>
      {semAlcance.length > 0 && (
        // Três níveis como no protótipo: o quê (título), quem (nomes numa linha própria) e o porquê
        // (explicação em cinza — tudo em vermelho gritava por igual e escondia os nomes).
        <div role="alert" className="mb-2.5 rounded-[10px] border border-bad-border bg-bad-bg px-3.75 py-3.25">
          <div className="text-[13.5px] font-semibold text-bad-fg">
            {semAlcance.length === 1
              ? '1 conferente não recebe nenhum ato'
              : `${semAlcance.length} conferentes não recebem nenhum ato`}
          </div>
          <div className="mt-0.75 text-[12.5px] font-medium text-bad-fg">
            {semAlcance.map((c) => c.nome).join(', ')}
          </div>
          <p className="mt-1.5 max-w-[76ch] text-[12px] leading-normal text-pretty text-text-3">
            As regras em vigor bloqueiam tudo para {semAlcance.length === 1 ? 'essa pessoa' : 'essas pessoas'}. Se não
            for afastamento, é erro de configuração — a fila {semAlcance.length === 1 ? 'dela' : 'delas'} fica vazia e a
            carga recai sobre os demais.
          </p>
        </div>
      )}

      {/* RNF-13 — no protótipo esta lista estoura a página inteira em telas estreitas; aqui, abaixo
          de 760px, cada linha empilha (nome e cargo / barra e quantidade / etapas) em vez de rolar
          de lado ou espremer a barra até sumir. */}
      <SurfaceCard className="px-4 py-3.5">
        <h3 className="m-0 text-[13.5px] font-semibold tracking-[-0.01em]">O que cada um alcança hoje</h3>
        <p className="mt-0.75 mb-2.5 max-w-[72ch] text-[11.5px] text-pretty text-muted-foreground">
          O resultado das regras abaixo. É por aqui que se confere se uma pessoa está com a alçada certa.
        </p>
        {conferentes.map((c) => {
          const a = alcancePorConferenteId.get(c.id)
          const qtd = a?.tiposPermitidosIds.length ?? 0
          // "pré e pós-conferência" cabe numa linha da coluna de 150px; por extenso, quebrava em duas.
          const etapasLabel =
            !a || a.etapasPermitidas.length === 0
              ? 'nenhuma etapa liberada'
              : a.etapasPermitidas.length === 2
                ? 'pré e pós-conferência'
                : ETAPA_LABEL[a.etapasPermitidas[0]]
          const largura = totalTipos > 0 ? Math.round((qtd / totalTipos) * 100) : 0
          return (
            <div
              key={c.id}
              className={cn(
                '-mx-2 flex items-center gap-3 rounded-[7px] px-2 py-1.75 max-mobile:flex-wrap max-mobile:gap-x-3 max-mobile:gap-y-1',
                !c.ativo && 'opacity-50',
                qtd === 0 && c.naEscala && 'bg-bad-bg',
              )}
            >
              <span className="w-[130px] flex-none text-[13px] text-pretty max-mobile:w-auto max-mobile:flex-1">
                {c.nome}
              </span>
              <span className="w-[110px] flex-none text-[11.5px] text-text-2 max-mobile:w-auto">
                {rotuloAnalista(c.nivel)}
              </span>
              <div className="h-2 min-w-16 flex-1 overflow-hidden rounded-full bg-secondary max-mobile:basis-[calc(100%-64px)]">
                <div
                  className={cn('h-2 rounded-full', qtd === 0 ? 'bg-bad-border-2' : 'bg-foreground')}
                  style={{ width: `${largura}%` }}
                />
              </div>
              <span
                className={cn(
                  'w-[52px] flex-none text-right font-mono text-[12.5px] font-medium',
                  qtd === 0 && 'text-bad-fg',
                )}
              >
                {qtd}/{totalTipos}
              </span>
              <span
                className={cn(
                  'w-[150px] flex-none text-right text-[11.5px] max-mobile:w-full max-mobile:text-left',
                  a && a.etapasPermitidas.length > 0 ? 'text-muted-foreground' : 'text-bad-fg',
                )}
              >
                {etapasLabel}
              </span>
            </div>
          )
        })}
      </SurfaceCard>

      <div className="mt-5.5 mb-1 flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 className="m-0 text-[13.5px] font-semibold">As regras que produzem isso</h3>
        <span className="text-[11.5px] text-muted-foreground">agrupadas por quem elas afetam</span>
      </div>
      <Input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="buscar por nível, pessoa, tipo de ato, equipe…"
        className="mb-2.5"
      />

      <div className="flex flex-col gap-2.5">
        {CAMADAS.map((camada) => {
          const todasDaCamada = regras.filter((r) => camadaDe(r) === camada)
          const regrasDaCamada = todasDaCamada.filter(passaNaBusca)
          const info = CAMADA_INFO[camada]
          const cobertas =
            camada === 'nivel'
              ? conferentes.filter((c) =>
                  todasDaCamada.some((r) => r.ativa && r.sujeitoNivel !== null && r.sujeitoNivel === c.nivel),
                ).length
              : null
          const resumo =
            camada === 'nivel'
              ? `${cobertas} de ${conferentes.length} pessoas cobertas`
              : `${todasDaCamada.filter((r) => r.ativa).length} ativa(s)`

          return (
            <div key={camada} className="overflow-hidden rounded-[10px] border border-border bg-card shadow-sm">
              <div className="flex items-start justify-between gap-3 border-b border-secondary bg-secondary px-3.75 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13.5px] font-semibold">{info.nome}</span>
                    <span className="rounded-full border border-border bg-card px-1.5 py-px font-mono text-[10.5px] text-text-2">
                      {resumo}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-pretty text-muted-foreground">{info.explica}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 flex-none px-2.5 text-[12px]"
                  onClick={() => onAbrirBuilderParaCamada(camada)}
                >
                  {info.novaLabel}
                </Button>
              </div>

              {/* Uma linha por sujeito, recolhida — as ~80 regras de "Base por nível" (achado do dono)
                  ficam dentro do grupo, então a camada não precisa mais de rolagem própria. */}
              <div className="flex flex-col">
                {agruparPorSujeito(regrasDaCamada, nomesDaFrase.nomeConferente).map((grupo) => (
                  <GrupoDeSujeito
                    key={grupo.chave}
                    rotulo={grupo.rotulo}
                    regras={grupo.regras}
                    abertoPorBusca={!!q}
                    nomesDaFrase={nomesDaFrase}
                    renderizarRegra={(regra) => (
                      <RegraCard
                        key={regra.id}
                        regra={regra}
                        frase={fraseDaRegra(regra, nomesDaFrase)}
                        onAlternar={() => alterarStatus.mutate({ regraId: regra.id, ativa: !regra.ativa })}
                        onRemover={() => remover.mutate(regra.id)}
                        ocupado={alterarStatus.isPending || remover.isPending}
                      />
                    )}
                  />
                ))}
                {regrasDaCamada.length === 0 && (
                  <div className="p-3.5 text-center text-[12px] text-muted-foreground">
                    {todasDaCamada.length === 0
                      ? 'nenhuma regra nesta camada — quem chegar aqui herda a camada de cima'
                      : 'nenhuma regra bate com a busca'}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type GrupoDeRegras = { chave: string; rotulo: string; regras: RegraAlcada[] }

const ORDEM_DOS_NIVEIS = ['Junior', 'Pleno', 'Senior'] as const

// Um grupo por sujeito (nível ou pessoa), níveis primeiro e depois pessoas por nome — como no
// protótipo v2 ("+ Analista Júnior — libera 5 tipos · bloqueia pré-conferência — 2 regras").
const agruparPorSujeito = (regras: RegraAlcada[], nomeConferente: (id: string) => string): GrupoDeRegras[] => {
  const porChave = new Map<string, RegraAlcada[]>()
  for (const regra of regras) {
    const chave = regra.sujeitoNivel ? `nivel:${regra.sujeitoNivel}` : `pessoa:${regra.sujeitoConferenteId}`
    porChave.set(chave, [...(porChave.get(chave) ?? []), regra])
  }
  const niveis = ORDEM_DOS_NIVEIS.filter((n) => porChave.has(`nivel:${n}`)).map((n) => ({
    chave: `nivel:${n}`,
    rotulo: `Analista ${NIVEL_LABEL[n]}`,
    regras: porChave.get(`nivel:${n}`)!,
  }))
  const pessoas = [...porChave.entries()]
    .filter(([chave]) => chave.startsWith('pessoa:'))
    .map(([chave, grupo]) => ({ chave, rotulo: nomeConferente(chave.slice('pessoa:'.length)), regras: grupo }))
    .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'))
  return [...niveis, ...pessoas]
}

type GrupoDeSujeitoProps = {
  rotulo: string
  regras: RegraAlcada[]
  abertoPorBusca: boolean
  nomesDaFrase: Parameters<typeof resumoDasRegras>[1]
  renderizarRegra: (regra: RegraAlcada) => React.ReactNode
}

// Linha plana do sujeito, como no protótipo v2: toggle quadrado "+/−", nome numa coluna, resumo do
// que as regras ativas fazem e a contagem à direita. Expandida, cada regra com ativar/remover (o que
// o protótipo não tem — aqui a aba edita). Busca ativa abre os grupos. No celular o resumo quebra
// linha em vez de truncar (o protótipo esconde parte do resumo — RNF-10).
const GrupoDeSujeito = ({ rotulo, regras, abertoPorBusca, nomesDaFrase, renderizarRegra }: GrupoDeSujeitoProps) => {
  const [aberto, setAberto] = useState(false)
  const expandido = aberto || abertoPorBusca
  const ativas = regras.filter((r) => r.ativa)

  return (
    <div className="border-b border-secondary last:border-b-0">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        aria-expanded={expandido}
        className={cn(
          'flex w-full items-center gap-2.75 px-3.75 py-2.75 text-left hover:bg-secondary/60 max-mobile:flex-wrap',
          expandido && 'bg-secondary',
        )}
      >
        <span
          aria-hidden
          className="flex size-[18px] flex-none items-center justify-center rounded-[5px] border border-border bg-card font-mono text-[12px] leading-none font-medium text-text-2"
        >
          {expandido ? '−' : '+'}
        </span>
        <span className="min-w-[140px] flex-none text-[13px] font-semibold">{rotulo}</span>
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-text-3 max-mobile:basis-full max-mobile:pl-[29px] max-mobile:whitespace-normal">
          {resumoDasRegras(ativas, nomesDaFrase)}
        </span>
        <span className="flex-none font-mono text-[10.5px] text-muted-foreground max-mobile:order-first max-mobile:ml-auto">
          {regras.length} {regras.length === 1 ? 'regra' : 'regras'}
          {regras.length !== ativas.length && ` · ${regras.length - ativas.length} inativa(s)`}
        </span>
      </button>
      {expandido && <div className="flex flex-col gap-1.25 px-2.5 pt-1 pb-2.5">{regras.map(renderizarRegra)}</div>}
    </div>
  )
}

type RegraCardProps = {
  regra: RegraAlcada
  frase: string
  onAlternar: () => void
  onRemover: () => void
  ocupado: boolean
}

// Regra expandida, compacta como no protótipo: frase 12,5px, tags de reserva/aprendida, aplicações em
// mono e os controles pequenos (antes tinham tamanho de botão cheio e dominavam a linha).
const RegraCard = ({ regra, frase, onAlternar, onRemover, ocupado }: RegraCardProps) => (
  <div
    className={cn(
      'flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-border bg-background px-3 py-2.25',
      !regra.ativa && 'opacity-55',
    )}
  >
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-1.75">
        <span className="text-[12.5px] font-medium text-pretty">{frase}</span>
        {regra.permissao === 'Reserva' && <TagDeRegra>reserva</TagDeRegra>}
        {regra.origem === 'Aprendida' && <TagDeRegra>aprendida</TagDeRegra>}
      </div>
      <div className="mt-0.75 font-mono text-[10.5px] text-muted-foreground">
        {regra.usos} {regra.usos === 1 ? 'aplicação' : 'aplicações'}
      </div>
    </div>
    <div className="flex flex-none gap-1.5">
      <button
        onClick={onAlternar}
        disabled={ocupado}
        className={cn(
          'rounded-full border px-2.5 py-0.75 text-[11.5px] font-medium max-mobile:min-h-9',
          regra.ativa ? 'border-ok-border bg-ok-bg text-ok-fg' : 'border-border bg-card text-text-2',
        )}
      >
        {regra.ativa ? 'Ativa' : 'Inativa'}
      </button>
      <button
        onClick={onRemover}
        disabled={ocupado}
        className="rounded-md border border-border bg-card px-2.25 py-0.75 text-[11.5px] font-medium text-text-2 hover:text-foreground max-mobile:min-h-9"
      >
        Remover
      </button>
    </div>
  </div>
)

const TagDeRegra = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-full border border-warn-border bg-warn-bg px-1.75 py-px font-mono text-[10px] font-medium text-warn-fg">
    {children}
  </span>
)
