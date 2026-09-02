import { useEquipes } from '@/entities/equipe'
import { useEscreventes } from '@/entities/escrevente'
import { useRegrasAlcada } from '@/entities/regraAlcada'
import { textoBaseDaSugestao, TIPO_SUGESTAO_LABEL, tituloDaSugestao, useSugestoesHistorico, useSugestoesPendentes } from '@/entities/sugestao'
import { useTiposAto } from '@/entities/tipoAto'
import { useAplicarSugestao } from '@/features/sugestao/aplicar'
import { useDescartarSugestao } from '@/features/sugestao/descartar'
import { useGerarSugestoes } from '@/features/sugestao/gerar'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Carregando } from '@/shared/ui/carregando'
import { Progress } from '@/shared/ui/progress'
import { SurfaceCard } from '@/shared/ui/surface-card'

// RF-39 a RF-41 — fila de propostas geradas pelo próprio uso, aplicar/descartar e histórico.
//
// Simplificação consciente em relação ao protótipo que continua de fora: chips de "casos
// concretos" (exemplos individuais por sugestão) — `Sugestao` (Dispatch.Domain.Aprendizado) só
// carrega `Evidencia` (texto agregado) e `Ocorrencias` (contagem), nunca uma lista de exemplos
// específicos; mostrar isso exigiria guardar referências que o back não persiste hoje. O índice
// de confiança (barra + "N% de confiança", mesma posição do protótipo) já é real — ver
// CLAUDE.md do dispatch-api, seção "Índice de confiança real da sugestão". Os 4 KPIs do topo
// também trocaram de número (o protótipo usa "5.724 linhas lidas"/"96% classificadas sem você",
// que não vem de lugar nenhum real) por métricas derivadas de dado que existe de verdade.
export const AbaAprendizado = () => {
  const { data: pendentes } = useSugestoesPendentes()
  const { data: historico } = useSugestoesHistorico()
  const { data: regras } = useRegrasAlcada()
  const { data: equipes } = useEquipes()
  const { data: escreventes } = useEscreventes()
  const { data: tiposAto } = useTiposAto()

  const gerar = useGerarSugestoes()
  const aplicar = useAplicarSugestao()
  const descartar = useDescartarSugestao()

  if (!pendentes || !historico || !regras || !equipes || !escreventes || !tiposAto) {
    return <Carregando className="mt-5" />
  }

  const lookups = {
    nomeEquipe: (id: string) => equipes.find((e) => e.id === id)?.nome ?? '—',
    nomeEscrevente: (id: string) => escreventes.find((e) => e.id === id)?.nome ?? '—',
    nomeTipoAto: (id: string) => tiposAto.find((t) => t.id === id)?.nome ?? '—',
  }

  const kpis = [
    { label: 'Tipos de ato no catálogo', valor: String(tiposAto.length), sub: `${regras.length} regras de alçada` },
    { label: 'Regras em vigor', valor: String(regras.filter((r) => r.ativa).length + equipes.length * 2), sub: 'alçada e prazo' },
    { label: 'Propostas na fila', valor: String(pendentes.length), sub: pendentes.length ? 'esperando sua decisão' : 'nada pendente' },
    {
      label: 'Aplicadas até hoje',
      valor: String(historico.filter((s) => s.status === 'Aplicada').length),
      sub: `${historico.filter((s) => s.status === 'Descartada').length} descartadas`,
    },
  ]

  return (
    <div>
      <div className="mt-4.5 grid grid-cols-4 gap-2">
        {kpis.map((kpi) => (
          <SurfaceCard key={kpi.label} className="p-3.5">
            <div className="text-[11.5px] font-medium text-text-2">{kpi.label}</div>
            <div className="mt-1.25 text-[22px] font-semibold tracking-[-0.02em]">{kpi.valor}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">{kpi.sub}</div>
          </SurfaceCard>
        ))}
      </div>

      <div className="mt-6.5 mb-2.5 flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-[15px] font-semibold tracking-[-0.01em]">O que o sistema aprendeu e quer confirmar</h2>
        <Button variant="outline" size="sm" onClick={() => gerar.mutate()} disabled={gerar.isPending}>
          {gerar.isPending ? 'Procurando…' : 'Procurar padrões novos'}
        </Button>
      </div>

      {pendentes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-9 text-center text-[13.5px] text-muted-foreground">
          Nenhuma proposta pendente. Clique em “Procurar padrões novos” pra recalcular contra os dados atuais.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {pendentes.map((sugestao) => (
            <SurfaceCard key={sugestao.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-border bg-secondary px-2 py-0.5 font-mono text-[10.5px] font-medium tracking-[0.04em] text-text-2">
                  {TIPO_SUGESTAO_LABEL[sugestao.tipo]}
                </span>
                <div className="flex flex-none items-center gap-2">
                  <Progress value={sugestao.indiceConfianca * 100} className="h-[5px] w-16" />
                  <span className="font-mono text-[11px] font-medium whitespace-nowrap text-text-2">
                    {Math.round(sugestao.indiceConfianca * 100)}% de confiança
                  </span>
                </div>
              </div>
              <div className="mt-2.5 text-[15px] font-semibold tracking-[-0.01em] text-pretty">{tituloDaSugestao(sugestao, lookups)}</div>
              <p className="mt-1.5 max-w-[74ch] text-[13px] leading-relaxed text-text-2 text-pretty">{textoBaseDaSugestao(sugestao)}</p>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">{sugestao.evidencia}</p>
              <div className="mt-3.5 flex gap-1.5">
                <Button size="sm" onClick={() => aplicar.mutate(sugestao.id)} disabled={aplicar.isPending}>
                  Aplicar
                </Button>
                <Button variant="outline" size="sm" onClick={() => descartar.mutate(sugestao.id)} disabled={descartar.isPending}>
                  Descartar
                </Button>
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}

      <h2 className="mt-6.5 mb-2.5 text-[15px] font-semibold tracking-[-0.01em]">Histórico de aprendizado</h2>
      <div className="flex flex-col gap-1.5">
        {historico.map((sugestao) => (
          <div key={sugestao.id} className="flex flex-wrap items-center justify-between gap-3.5 rounded-[10px] border border-border bg-card p-2.75">
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-pretty">{tituloDaSugestao(sugestao, lookups)}</div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                {sugestao.decididaEm ? new Date(sugestao.decididaEm).toLocaleDateString('pt-BR') : ''}
              </div>
            </div>
            <span
              className={cn(
                'flex-none rounded-full border px-2.5 py-0.75 text-[11.5px] font-medium',
                sugestao.status === 'Aplicada' ? 'border-ok-border bg-ok-bg text-ok-fg' : 'border-border bg-card text-text-2',
              )}
            >
              {sugestao.status === 'Aplicada' ? 'aplicada' : 'descartada'}
            </span>
          </div>
        ))}
        {historico.length === 0 && <p className="text-[13px] text-muted-foreground">Nenhuma decisão registrada ainda.</p>}
      </div>
    </div>
  )
}
