import { useAlcance, useCobertura, useConferentes } from '@/entities/conferente'
import { SurfaceCard } from '@/shared/ui/surface-card'

import { ConferenteCard } from './ConferenteCard'

// RF-25 a RF-30 — lista de conferentes + KPIs do dia + aviso de cobertura. Sem busca/filtro/
// paginação (o protótipo aprovado também não tem — time pequeno o bastante pra não precisar).
export const ConferentesBoard = () => {
  const { data: conferentes, isLoading } = useConferentes()
  const { data: alcance } = useAlcance()
  const { data: cobertura } = useCobertura()

  if (isLoading || !conferentes) {
    return <p className="text-[13.5px] text-muted-foreground">Carregando…</p>
  }

  // RF-25: "Remover" é soft delete no back (Usuario.Desativar — mantém histórico, ver
  // CLAUDE.md do dispatch-api), mas GET /conferentes já filtra ativo=false na fonte — o front
  // não precisa (nem deve) repetir esse filtro aqui.
  const ativos = conferentes.filter((c) => c.naEscala)
  const capacidadeDoDia = ativos.reduce((soma, c) => soma + c.capacidadeEstimada, 0)
  const naMaoDoDia = ativos.reduce((soma, c) => soma + c.cargaAtual, 0)
  const ocupacao = capacidadeDoDia > 0 ? Math.round((naMaoDoDia / capacidadeDoDia) * 100) : null
  const tiposAlcancadosPorConferente = new Map((alcance ?? []).map((a) => [a.conferenteId, a.tiposPermitidosIds.length]))

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        <Kpi label="Na escala hoje" valor={`${ativos.length} de ${conferentes.length}`} />
        <Kpi label="Capacidade do dia" valor={`${capacidadeDoDia} atos`} />
        <Kpi label="Ocupação" valor={ocupacao === null ? '—' : `${ocupacao}%`} tom={ocupacao !== null && ocupacao > 85 ? 'bad' : undefined} />
        <Kpi
          label="Tipos sem ninguém"
          valor={String(cobertura?.semNinguemHabilitado.length ?? 0)}
          tom={cobertura && cobertura.semNinguemHabilitado.length > 0 ? 'bad' : 'ok'}
        />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {conferentes.map((conferente) => (
          <ConferenteCard key={conferente.id} conferente={conferente} tiposAlcancados={tiposAlcancadosPorConferente.get(conferente.id) ?? null} />
        ))}
        {conferentes.length === 0 && (
          <div className="rounded-[10px] border border-dashed border-border p-8 text-center text-[13px] text-muted-foreground">
            nenhum conferente cadastrado ainda
          </div>
        )}
      </div>

      <p className="mt-3 max-w-[70ch] text-[12.5px] text-text-2">
        A alçada de cada um vem das regras da Central de regras. Marcar alguém como ausente devolve os protocolos dele ao pool na hora.
      </p>

      {cobertura && <AvisoCobertura cobertura={cobertura} />}
    </div>
  )
}

const Kpi = ({ label, valor, tom }: { label: string; valor: string; tom?: 'bad' | 'ok' }) => (
  <SurfaceCard className="p-3">
    <div className="text-[11.5px] font-medium text-text-2">{label}</div>
    <div className={`mt-1 font-mono text-xl font-semibold ${tom === 'bad' ? 'text-bad-fg' : tom === 'ok' ? 'text-ok-fg' : ''}`}>{valor}</div>
  </SurfaceCard>
)

const AvisoCobertura = ({ cobertura }: { cobertura: { semNinguemHabilitado: { nome: string }[]; dependeDeUmaPessoa: { nome: string }[] } }) => {
  if (cobertura.semNinguemHabilitado.length > 0) {
    return (
      <div className="mt-3 rounded-[10px] border border-warn-border bg-warn-bg p-3">
        <p className="text-[13px] text-warn-fg-2">
          Nenhum conferente na escala tem alçada para: <strong className="font-semibold">{cobertura.semNinguemHabilitado.map((t) => t.nome).join(', ')}</strong>.
          Esses protocolos vão direto para a fila de exceções.
        </p>
      </div>
    )
  }

  if (cobertura.dependeDeUmaPessoa.length > 0) {
    return (
      <div className="mt-3 rounded-[10px] border border-warn-border bg-warn-bg p-3">
        <p className="text-[13px] text-warn-fg-2">
          Dependem de uma pessoa só: <strong className="font-semibold">{cobertura.dependeDeUmaPessoa.map((t) => t.nome).join(', ')}</strong>. Se
          ela faltar, esses atos param.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-[10px] border border-warn-border bg-warn-bg p-3">
      <p className="text-[13px] text-warn-fg-2">Todo tipo de ato em circulação tem pelo menos dois conferentes na escala.</p>
    </div>
  )
}
