import { NIVEL_LABEL } from '@/entities/conferente'
import { FAIXA_LABEL, type Dashboard, type FaixaBonificacao } from '@/entities/dashboard'
import { formatDuracaoConcluida } from '@/shared/lib/format'
import { Chip } from '@/shared/ui/chip'
import { Progress } from '@/shared/ui/progress'
import { SurfaceCard } from '@/shared/ui/surface-card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'

import { KpiCard } from './KpiCard'

const pct = (fracao: number) => `${Math.round(fracao * 100)}%`

const FAIXA_TOM: Record<FaixaBonificacao, 'ok' | 'atencao' | 'vencido'> = {
  Integral: 'ok',
  Parcial: 'atencao',
  Fora: 'vencido',
}

type VisaoGestaoProps = {
  dashboard: Dashboard
  periodoLabel: string
}

// RF-43: KPIs agregados + tabela de desempenho/bonificação com nome de todo mundo + desempenho
// por tipo de ato. "Cumprimento de prazo por equipe" e o KPI de "custo por ato" (RF-43 também
// pede os dois) ficam de fora desta rodada — ver CLAUDE.md do dispatch-api.
export const VisaoGestao = ({ dashboard, periodoLabel }: VisaoGestaoProps) => {
  const { kpis, desempenho, porTipoAto } = dashboard

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        <KpiCard label="Atos conferidos" valor={String(kpis.atosConferidos)} sub={periodoLabel} />
        <KpiCard label="Dentro do prazo" valor={pct(kpis.percentualNoPrazo)} sub={`${Math.round((1 - kpis.percentualNoPrazo) * kpis.atosConferidos)} estouraram`} />
        <KpiCard label="Aprovados" valor={pct(kpis.percentualAprovado)} sub={`${Math.round((1 - kpis.percentualAprovado) * kpis.atosConferidos)} voltaram com apontamento`} />
        <KpiCard label="Tempo médio" valor={kpis.tempoMedio ? formatDuracaoConcluida(kpis.tempoMedio) : '—'} sub="por ato concluído" />
      </div>

      <h2 className="mt-5.5 mb-1 text-[15px] font-semibold tracking-[-0.01em]">Desempenho e bonificação · {periodoLabel}</h2>
      <p className="mb-2.5 max-w-[74ch] text-[12.5px] text-muted-foreground text-pretty">
        score = 40% volume · 30% prazo · 20% qualidade · 10% complexidade
      </p>
      <SurfaceCard className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Conferente</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>T. médio</TableHead>
              <TableHead>No prazo</TableHead>
              <TableHead>Aprovação</TableHead>
              <TableHead>Complex.</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Faixa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {desempenho.map((d) => (
              <TableRow key={d.conferenteId}>
                <TableCell>
                  <div className="text-[13px] font-medium">{d.nome}</div>
                  <div className="text-[11px] text-muted-foreground">Analista {d.nivel ? NIVEL_LABEL[d.nivel] : '—'}</div>
                </TableCell>
                <TableCell className="font-mono">{d.volume}</TableCell>
                <TableCell className="font-mono">{d.tempoMedio ? formatDuracaoConcluida(d.tempoMedio) : '—'}</TableCell>
                <TableCell className="font-mono">{pct(d.percentualNoPrazo)}</TableCell>
                <TableCell className="font-mono">{pct(d.percentualAprovado)}</TableCell>
                <TableCell className="font-mono">{d.complexidadeMedia.toFixed(1)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={d.score} className="h-2 w-16" />
                    <span className="font-mono text-[12.5px] font-medium">{d.score}</span>
                  </div>
                </TableCell>
                <TableCell>{d.faixa && <Chip tom={FAIXA_TOM[d.faixa]}>{FAIXA_LABEL[d.faixa]}</Chip>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {desempenho.length === 0 && <p className="p-3.5 text-[13px] text-muted-foreground">Ninguém concluiu nenhum ato neste período.</p>}
      </SurfaceCard>
      <p className="mt-1.5 max-w-[74ch] text-[11.5px] text-muted-foreground text-pretty">
        Complexidade é o peso médio dos atos conferidos — quem pega inventário e sobrepartilha não compete em volume com quem faz venda e compra, então o
        score corrige isso.
      </p>

      <h2 className="mt-5.5 mb-2.5 text-[15px] font-semibold tracking-[-0.01em]">Desempenho por tipo de ato</h2>
      <SurfaceCard className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo de ato</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>T. médio</TableHead>
              <TableHead>Reprovação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {porTipoAto.map((t) => (
              <TableRow key={t.tipoAtoId}>
                <TableCell className="text-[13px]">{t.nome}</TableCell>
                <TableCell className="font-mono">{t.volume}</TableCell>
                <TableCell className="font-mono">{t.tempoMedio ? formatDuracaoConcluida(t.tempoMedio) : '—'}</TableCell>
                <TableCell className="font-mono">{pct(t.percentualReprovacao)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {porTipoAto.length === 0 && <p className="p-3.5 text-[13px] text-muted-foreground">Nada concluído neste período.</p>}
      </SurfaceCard>
    </div>
  )
}
