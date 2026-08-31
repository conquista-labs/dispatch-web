import { useConcluidosHojeDoConferente, useFilaDoConferente } from '@/entities/protocolo'
import { useNow } from '@/shared/lib/use-now'
import { ConcluidosHojeList, EmConferenciaCard, ProtocoloCard } from '@/widgets/minha-fila-board'

const LEGENDA = [
  { label: 'no prazo', className: 'bg-ok-bg border-ok-border-2' },
  { label: 'atenção', className: 'bg-warn-bg-2 border-warn-border-2' },
  { label: 'crítico', className: 'bg-crit-bg-2 border-crit-border' },
  { label: 'vencido', className: 'bg-bad-bg-2 border-bad-border-2' },
]

type FilaDoConferenteBoardProps = {
  conferenteId: string
}

// RF-19 — mesmo board de 3 colunas de "Minha fila", mas pra Distribuidora acompanhar a fila de
// um conferente específico: sempre somenteLeitura (sem Pegar/Iniciar/Aprovar/Reprovar/editar
// observação — RNF-04, a restrição de dono é sempre no servidor, esses endpoints nem aceitam
// chamada de quem não é Conferente; aqui é só visão). Reaproveita os mesmos componentes de
// card de widgets/minha-fila-board — a estrutura visual é idêntica, só o modo muda.
export const FilaDoConferenteBoard = ({ conferenteId }: FilaDoConferenteBoardProps) => {
  const { data: fila, isLoading } = useFilaDoConferente(conferenteId)
  const { data: concluidos } = useConcluidosHojeDoConferente(conferenteId)
  const now = useNow()

  if (isLoading || !fila) {
    return <p className="text-[13.5px] text-muted-foreground">Carregando…</p>
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3.5">
        <span className="font-mono text-[11.5px] text-muted-foreground">Prazo do ato</span>
        {LEGENDA.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5 text-[11.5px] text-text-3">
            <span className={`block size-2.5 flex-none rounded-[3px] border ${item.className}`} />
            {item.label}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex justify-between px-0.5 pb-0.5">
            <strong className="text-[13.5px] font-semibold">Pool disponível</strong>
            <span className="font-mono text-[11px] text-muted-foreground">{fila.poolDisponivel.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {fila.poolDisponivel.map((protocolo) => (
              <ProtocoloCard key={protocolo.id} protocolo={protocolo} now={now} somenteLeitura />
            ))}
            {fila.poolDisponivel.length === 0 && (
              <div className="rounded-[10px] border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                nada no pool dentro da alçada dele
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex justify-between px-0.5 pb-0.5">
            <strong className="text-[13.5px] font-semibold">Atribuídas</strong>
            <span className="font-mono text-[11px] text-muted-foreground">{fila.atribuidos.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {fila.atribuidos.map((protocolo) => (
              <ProtocoloCard key={protocolo.id} protocolo={protocolo} now={now} somenteLeitura />
            ))}
            {fila.atribuidos.length === 0 && (
              <div className="rounded-[10px] border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                nada atribuído
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex justify-between px-0.5 pb-0.5">
            <strong className="text-[13.5px] font-semibold">Em conferência</strong>
            <span className="font-mono text-[11px] text-muted-foreground">{fila.emConferencia.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {fila.emConferencia.map((protocolo) => (
              <EmConferenciaCard key={protocolo.id} protocolo={protocolo} now={now} somenteLeitura />
            ))}
            {fila.emConferencia.length === 0 && (
              <div className="rounded-[10px] border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                ninguém conferindo agora
              </div>
            )}
          </div>

          {concluidos && <ConcluidosHojeList concluidos={concluidos} now={now} somenteLeitura />}
        </div>
      </div>
    </div>
  )
}
