import { ETAPA_LABEL, prazoChip, type InfoProtocolo, type ProtocoloResumo } from '@/entities/protocolo'
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
export const ListaCompletaColunaSheet = ({ aberto, onFechar, nome, protocolos, resolverInfo, now, onAbrirDetalhe }: ListaCompletaColunaSheetProps) => {
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
                onClick={() => {
                  onAbrirDetalhe(protocolo.id)
                  onFechar()
                }}
                className="rounded-[10px] border border-border bg-card p-2.5 text-left hover:border-muted-foreground/40"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-mono text-[12px] font-medium">{protocolo.numero}</span>
                  <Chip tom={chip.tom}>{chip.label}</Chip>
                </div>
                <div className="mt-1 text-[11.5px] text-pretty text-text-2">
                  {info.tipoAtoNome ?? '—'} · {ETAPA_LABEL[protocolo.etapa]}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-pretty text-[11px] text-muted-foreground">{info.escreventeNome ?? '—'}</span>
                  <Chip tom={info.equipeNome ? 'neutro' : 'vencido'}>{info.equipeNome ?? 'sem equipe'}</Chip>
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
