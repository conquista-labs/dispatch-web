import { ChevronRightIcon } from 'lucide-react'
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
  const semAlcance = conferentes.filter(
    (c) => c.ativo && c.naEscala && (alcancePorConferenteId.get(c.id)?.tiposPermitidosIds.length ?? 0) === 0,
  )

  return (
    <div>
      {semAlcance.length > 0 && (
        <div role="alert" className="mb-4 rounded-[10px] border border-bad-border bg-bad-bg px-3.5 py-3">
          <div className="text-[13px] font-semibold text-bad-fg">
            {semAlcance.length === 1
              ? '1 conferente não recebe nenhum ato'
              : `${semAlcance.length} conferentes não recebem nenhum ato`}{' '}
            — {semAlcance.map((c) => c.nome).join(', ')}
          </div>
          <div className="mt-0.5 text-[12px] text-pretty text-bad-fg">
            {semAlcance.length === 1
              ? 'Está na escala, mas as regras abaixo barram todos os tipos de ato. Os protocolos que seriam dele vão para os outros ou para exceções.'
              : 'Estão na escala, mas as regras abaixo barram todos os tipos de ato. Os protocolos que seriam deles vão para os outros ou para exceções.'}
          </div>
        </div>
      )}

      <h2 className="mb-2.5 text-[15px] font-semibold tracking-[-0.01em]">O que cada um alcança hoje</h2>
      {/* RNF-13 — rolagem própria e contida (achado no protótipo aprovado: essa mesma tabela
          lá estoura a página inteira em telas estreitas, arrastando até a barra fixa do topo,
          em vez de rolar só ela; aqui entra certo desde o início, mesmo padrão que a Matriz, do
          lado, já usa). `min-w-max` em cada linha evita que ela esprema as colunas em vez de
          rolar. */}
      <SurfaceCard className="mb-6.5 overflow-x-auto p-4">
        {conferentes.map((c) => {
          const a = alcancePorConferenteId.get(c.id)
          const qtd = a?.tiposPermitidosIds.length ?? 0
          const etapasLabel =
            a && a.etapasPermitidas.length > 0
              ? a.etapasPermitidas.map((e) => ETAPA_LABEL[e]).join(' e ')
              : 'nenhuma etapa liberada'
          const largura = totalTipos > 0 ? Math.round((qtd / totalTipos) * 100) : 0
          return (
            <div
              key={c.id}
              className={cn(
                '-mx-2 flex min-w-max items-start gap-3 rounded-md px-2 py-1.5',
                !c.ativo && 'opacity-50',
                qtd === 0 && c.naEscala && 'bg-bad-bg',
              )}
            >
              <span className="w-[130px] flex-none text-[13px] text-pretty">{c.nome}</span>
              <span className="mt-1 w-[110px] flex-none text-[11.5px] text-text-2">{rotuloAnalista(c.nivel)}</span>
              <div className="mt-1.5 h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn('h-2 rounded-full', qtd === 0 ? 'bg-bad-border-2' : 'bg-foreground')}
                  style={{ width: `${largura}%` }}
                />
              </div>
              <span
                className={cn(
                  'mt-1 w-[52px] flex-none text-right font-mono text-[12.5px] font-medium',
                  qtd === 0 && 'text-bad-fg',
                )}
              >
                {qtd}/{totalTipos}
              </span>
              <span className="mt-1 w-[150px] flex-none text-right text-[11.5px] text-muted-foreground">
                {etapasLabel}
              </span>
            </div>
          )
        })}
      </SurfaceCard>

      <h2 className="mb-2.5 text-[15px] font-semibold tracking-[-0.01em]">
        As regras que produzem isso — agrupadas por quem elas afetam
      </h2>
      <Input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="buscar por nível, pessoa, tipo de ato, equipe…"
        className="mb-3"
      />

      <div className="flex flex-col gap-3">
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
              <div className="flex items-start justify-between gap-3 border-b border-secondary bg-secondary/60 p-3">
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
                  className="flex-none"
                  onClick={() => onAbrirBuilderParaCamada(camada)}
                >
                  {info.novaLabel}
                </Button>
              </div>

              {/* Rolagem própria (achado pelo dono: "Base por nível" passa de 80 regras quando o
                  construtor cria uma por tipo de ato selecionado) — cada camada rola dentro de
                  si mesma em vez de esticar a página inteira, mesmo espírito do que já foi
                  corrigido pra "O que cada um alcança hoje" mais abaixo. */}
              <div className="flex max-h-[420px] flex-col gap-1.5 overflow-y-auto p-2">
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
                  <div className="rounded-[8px] border border-dashed border-border p-3.5 text-center text-[12px] text-muted-foreground">
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

// Linha recolhível do sujeito: resumo do que as regras ativas dele fazem; expandida, cada regra com
// ativar/remover (o que o protótipo não tem — aqui a aba edita). Busca ativa abre os grupos.
const GrupoDeSujeito = ({ rotulo, regras, abertoPorBusca, nomesDaFrase, renderizarRegra }: GrupoDeSujeitoProps) => {
  const [aberto, setAberto] = useState(false)
  const expandido = aberto || abertoPorBusca
  const ativas = regras.filter((r) => r.ativa)

  return (
    <div className="rounded-[8px] border border-border bg-card">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        aria-expanded={expandido}
        className="flex w-full items-start gap-2 px-2.5 py-2 text-left hover:bg-secondary/60"
      >
        <ChevronRightIcon
          className={cn('mt-0.5 size-3.5 flex-none text-text-2 transition-transform', expandido && 'rotate-90')}
        />
        <span className="min-w-0 flex-1">
          <span className="text-[13px] font-semibold">{rotulo}</span>
          <span className="text-[13px] text-text-3"> — {resumoDasRegras(ativas, nomesDaFrase)}</span>
        </span>
        <span className="flex-none font-mono text-[11px] text-apoio">
          {regras.length} {regras.length === 1 ? 'regra' : 'regras'}
          {regras.length !== ativas.length && ` · ${regras.length - ativas.length} inativa(s)`}
        </span>
      </button>
      {expandido && (
        <div className="flex flex-col gap-1.5 border-t border-secondary p-2">{regras.map(renderizarRegra)}</div>
      )}
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

const RegraCard = ({ regra, frase, onAlternar, onRemover, ocupado }: RegraCardProps) => (
  <SurfaceCard
    className={cn('flex flex-wrap items-center justify-between gap-3.5 p-2.5', !regra.ativa && 'opacity-55')}
  >
    <div className="min-w-0 flex-1">
      <div className="text-[13px] font-medium text-pretty">{frase}</div>
      <div className="mt-1 font-mono text-[10.5px] text-muted-foreground">
        {regra.origem === 'Manual' ? 'definida por você' : 'aprendida'} · {regra.usos}{' '}
        {regra.usos === 1 ? 'aplicação' : 'aplicações'}
      </div>
    </div>
    <div className="flex flex-none gap-1.5">
      <button
        onClick={onAlternar}
        disabled={ocupado}
        className={cn(
          'rounded-full border px-2.5 py-1 text-xs font-medium',
          regra.ativa ? 'border-ok-border bg-ok-bg text-ok-fg' : 'border-border bg-card text-text-2',
        )}
      >
        {regra.ativa ? 'Ativa' : 'Inativa'}
      </button>
      <Button variant="outline" size="sm" onClick={onRemover} disabled={ocupado}>
        Remover
      </Button>
    </div>
  </SurfaceCard>
)
