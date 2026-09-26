import { prazoChip, PrazoTooltip, type InfoProtocolo, type ProtocoloResumo } from '@/entities/protocolo'
import { Button } from '@/shared/ui/button'
import { Chip } from '@/shared/ui/chip'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet'

import type { AltaPendente, OndeAlta } from '../lib/prioridade-alta'

const ONDE_ROTULO: Record<OndeAlta, string> = {
  minhas: 'seu',
  conf: 'em conferência',
  pool: 'no pool',
}

type Props = {
  aberto: boolean
  onFechar: () => void
  altas: AltaPendente[]
  now: number
  resolverInfo: (protocolo: ProtocoloResumo) => InfoProtocolo
  onVer: (protocoloId: string) => void
  onPegar: (protocoloId: string) => void
  /** Regra do pool: só o próximo da vez (e abaixo do limite) ganha o botão. */
  podePegar?: (protocoloId: string) => boolean
  pegando: boolean
}

// RF-24h — "Ver os N" da faixa (e "Ver todos" do toast): a lista só das altas, na mesma ordem da
// faixa — os do conferente primeiro, depois os do pool, cada grupo por vencimento. Clicar num item
// leva até o card (RF-24j); os do pool já dão pra pegar daqui.
export const ListaAltasSheet = ({
  aberto,
  onFechar,
  altas,
  now,
  resolverInfo,
  onVer,
  onPegar,
  podePegar,
  pegando,
}: Props) => (
  <Sheet open={aberto} onOpenChange={(open) => !open && onFechar()}>
    <SheetContent side="right" className="w-[min(420px,92vw)] gap-0 overflow-y-auto p-0 sm:max-w-[420px]">
      <SheetHeader className="sticky top-0 z-10 border-b border-border bg-background p-5">
        <SheetTitle className="text-[15px] font-semibold tracking-[-0.01em]">
          Prioridade alta · {altas.length} {altas.length === 1 ? 'protocolo' : 'protocolos'}
        </SheetTitle>
        <SheetDescription className="text-[12.5px]">
          Os seus primeiro, depois os do pool — cada grupo por vencimento.
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-2 p-3.5">
        {altas.map(({ protocolo, onde }) => {
          const chip = prazoChip(protocolo.semaforo, protocolo.vencimentoEm, now)
          return (
            <div
              key={protocolo.id}
              role="button"
              tabIndex={0}
              onClick={() => onVer(protocolo.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onVer(protocolo.id)
              }}
              className="cursor-pointer rounded-[10px] border border-border bg-card p-3 hover:border-muted-foreground/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[12.5px] font-medium">{protocolo.numero}</span>
                <span className="text-[11.5px] text-muted-foreground">{ONDE_ROTULO[onde]}</span>
              </div>
              <div className="mt-1 text-[13px] text-pretty text-text-5">
                {resolverInfo(protocolo).tipoAtoNome ?? '—'}
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <PrazoTooltip>
                  <Chip tom={chip.tom}>{chip.label}</Chip>
                </PrazoTooltip>
                {onde === 'pool' && (podePegar?.(protocolo.id) ?? true) && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pegando}
                    onClick={(e) => {
                      e.stopPropagation()
                      onPegar(protocolo.id)
                    }}
                  >
                    Pegar
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </SheetContent>
  </Sheet>
)
