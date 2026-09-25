import { useState } from 'react'

import { NIVEL_LABEL, type AlcanceDoConferente, type Conferente } from '@/entities/conferente'
import { ETAPA_LABEL } from '@/entities/protocolo'
import { fraseDaRegra, type RegraAlcada } from '@/entities/regraAlcada'
import { useAlterarStatusRegraAlcada } from '@/features/regra-alcada/alterar-status'
import { useRemoverRegraAlcada } from '@/features/regra-alcada/remover'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { SurfaceCard } from '@/shared/ui/surface-card'

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

  return (
    <div>
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
              ? conferentes.filter((c) => todasDaCamada.some((r) => r.ativa && r.sujeitoNivel === c.nivel)).length
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
                {regrasDaCamada.map((regra) => (
                  <SurfaceCard
                    key={regra.id}
                    className={cn(
                      'flex flex-wrap items-center justify-between gap-3.5 p-2.5',
                      !regra.ativa && 'opacity-55',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-pretty">{fraseDaRegra(regra, nomesDaFrase)}</div>
                      <div className="mt-1 font-mono text-[10.5px] text-muted-foreground">
                        {regra.origem === 'Manual' ? 'definida por você' : 'aprendida'}
                      </div>
                    </div>
                    <div className="flex flex-none gap-1.5">
                      <button
                        onClick={() => alterarStatus.mutate({ regraId: regra.id, ativa: !regra.ativa })}
                        disabled={alterarStatus.isPending}
                        className={cn(
                          'rounded-full border px-2.5 py-1 text-xs font-medium',
                          regra.ativa ? 'border-ok-border bg-ok-bg text-ok-fg' : 'border-border bg-card text-text-2',
                        )}
                      >
                        {regra.ativa ? 'Ativa' : 'Inativa'}
                      </button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => remover.mutate(regra.id)}
                        disabled={remover.isPending}
                      >
                        Remover
                      </Button>
                    </div>
                  </SurfaceCard>
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

      <h2 className="mt-6.5 mb-2.5 text-[15px] font-semibold tracking-[-0.01em]">O que cada um alcança hoje</h2>
      {/* RNF-13 — rolagem própria e contida (achado no protótipo aprovado: essa mesma tabela
          lá estoura a página inteira em telas estreitas, arrastando até a barra fixa do topo,
          em vez de rolar só ela; aqui entra certo desde o início, mesmo padrão que a Matriz, do
          lado, já usa). `min-w-max` em cada linha evita que ela esprema as colunas em vez de
          rolar. */}
      <SurfaceCard className="overflow-x-auto p-4">
        {conferentes.map((c) => {
          const a = alcancePorConferenteId.get(c.id)
          const qtd = a?.tiposPermitidosIds.length ?? 0
          const etapasLabel =
            a && a.etapasPermitidas.length > 0
              ? a.etapasPermitidas.map((e) => ETAPA_LABEL[e]).join(' e ')
              : 'nenhuma etapa liberada'
          const largura = totalTipos > 0 ? Math.round((qtd / totalTipos) * 100) : 0
          return (
            <div key={c.id} className={cn('flex min-w-max items-start gap-3 py-1.5', !c.ativo && 'opacity-50')}>
              <span className="w-[130px] flex-none text-[13px] text-pretty">{c.nome}</span>
              <span className="mt-1 w-[110px] flex-none text-[11.5px] text-text-2">
                Analista {NIVEL_LABEL[c.nivel]}
              </span>
              <div className="mt-1.5 h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <div className="h-2 rounded-full bg-foreground" style={{ width: `${largura}%` }} />
              </div>
              <span className="mt-1 w-[52px] flex-none text-right font-mono text-[12.5px] font-medium">
                {qtd}/{totalTipos}
              </span>
              <span className="mt-1 w-[150px] flex-none text-right text-[11.5px] text-muted-foreground">
                {etapasLabel}
              </span>
            </div>
          )
        })}
      </SurfaceCard>
    </div>
  )
}
