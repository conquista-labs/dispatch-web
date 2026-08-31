import type { Dashboard } from '@/entities/dashboard'
import { formatDuracaoConcluida } from '@/shared/lib/format'
import { Progress } from '@/shared/ui/progress'
import { SurfaceCard } from '@/shared/ui/surface-card'

import { KpiCard } from './KpiCard'

const pct = (fracao: number) => `${Math.round(fracao * 100)}%`

type VisaoConferenteProps = {
  dashboard: Dashboard
}

// RF-45: só os próprios números — sem nome de colega, sem faixa de bônus (nem a própria).
export const VisaoConferente = ({ dashboard }: VisaoConferenteProps) => {
  const { kpis, desempenho, mediaDaCasa } = dashboard
  const meu = desempenho[0]

  if (!meu) {
    return (
      <div className="max-w-[780px] rounded-xl border border-dashed border-border bg-card p-10 text-center text-[13.5px] text-muted-foreground">
        Você ainda não concluiu nenhum ato neste período.
      </div>
    )
  }

  const parcelas = meu.parcelas
    ? [
        { label: 'Volume', pontos: meu.parcelas.volume, max: 40 },
        { label: 'Prazo', pontos: meu.parcelas.prazo, max: 30 },
        { label: 'Qualidade', pontos: meu.parcelas.qualidade, max: 20 },
        { label: 'Complexidade', pontos: meu.parcelas.complexidade, max: 10 },
      ]
    : []

  const comparacao = mediaDaCasa
    ? [
        { label: 'Dentro do prazo', voce: pct(meu.percentualNoPrazo), media: pct(mediaDaCasa.percentualNoPrazo) },
        { label: 'Aprovados', voce: pct(meu.percentualAprovado), media: pct(mediaDaCasa.percentualAprovado) },
        {
          label: 'Tempo médio',
          voce: meu.tempoMedio ? formatDuracaoConcluida(meu.tempoMedio) : '—',
          media: mediaDaCasa.tempoMedio ? formatDuracaoConcluida(mediaDaCasa.tempoMedio) : '—',
        },
      ]
    : []

  return (
    <div className="max-w-[900px]">
      <div className="grid grid-cols-5 gap-2">
        <KpiCard label="Atos conferidos" valor={String(kpis.atosConferidos)} sub="no período" />
        <KpiCard
          label="Dentro do prazo"
          valor={pct(meu.percentualNoPrazo)}
          sub={`${Math.round((1 - meu.percentualNoPrazo) * meu.volume)} estouraram`}
        />
        <KpiCard
          label="Aprovados"
          valor={pct(meu.percentualAprovado)}
          sub={`${Math.round((1 - meu.percentualAprovado) * meu.volume)} com apontamento`}
        />
        <KpiCard label="Tempo médio" valor={meu.tempoMedio ? formatDuracaoConcluida(meu.tempoMedio) : '—'} sub="por ato" />
        <KpiCard label="Complexidade média" valor={meu.complexidadeMedia.toFixed(1)} sub="peso dos atos que você pega" />
      </div>

      <h2 className="mt-5.5 mb-2.5 text-[15px] font-semibold tracking-[-0.01em]">Seu score do período</h2>
      <SurfaceCard className="p-4">
        <div className="flex items-baseline gap-2">
          <span className="text-[32px] font-semibold tracking-[-0.02em]">{meu.score}</span>
          <span className="text-[13px] text-muted-foreground">de 100</span>
        </div>
        <Progress value={meu.score} className="mt-2 h-2" />

        <div className="mt-4 grid grid-cols-4 gap-3">
          {parcelas.map((p) => (
            <div key={p.label}>
              <div className="text-[11.5px] font-medium text-text-2">{p.label}</div>
              <div className="mt-0.5 font-mono text-[13px] font-medium">
                {p.pontos.toFixed(1)} <span className="text-muted-foreground">/ {p.max}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[11.5px] text-muted-foreground text-pretty">
          O score pesa 40% volume, 30% prazo, 20% qualidade e 10% complexidade. A complexidade existe para que pegar inventário não pese contra quem faz
          venda e compra.
        </p>
      </SurfaceCard>

      {mediaDaCasa && (
        <>
          <h2 className="mt-5.5 mb-2.5 text-[15px] font-semibold tracking-[-0.01em]">Você e a média da casa</h2>
          <SurfaceCard className="p-0 px-3.5">
            <div className="flex items-center justify-between border-b border-secondary py-2 text-[11.5px] font-medium text-text-2">
              <span>Indicador</span>
              <div className="flex gap-8">
                <span className="w-16 text-right">Você</span>
                <span className="w-16 text-right">Média</span>
              </div>
            </div>
            {comparacao.map((linha) => (
              <div key={linha.label} className="flex items-center justify-between border-t border-secondary py-2 text-[13px] first:border-t-0">
                <span className="text-text-5">{linha.label}</span>
                <div className="flex gap-8 font-mono">
                  <span className="w-16 text-right font-medium">{linha.voce}</span>
                  <span className="w-16 text-right text-muted-foreground">{linha.media}</span>
                </div>
              </div>
            ))}
          </SurfaceCard>
          <p className="mt-1.5 text-[11.5px] text-muted-foreground text-pretty">Média dos conferentes na escala, sem identificar ninguém.</p>
        </>
      )}
    </div>
  )
}
