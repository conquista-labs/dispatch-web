import type { InfoProtocolo, ProtocoloResumo } from '@/entities/protocolo'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/sheet'

import { ProtocoloCard } from './ProtocoloCard'

type ListaCompletaPoolSheetProps = {
  aberto: boolean
  onFechar: () => void
  protocolos: ProtocoloResumo[]
  now: number
  resolverInfo: (protocolo: ProtocoloResumo) => InfoProtocolo
  somenteLeitura?: boolean
  acaoLabel?: string
  onAcao?: (protocoloId: string) => void
  acaoDesabilitada?: boolean
}

// "+N protocolos" do pool disponível (RF-19), mesmo padrão de ListaCompletaColunaSheet
// (widgets/distribuicao-board) — já vem ordenado por vencimento (o back ordena a lista
// inteira), então não precisa reordenar aqui. Reaproveitado por MinhaFilaBoard e
// FilaDoConferenteBoard (que passa somenteLeitura, sem onAcao).
export const ListaCompletaPoolSheet = ({
  aberto,
  onFechar,
  protocolos,
  now,
  resolverInfo,
  somenteLeitura,
  acaoLabel,
  onAcao,
  acaoDesabilitada,
}: ListaCompletaPoolSheetProps) => (
  <Sheet open={aberto} onOpenChange={(open) => !open && onFechar()}>
    <SheetContent side="right" className="w-[min(420px,92vw)] gap-0 overflow-y-auto p-0 sm:max-w-[420px]">
      <SheetHeader className="sticky top-0 z-10 border-b border-border bg-background p-5">
        <SheetTitle className="text-[15px] font-semibold tracking-[-0.01em]">Pool disponível · {protocolos.length}</SheetTitle>
      </SheetHeader>

      <div className="flex flex-col gap-2 p-3.5">
        {protocolos.map((protocolo) => (
          <ProtocoloCard
            key={protocolo.id}
            protocolo={protocolo}
            now={now}
            info={resolverInfo(protocolo)}
            somenteLeitura={somenteLeitura}
            acaoLabel={acaoLabel}
            onAcao={onAcao ? () => onAcao(protocolo.id) : undefined}
            acaoDesabilitada={acaoDesabilitada}
          />
        ))}
        {protocolos.length === 0 && <p className="p-2 text-[12.5px] text-muted-foreground">Nada no pool.</p>}
      </div>
    </SheetContent>
  </Sheet>
)
