import { NIVEL_LABEL } from '@/entities/conferente'
import { FAIXA_LABEL, type Dashboard, type FaixaBonificacao } from '@/entities/dashboard'
import { ETAPA_LABEL, TIPO_PRAZO_LABEL } from '@/entities/protocolo'
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

// Mesmos limiares do protótipo aprovado (`slaEquipes`, Dispatch.dc.html): >=90% ok, >=70%
// atenção, abaixo disso vencido — cores batendo com as faixas do semáforo (ok/warn/bad-*),
// não um esquema novo só pra este card.
const corDoCumprimento = (percentual: number): 'ok' | 'warn' | 'bad' => (percentual >= 0.9 ? 'ok' : percentual >= 0.7 ? 'warn' : 'bad')
const TEXTO_TOM: Record<'ok' | 'warn' | 'bad', string> = { ok: 'text-ok-fg', warn: 'text-warn-fg', bad: 'text-bad-fg' }
const BARRA_TOM: Record<'ok' | 'warn' | 'bad', string> = { ok: 'bg-ok-bar', warn: 'bg-warn-bar', bad: 'bg-bad-bar' }

type VisaoGestaoProps = {
  dashboard: Dashboard
  periodoLabel: string
}

// RF-43: KPIs agregados + tabela de desempenho/bonificação com nome de todo mundo + desempenho
// por tipo de ato + cumprimento de prazo por equipe. O KPI de "custo por ato" (RF-43 também
// pede) fica de fora — ver CLAUDE.md do dispatch-api.
export const VisaoGestao = ({ dashboard, periodoLabel }: VisaoGestaoProps) => {
  const { kpis, desempenho, porTipoAto, cumprimentoPrazoEquipe } = dashboard

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

      <div className="mt-6.5 grid grid-cols-1 gap-2 md:grid-cols-2">
        <div className="rounded-[10px] border border-border bg-card p-4 shadow-sm">
          <div className="text-[13.5px] font-semibold">Cumprimento de prazo por equipe</div>
          <div className="mt-[3px] mb-3 text-[11.5px] text-muted-foreground">onde o prazo combinado não está sendo cumprido</div>
          {cumprimentoPrazoEquipe.map((c, indice) => {
            const tom = corDoCumprimento(c.percentualNoPrazo)
            return (
              <div key={indice} className="flex items-center gap-2.5 border-t border-border py-1.75">
                <span className="w-33 flex-none min-w-0">
                  <span className="block truncate text-[12.5px]">{c.equipeNome}</span>
                  <span className="block text-[10.5px] text-muted-foreground">
                    {ETAPA_LABEL[c.etapa]}
                    {c.prazo && ` · ${TIPO_PRAZO_LABEL[c.prazo]}`}
                  </span>
                </span>
                <span className="block h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                  <span className={`block h-2 rounded-full ${BARRA_TOM[tom]}`} style={{ width: pct(c.percentualNoPrazo) }} />
                </span>
                <span className={`w-10.5 flex-none text-right font-mono text-[12.5px] font-medium ${TEXTO_TOM[tom]}`}>{pct(c.percentualNoPrazo)}</span>
                <span className="w-14.5 flex-none text-right text-[11px] text-muted-foreground">{c.total} atos</span>
              </div>
            )
          })}
          {cumprimentoPrazoEquipe.length === 0 && <p className="text-[12.5px] text-muted-foreground">Nada concluído neste período.</p>}
        </div>

        <div className="rounded-[10px] border border-border bg-card p-4 shadow-sm">
          <div className="text-[13.5px] font-semibold">Por tipo de ato</div>
          <div className="mt-[3px] mb-3 text-[11.5px] text-muted-foreground">volume, tempo médio e retrabalho</div>
          <div className="flex pb-1.5 text-[10.5px] font-medium text-muted-foreground">
            <span className="flex-1">Tipo</span>
            <span className="w-14.5 text-right">Volume</span>
            <span className="w-14.5 text-right">Tempo</span>
            <span className="w-14.5 text-right">Repro.</span>
          </div>
          {porTipoAto.map((t) => (
            <div key={t.tipoAtoId} className="flex items-center border-t border-border py-1.75 text-[12.5px]">
              <span className="min-w-0 flex-1 truncate text-text-5">{t.nome}</span>
              <span className="w-14.5 text-right font-mono text-[12.5px] font-medium">{t.volume}</span>
              <span className="w-14.5 text-right text-text-2">{t.tempoMedio ? formatDuracaoConcluida(t.tempoMedio) : '—'}</span>
              <span className={`w-14.5 text-right font-mono text-[12.5px] font-medium ${t.percentualReprovacao >= 0.3 ? 'text-bad-fg' : t.percentualReprovacao >= 0.2 ? 'text-warn-fg' : 'text-text-2'}`}>
                {pct(t.percentualReprovacao)}
              </span>
            </div>
          ))}
          {porTipoAto.length === 0 && <p className="text-[12.5px] text-muted-foreground">Nada concluído neste período.</p>}
        </div>
      </div>
    </div>
  )
}
