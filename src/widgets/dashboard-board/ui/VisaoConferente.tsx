import type { Dashboard } from '@/entities/dashboard'
import { formatDuracaoConcluida, parseDuracaoParaMinutos } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { SurfaceCard } from '@/shared/ui/surface-card'

import { contagem, formatarComplexidade } from '../lib/apresentacao'
import { aprovadoNaPrimeira, PESOS_PADRAO, variacaoDeTempo, variacaoDeVolume, variacaoEmPontos } from '../lib/variacao'
import { explicacaoDoRitmo, formatarRitmo, textoDoRitmo, variacaoDoRitmo } from '../lib/ritmo'
import { KpiCard } from './KpiCard'
import { TempoPorTipoCard } from './TempoPorTipoCard'

const pct = (fracao: number) => `${Math.round(fracao * 100)}%`

type VisaoConferenteProps = {
  dashboard: Dashboard
  periodoLabel: string
  comparadoCom?: string
}

type LinhaComparacao = { label: string; voce: string; media: string; melhorOuIgual: boolean }

// RF-45: só os próprios números — sem nome de colega, sem faixa de bônus (nem a própria). Layout do
// protótipo aprovado (Dispatch v2): 4 KPIs, e score e "você e a média" lado a lado. O 4º KPI do
// protótipo é "Ritmo"; aqui é o tempo médio bruto até o back calcular ritmo (ADR-0010).
export const VisaoConferente = ({ dashboard, periodoLabel, comparadoCom }: VisaoConferenteProps) => {
  const { kpis, kpisAnterior, desempenho, mediaDaCasa, meuTempoPorTipo } = dashboard
  const pesos = dashboard.pesos ?? PESOS_PADRAO
  const meu = desempenho[0]

  if (!meu) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-[13.5px] text-muted-foreground">
        Você ainda não concluiu nenhum ato neste período.
      </div>
    )
  }

  const parcelas = meu.parcelas
    ? [
        { label: 'Volume', pontos: meu.parcelas.volume, max: pesos.volume },
        { label: 'Prazo', pontos: meu.parcelas.prazo, max: pesos.prazo },
        { label: 'Qualidade', pontos: meu.parcelas.qualidade, max: pesos.qualidade },
        { label: 'Complexidade', pontos: meu.parcelas.complexidade, max: pesos.complexidade },
      ]
    : []

  const minutos = (t: string | null) => (t ? parseDuracaoParaMinutos(t) : null)
  const meuTempo = minutos(meu.tempoMedio)
  const tempoDaCasa = mediaDaCasa ? minutos(mediaDaCasa.tempoMedio) : null

  // "Você" em verde quando está igual ou melhor que a média, em laranja quando pior — como no
  // protótipo. Tempo: menor é melhor.
  const comparacao: LinhaComparacao[] = mediaDaCasa
    ? [
        {
          label: 'Dentro do prazo',
          voce: pct(meu.percentualNoPrazo),
          media: pct(mediaDaCasa.percentualNoPrazo),
          melhorOuIgual: meu.percentualNoPrazo >= mediaDaCasa.percentualNoPrazo,
        },
        {
          label: 'Aprovados na 1ª',
          voce: aprovadoNaPrimeira(meu) === null ? '—' : pct(aprovadoNaPrimeira(meu)!),
          media: aprovadoNaPrimeira(mediaDaCasa) === null ? '—' : pct(aprovadoNaPrimeira(mediaDaCasa)!),
          melhorOuIgual: (aprovadoNaPrimeira(meu) ?? 0) >= (aprovadoNaPrimeira(mediaDaCasa) ?? 0),
        },
        meu.ritmo === undefined
          ? {
              label: 'Tempo médio',
              voce: meu.tempoMedio ? formatDuracaoConcluida(meu.tempoMedio) : '—',
              media: mediaDaCasa.tempoMedio ? formatDuracaoConcluida(mediaDaCasa.tempoMedio) : '—',
              melhorOuIgual: meuTempo === null || tempoDaCasa === null || meuTempo <= tempoDaCasa,
            }
          : {
              label: 'Ritmo (ajustado ao tipo)',
              voce: meu.ritmo === null ? '—' : formatarRitmo(meu.ritmo),
              media:
                mediaDaCasa.ritmo === null || mediaDaCasa.ritmo === undefined ? '—' : formatarRitmo(mediaDaCasa.ritmo),
              melhorOuIgual: meu.ritmo === null || !mediaDaCasa.ritmo || meu.ritmo <= mediaDaCasa.ritmo,
            },
      ]
    : []

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="m-0 text-[15px] font-semibold tracking-[-0.01em]">Seu resultado · {periodoLabel}</h2>
        {kpisAnterior && comparadoCom && <span className="text-[12px] text-apoio">{comparadoCom}</span>}
      </div>
      <div className="grid grid-cols-4 gap-2 max-mobile:grid-cols-2">
        <KpiCard
          label="Atos conferidos"
          valor={String(kpis.atosConferidos)}
          variacao={variacaoDeVolume(kpis.atosConferidos, kpisAnterior?.atosConferidos)}
          sub={`complexidade média ${formatarComplexidade(meu.complexidadeMedia)}`}
        />
        <KpiCard
          label="Dentro do prazo"
          valor={pct(meu.percentualNoPrazo)}
          variacao={
            kpisAnterior?.atosConferidos
              ? variacaoEmPontos(kpis.percentualNoPrazo, kpisAnterior.percentualNoPrazo)
              : null
          }
          sub={contagem(
            Math.round((1 - meu.percentualNoPrazo) * meu.volume),
            'nenhum estourou',
            'estourou',
            'estouraram',
          )}
        />
        <KpiCard
          label="Aprovados na 1ª"
          valor={aprovadoNaPrimeira(meu) === null ? '—' : pct(aprovadoNaPrimeira(meu)!)}
          variacao={kpisAnterior ? variacaoEmPontos(aprovadoNaPrimeira(kpis), aprovadoNaPrimeira(kpisAnterior)) : null}
          sub={contagem(
            Math.round((1 - meu.percentualAprovado) * meu.volume),
            'nenhum com apontamento',
            'com apontamento',
            'com apontamento',
          )}
        />
        {meu.ritmo !== undefined && meu.ritmo !== null ? (
          <KpiCard
            label="Ritmo"
            valor={formatarRitmo(meu.ritmo)}
            variacao={variacaoDoRitmo(kpis.ritmo, kpisAnterior?.ritmo)}
            sub={textoDoRitmo(meu.ritmo)}
          />
        ) : (
          <KpiCard
            label="Tempo médio"
            valor={meu.tempoMedio ? formatDuracaoConcluida(meu.tempoMedio) : '—'}
            variacao={variacaoDeTempo(kpis.tempoMedio, kpisAnterior?.tempoMedio)}
            sub="por ato, bruto"
          />
        )}
      </div>

      {meuTempoPorTipo && meuTempoPorTipo.length > 0 && (
        <TempoPorTipoCard
          tipos={meuTempoPorTipo}
          explicacao={explicacaoDoRitmo(meu.tempoMedio, meu.tempoMedioReferencia ?? null, meu.ritmo ?? null)}
        />
      )}

      <div className="mt-6.5 grid grid-cols-2 gap-2 max-mobile:grid-cols-1">
        <SurfaceCard className="p-4.5">
          <div className="text-[13.5px] font-semibold">Seu score do período</div>
          <div className="mt-0.75 text-[11.5px] text-apoio">
            volume, prazo, qualidade e complexidade do que você conferiu
          </div>
          <div className="mt-3.5 flex items-baseline gap-2">
            <span className="text-[44px] leading-none font-semibold tracking-[-0.03em]">{meu.score}</span>
            <span className="text-[13px] text-apoio">de 100</span>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-secondary">
            <div className="h-1 rounded-full bg-text-2" style={{ width: `${meu.score ?? 0}%` }} />
          </div>
          <div className="mt-4 border-t border-secondary pt-3.5">
            {parcelas.map((p) => (
              <div key={p.label} className="flex items-center gap-2.5 py-1.25">
                <span className="w-[104px] flex-none text-[12.5px] text-text-3">{p.label}</span>
                <span className="block h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <span
                    className="block h-1.5 rounded-full bg-apoio"
                    style={{ width: `${p.max > 0 ? (p.pontos / p.max) * 100 : 0}%` }}
                  />
                </span>
                <span className="w-[72px] flex-none text-right font-mono text-[12px] font-medium whitespace-nowrap text-text-3">
                  {p.pontos.toFixed(1)} / {p.max}
                </span>
              </div>
            ))}
          </div>
        </SurfaceCard>

        {mediaDaCasa && (
          <SurfaceCard className="p-4.5">
            <div className="text-[13.5px] font-semibold">Você e a média da casa</div>
            {/* A API compara com quem conferiu no período (não com "quem está na escala", como diz o
                protótipo) — o texto diz o que o número é. */}
            <div className="mt-0.75 mb-2 text-[11.5px] text-apoio">
              média de quem conferiu no período, sem identificar ninguém
            </div>
            <div className="flex border-b border-secondary pt-2 pb-1.5 text-[10.5px] font-medium text-apoio">
              <span className="flex-1">Indicador</span>
              <span className="w-[76px] text-right">Você</span>
              <span className="w-[76px] text-right">Média</span>
            </div>
            {comparacao.map((linha) => (
              <div
                key={linha.label}
                className="flex items-center border-b border-secondary py-2.25 text-[12.5px] last:border-b-0"
              >
                <span className="flex-1 text-text-5">{linha.label}</span>
                <span
                  className={cn(
                    'w-[76px] text-right font-mono text-[13px] font-semibold',
                    linha.melhorOuIgual ? 'text-ok-fg' : 'text-crit-fg',
                  )}
                >
                  {linha.voce}
                </span>
                <span className="w-[76px] text-right font-mono text-[12.5px] font-medium text-text-2">
                  {linha.media}
                </span>
              </div>
            ))}
          </SurfaceCard>
        )}
      </div>
    </div>
  )
}
