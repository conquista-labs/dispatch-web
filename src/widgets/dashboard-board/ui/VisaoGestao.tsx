import { rotuloAnalista } from '@/entities/conferente'
import { FAIXA_LABEL, type Dashboard, type DesempenhoConferente, type PeriodoDashboard } from '@/entities/dashboard'
import { ETAPA_LABEL, TIPO_PRAZO_LABEL } from '@/entities/protocolo'
import { SeloSoAdministracao, useEhAdministrador } from '@/entities/usuario'
import { formatDuracaoConcluida } from '@/shared/lib/format'
import { cn } from '@/shared/lib/utils'
import { SurfaceCard } from '@/shared/ui/surface-card'

import {
  CLASSE_DA_FAIXA,
  contagem,
  diasUteisEntre,
  diasUteisNoPeriodo,
  faixaDoTempoPorTipo,
  formatarComplexidade,
  formatarMediaDiaria,
  TEXTO_DO_TOM,
  tomDaAprovacao,
  tomDoPrazo,
} from '../lib/apresentacao'
import { aprovadoNaPrimeira, COMPARADO_COM, variacaoDeTempo, variacaoDeVolume, variacaoEmPontos } from '../lib/variacao'
import { KpiCard } from './KpiCard'
import { SerieCard } from './SerieCard'

const pct = (fracao: number) => `${Math.round(fracao * 100)}%`

// Mesmos limiares do protótipo aprovado (`slaEquipes`): >=90% ok, >=70% atenção, abaixo disso
// vencido — cores batendo com as faixas do semáforo (ok/warn/bad-*), não um esquema novo.
const corDoCumprimento = (percentual: number): 'ok' | 'warn' | 'bad' =>
  percentual >= 0.9 ? 'ok' : percentual >= 0.7 ? 'warn' : 'bad'
const TEXTO_TOM: Record<'ok' | 'warn' | 'bad', string> = { ok: 'text-ok-fg', warn: 'text-warn-fg', bad: 'text-bad-fg' }
const BARRA_TOM: Record<'ok' | 'warn' | 'bad', string> = { ok: 'bg-ok-bar', warn: 'bg-warn-bar', bad: 'bg-bad-bar' }

type VisaoGestaoProps = {
  dashboard: Dashboard
  periodo: PeriodoDashboard
  periodoLabel: string
}

// Colunas de largura fixa e números à direita, como no protótipo aprovado (a tabela padrão do shadcn
// espalhava as colunas pela largura toda, com cabeçalho grande). Rola na horizontal no celular.
const COLUNAS = {
  nome: 'w-[150px] flex-none min-w-0',
  volume: 'w-[60px] flex-none text-right',
  tempo: 'w-[62px] flex-none text-right',
  prazo: 'w-[62px] flex-none text-right',
  aprovacao: 'w-[70px] flex-none text-right',
  complexidade: 'w-[66px] flex-none text-right',
  score: 'min-w-[120px] flex-1',
  faixa: 'w-[112px] flex-none text-right',
}

const LinhaDesempenho = ({ d, ehAdministrador }: { d: DesempenhoConferente; ehAdministrador: boolean }) => (
  <div role="row" className="flex min-h-[52px] items-center border-b border-secondary px-3.5 py-2.75 last:border-b-0">
    <span role="cell" className={COLUNAS.nome}>
      {/* RNF-10: nome completo, quebrando linha se precisar — não trunca. */}
      <span className="block text-[13.5px] font-medium text-pretty">{d.nome}</span>
      {d.nivel && <span className="block text-[11px] text-apoio">{rotuloAnalista(d.nivel)}</span>}
    </span>
    <span role="cell" className={cn(COLUNAS.volume, 'font-mono text-[13px] font-medium')}>
      {d.volume}
    </span>
    {/* "T. médio" no lugar do "Ritmo" do protótipo enquanto o back não calcula ritmo (ADR-0010). */}
    <span role="cell" className={cn(COLUNAS.tempo, 'font-mono text-[12.5px] font-medium text-text-3')}>
      {d.tempoMedio ? formatDuracaoConcluida(d.tempoMedio) : '—'}
    </span>
    <span
      role="cell"
      className={cn(
        COLUNAS.prazo,
        'font-mono text-[12.5px] font-medium',
        TEXTO_DO_TOM[tomDoPrazo(d.percentualNoPrazo)],
      )}
    >
      {pct(d.percentualNoPrazo)}
    </span>
    <span
      role="cell"
      className={cn(
        COLUNAS.aprovacao,
        'font-mono text-[12.5px] font-medium',
        aprovadoNaPrimeira(d) !== null && TEXTO_DO_TOM[tomDaAprovacao(aprovadoNaPrimeira(d)!)],
      )}
    >
      {aprovadoNaPrimeira(d) === null ? '—' : pct(aprovadoNaPrimeira(d)!)}
    </span>
    <span role="cell" className={cn(COLUNAS.complexidade, 'text-[12.5px] text-apoio')}>
      {formatarComplexidade(d.complexidadeMedia)}
    </span>
    {ehAdministrador && (
      <>
        <span role="cell" className={cn(COLUNAS.score, 'flex items-center gap-2 pr-2.5 pl-4')}>
          {d.score !== null && (
            <>
              <span className="block h-1 flex-1 overflow-hidden rounded-full bg-secondary">
                <span className="block h-1 rounded-full bg-text-2" style={{ width: `${d.score}%` }} />
              </span>
              <span className="w-6 text-right font-mono text-[13px] font-semibold">{d.score}</span>
            </>
          )}
        </span>
        <span role="cell" className={COLUNAS.faixa}>
          {d.faixa && (
            <span
              className={cn(
                'rounded-full border px-2.25 py-0.75 text-[11.5px] font-medium whitespace-nowrap',
                CLASSE_DA_FAIXA[d.faixa],
              )}
            >
              {FAIXA_LABEL[d.faixa]}
            </span>
          )}
        </span>
      </>
    )}
  </div>
)

// RF-43: KPIs agregados + tabela de desempenho/bonificação com nome de todo mundo + desempenho
// por tipo de ato + cumprimento de prazo por equipe. O KPI de "custo por ato" (RF-43 também
// pede) fica de fora — ver dispatch-api/docs/gaps-requisitos.md, §31.
// RF-43a: pra distribuidora a tabela vira "Produção por conferente", sem cargo, score nem faixa
// (o back já manda sem, e em ordem alfabética pra a ordem não entregar o ranking).
export const VisaoGestao = ({ dashboard, periodo, periodoLabel }: VisaoGestaoProps) => {
  const { kpis, kpisAnterior, serie, desempenho, porTipoAto, cumprimentoPrazoEquipe } = dashboard
  const aprovadosNa1a = aprovadoNaPrimeira(kpis)
  const ehAdministrador = useEhAdministrador()
  const diasUteis =
    dashboard.periodoInicio && dashboard.periodoFim
      ? diasUteisEntre(new Date(dashboard.periodoInicio), new Date(dashboard.periodoFim))
      : diasUteisNoPeriodo(periodo, new Date())
  const porDiaUtil = formatarMediaDiaria(kpis.atosConferidos / Math.max(1, diasUteis))
  const faixaTempo = faixaDoTempoPorTipo(porTipoAto)

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="m-0 text-[15px] font-semibold tracking-[-0.01em]">Resultado · {periodoLabel}</h2>
        {kpisAnterior && <span className="text-[12px] text-apoio">{COMPARADO_COM[periodo]}</span>}
      </div>
      <div className="grid grid-cols-4 gap-2 max-mobile:grid-cols-2">
        <KpiCard
          label="Atos conferidos"
          valor={String(kpis.atosConferidos)}
          variacao={variacaoDeVolume(kpis.atosConferidos, kpisAnterior?.atosConferidos)}
          sub={`${porDiaUtil} por dia útil, em média`}
        />
        <KpiCard
          label="Dentro do prazo"
          valor={pct(kpis.percentualNoPrazo)}
          variacao={
            kpisAnterior?.atosConferidos
              ? variacaoEmPontos(kpis.percentualNoPrazo, kpisAnterior.percentualNoPrazo)
              : null
          }
          sub={contagem(
            Math.round((1 - kpis.percentualNoPrazo) * kpis.atosConferidos),
            'nenhum estourou',
            'estourou',
            'estouraram',
          )}
        />
        <KpiCard
          label="Aprovados na 1ª"
          valor={aprovadosNa1a === null ? '—' : pct(aprovadosNa1a)}
          variacao={kpisAnterior ? variacaoEmPontos(aprovadosNa1a, aprovadoNaPrimeira(kpisAnterior)) : null}
          sub={contagem(
            Math.round((1 - kpis.percentualAprovado) * kpis.atosConferidos),
            'nenhum voltou com apontamento',
            'voltou com apontamento',
            'voltaram com apontamento',
          )}
        />
        <KpiCard
          label="Tempo médio"
          valor={kpis.tempoMedio ? formatDuracaoConcluida(kpis.tempoMedio) : '—'}
          variacao={variacaoDeTempo(kpis.tempoMedio, kpisAnterior?.tempoMedio)}
          sub={faixaTempo ? `bruto, sem ajuste · ${faixaTempo}` : 'bruto, sem ajuste'}
        />
      </div>

      {serie && serie.pontos.length > 0 && <SerieCard serie={serie} periodo={periodo} />}

      <div className="mt-6.5 mb-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        {ehAdministrador ? (
          <>
            <h2 className="m-0 flex flex-wrap items-center gap-2 text-[15px] font-semibold tracking-[-0.01em]">
              Desempenho e bonificação · {periodoLabel}
              <SeloSoAdministracao />
            </h2>
            <span className="text-[12px] text-apoio">
              score = 40% volume · 30% prazo · 20% qualidade · 10% complexidade
            </span>
          </>
        ) : (
          <>
            <h2 className="m-0 text-[15px] font-semibold tracking-[-0.01em]">
              Produção por conferente · {periodoLabel}
            </h2>
            <span className="text-[12px] text-apoio">em ordem alfabética</span>
          </>
        )}
      </div>
      <SurfaceCard className="overflow-x-auto p-0">
        <div
          role="table"
          aria-label={ehAdministrador ? 'Desempenho e bonificação' : 'Produção por conferente'}
          className={ehAdministrador ? 'min-w-[820px]' : 'min-w-[520px]'}
        >
          <div role="row" className="flex border-b border-border px-3.5 py-2.25 text-[11.5px] font-medium text-text-2">
            <span role="columnheader" className={COLUNAS.nome}>
              Conferente
            </span>
            <span role="columnheader" className={COLUNAS.volume}>
              Volume
            </span>
            <span role="columnheader" className={COLUNAS.tempo}>
              T. médio
            </span>
            <span role="columnheader" className={COLUNAS.prazo}>
              No prazo
            </span>
            <span role="columnheader" className={COLUNAS.aprovacao}>
              Aprovação
            </span>
            <span role="columnheader" className={COLUNAS.complexidade}>
              Complex.
            </span>
            {ehAdministrador && (
              <>
                <span role="columnheader" className={cn(COLUNAS.score, 'pr-2.5 text-right')}>
                  Score
                </span>
                <span role="columnheader" className={COLUNAS.faixa}>
                  Faixa
                </span>
              </>
            )}
          </div>
          {desempenho.map((d) => (
            <LinhaDesempenho key={d.conferenteId} d={d} ehAdministrador={ehAdministrador} />
          ))}
          {desempenho.length === 0 && (
            <p className="p-3.5 text-[13px] text-muted-foreground">Ninguém concluiu nenhum ato neste período.</p>
          )}
        </div>
      </SurfaceCard>
      <p className="mt-2.5 max-w-[80ch] text-[12.5px] text-pretty text-apoio">
        {ehAdministrador
          ? 'Complexidade é o peso médio dos atos conferidos — quem pega inventário e sobrepartilha não compete em volume com quem faz venda e compra, então o score corrige isso.'
          : 'Complexidade é o peso médio dos atos conferidos — quem pega inventário e sobrepartilha faz menos volume que quem faz venda e compra.'}
      </p>

      <div className="mt-6.5 grid grid-cols-1 gap-2 mobile:grid-cols-2">
        <div className="rounded-[10px] border border-border bg-card p-4 shadow-sm">
          <div className="text-[13.5px] font-semibold">Cumprimento de prazo por equipe</div>
          <div className="mt-[3px] mb-3 text-[11.5px] text-apoio">onde o prazo combinado não está sendo cumprido</div>
          {/* Uma linha por equipe+etapa — cresce rápido (cada equipe tem até 2, pré e pós). Mesmo
              teto de altura + scroll já usado em AbaAprendizado/AbaAlcadaCamadas (central de
              regras) pra listas deste tamanho, em vez de deixar o card empurrar a página. */}
          <div className="max-h-[420px] overflow-y-auto">
            {cumprimentoPrazoEquipe.map((c, indice) => {
              const tom = corDoCumprimento(c.percentualNoPrazo)
              return (
                <div key={indice} className="flex items-center gap-2.5 border-t border-border py-1.75">
                  <span className="w-33 min-w-0 flex-none">
                    <span className="block truncate text-[12.5px]">{c.equipeNome}</span>
                    <span className="block text-[10.5px] text-muted-foreground">
                      {ETAPA_LABEL[c.etapa]}
                      {c.prazo && ` · ${TIPO_PRAZO_LABEL[c.prazo]}`}
                    </span>
                  </span>
                  <span className="block h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <span
                      className={`block h-2 rounded-full ${BARRA_TOM[tom]}`}
                      style={{ width: pct(c.percentualNoPrazo) }}
                    />
                  </span>
                  <span className={`w-10.5 flex-none text-right font-mono text-[12.5px] font-medium ${TEXTO_TOM[tom]}`}>
                    {pct(c.percentualNoPrazo)}
                  </span>
                  <span className="w-14.5 flex-none text-right text-[11px] text-muted-foreground">
                    {c.total} {c.total === 1 ? 'ato' : 'atos'}
                  </span>
                </div>
              )
            })}
          </div>
          {cumprimentoPrazoEquipe.length === 0 && (
            <p className="text-[12.5px] text-muted-foreground">Nada concluído neste período.</p>
          )}
        </div>

        <div className="rounded-[10px] border border-border bg-card p-4 shadow-sm">
          <div className="text-[13.5px] font-semibold">Por tipo de ato</div>
          <div className="mt-[3px] mb-3 text-[11.5px] text-apoio">volume, tempo médio e retrabalho</div>
          <div className="flex pb-1.5 text-[10.5px] font-medium text-apoio">
            <span className="flex-1">Tipo</span>
            <span className="w-14.5 text-right">Volume</span>
            <span className="w-14.5 text-right">Tempo</span>
            <span className="w-14.5 text-right">Repro.</span>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {porTipoAto.map((t) => (
              <div key={t.tipoAtoId} className="flex items-center border-t border-border py-1.75 text-[12.5px]">
                <span className="min-w-0 flex-1 truncate text-text-5">{t.nome}</span>
                <span className="w-14.5 text-right font-mono text-[12.5px] font-medium">{t.volume}</span>
                <span className="w-14.5 text-right text-text-2">
                  {t.tempoMedio ? formatDuracaoConcluida(t.tempoMedio) : '—'}
                </span>
                <span
                  className={`w-14.5 text-right font-mono text-[12.5px] font-medium ${t.percentualReprovacao >= 0.3 ? 'text-bad-fg' : t.percentualReprovacao >= 0.2 ? 'text-warn-fg' : 'text-text-2'}`}
                >
                  {pct(t.percentualReprovacao)}
                </span>
              </div>
            ))}
          </div>
          {porTipoAto.length === 0 && (
            <p className="text-[12.5px] text-muted-foreground">Nada concluído neste período.</p>
          )}
        </div>
      </div>
    </div>
  )
}
