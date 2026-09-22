import { ETAPA_LABEL, prazoChip, PrazoTooltip, type InfoProtocolo, type ProtocoloResumo } from '@/entities/protocolo'
import { Chip } from '@/shared/ui/chip'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/sheet'

type ListaCompletaColunaSheetProps = {
  aberto: boolean
  onFechar: () => void
  nome: string
  protocolos: ProtocoloResumo[]
  resolverInfo: (protocolo: ProtocoloResumo) => InfoProtocolo
  now: number
  onAbrirDetalhe: (protocoloId: string) => void
}

// RF-18c: "+N protocolos" abre a lista integral da coluna (não só os ocultos), ordenada por
// vencimento. Sem "quantos têm alçada" por item (simplificação consciente, ver CLAUDE.md) — a
// mesma informação já está um clique adiante, no painel de detalhe de cada protocolo.
//
// Pedido do dono: clicar num protocolo aqui não deveria "perder o lugar" na lista — fechar o
// painel de detalhe devolvia pro quadro principal, obrigando a clicar em "+N protocolos" de
// novo e reencontrar o mesmo item. Por isso o clique só chama `onAbrirDetalhe`, sem fechar este
// sheet — quem decide fechá-lo visualmente é o pai (`ProtocoloColuna`, via a prop `aberto`
// combinada com "o painel de detalhe está aberto?"), então ele reaparece sozinho quando o
// detalhe fecha, sem perder a rolagem/posição. `onFechar` continua existindo pro fechamento
// explícito (clicar fora, Esc, X).
export const ListaCompletaColunaSheet = ({
  aberto,
  onFechar,
  nome,
  protocolos,
  resolverInfo,
  now,
  onAbrirDetalhe,
}: ListaCompletaColunaSheetProps) => {
  const ordenados = [...protocolos].sort((a, b) => {
    if (!a.vencimentoEm) return 1
    if (!b.vencimentoEm) return -1
    return new Date(a.vencimentoEm).getTime() - new Date(b.vencimentoEm).getTime()
  })

  return (
    <Sheet open={aberto} onOpenChange={(open) => !open && onFechar()}>
      <SheetContent side="right" className="w-[min(480px,92vw)] gap-0 overflow-y-auto p-0 sm:max-w-[480px]">
        <SheetHeader className="sticky top-0 z-10 border-b border-border bg-background p-5">
          <SheetTitle className="text-[15px] font-semibold tracking-[-0.01em]">
            {nome} · {protocolos.length}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-1.5 p-3.5">
          {ordenados.map((protocolo) => {
            const info = resolverInfo(protocolo)
            const chip = prazoChip(protocolo.semaforo, protocolo.vencimentoEm, now)
            return (
              <button
                key={protocolo.id}
                type="button"
                onClick={() => onAbrirDetalhe(protocolo.id)}
                className="rounded-[10px] border border-border bg-card p-2.5 text-left hover:border-muted-foreground/40"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-mono text-[12px] font-medium">{protocolo.numero}</span>
                  <PrazoTooltip>
                    <Chip tom={chip.tom}>{chip.label}</Chip>
                  </PrazoTooltip>
                </div>
                <div className="mt-1 overflow-hidden text-[13px] text-ellipsis whitespace-nowrap text-text-5">
                  {info.tipoAtoNome ?? '—'}
                </div>
                {/* RF-18a: "Alta" (não "urgente") — mesmo rótulo/posição do card do quadro
                    (DistribuicaoProtocoloCard.tsx), junto da meta de escrevente/equipe/etapa. */}
                <div className="mt-0.5 flex items-center gap-1.5">
                  {protocolo.prioridade === 'Alta' && (
                    <span className="flex-none rounded-full border border-bad-border bg-bad-bg px-1.5 text-[10.5px] font-semibold text-bad-fg">
                      Alta
                    </span>
                  )}
                  <div
                    className="min-w-0 flex-1 overflow-hidden text-[11.5px] text-ellipsis whitespace-nowrap text-muted-foreground"
                    title={`${info.escreventeNome ?? '—'} · ${info.equipeNome ?? 'sem equipe'} · ${ETAPA_LABEL[protocolo.etapa]}`}
                  >
                    {info.escreventeNome ?? '—'} ·{' '}
                    <span className={info.equipeNome ? undefined : 'text-bad-fg'}>
                      {info.equipeNome ?? 'sem equipe'}
                    </span>{' '}
                    · {ETAPA_LABEL[protocolo.etapa]}
                  </div>
                </div>
              </button>
            )
          })}
          {protocolos.length === 0 && <p className="p-2 text-[12.5px] text-muted-foreground">Nada nesta coluna.</p>}
        </div>
      </SheetContent>
    </Sheet>
  )
}
