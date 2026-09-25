import {
  ETAPA_LABEL,
  NumeroConferenciaTag,
  prazoChip,
  PrazoTooltip,
  PrioridadeAltaTag,
  type InfoProtocolo,
  type ProtocoloResumo,
} from '@/entities/protocolo'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Chip } from '@/shared/ui/chip'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet'
import { surfaceCardVariants } from '@/shared/ui/surface-card-variants'

type ListaCompletaColunaSheetProps = {
  aberto: boolean
  onFechar: () => void
  titulo: string
  subtitulo: string
  protocolos: ProtocoloResumo[]
  resolverInfo: (protocolo: ProtocoloResumo) => InfoProtocolo
  now: number
  onAbrirDetalhe: (protocoloId: string) => void
}

// RF-18c: "+N protocolos · ver todos" abre a lista integral da coluna (não só os ocultos), ordenada
// por vencimento. Layout do protótipo aprovado (Dispatch v2): painel de 560px, uma linha compacta
// por protocolo (número | tipo + escrevente·equipe·etapa | tags | prazo), subtítulo explicando a
// ordem e "Fechar" em texto. Sem o "N com alçada" por linha do protótipo (simplificação consciente,
// docs/gaps-requisitos.md §29) — a mesma informação está um clique adiante, no detalhe.
//
// Pedido do dono: clicar num protocolo aqui não deveria "perder o lugar" na lista — fechar o
// painel de detalhe devolvia pro quadro principal, obrigando a clicar em "+N protocolos" de
// novo e reencontrar o mesmo item. Por isso o clique só chama `onAbrirDetalhe`, sem fechar este
// sheet — quem decide fechá-lo visualmente é o pai (`ProtocoloColuna`, via a prop `aberto`
// combinada com "o painel de detalhe está aberto?"), então ele reaparece sozinho quando o
// detalhe fecha, sem perder a rolagem/posição. `onFechar` continua existindo pro fechamento
// explícito (clicar fora, Esc, "Fechar").
export const ListaCompletaColunaSheet = ({
  aberto,
  onFechar,
  titulo,
  subtitulo,
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
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-[min(560px,94vw)] gap-0 overflow-y-auto p-0 sm:max-w-[560px]"
      >
        <SheetHeader className="sticky top-0 z-10 flex-row items-start justify-between gap-3 border-b border-border bg-background px-5 py-4">
          <div className="min-w-0">
            <SheetTitle className="text-[15.5px] font-semibold tracking-[-0.01em]">{titulo}</SheetTitle>
            <SheetDescription className="mt-0.75 text-[12px] text-pretty text-text-2">{subtitulo}</SheetDescription>
          </div>
          <Button variant="outline" className="flex-none text-text-2" onClick={onFechar}>
            Fechar
          </Button>
        </SheetHeader>

        <div className="flex flex-col gap-1.75 px-5 pt-3.5 pb-6">
          {ordenados.map((protocolo) => {
            const info = resolverInfo(protocolo)
            const chip = prazoChip(protocolo.semaforo, protocolo.vencimentoEm, now)
            const emConferencia = protocolo.status === 'Conferindo'
            const linha2 = `${info.escreventeNome ?? '—'} · ${info.equipeNome ?? 'sem equipe'} · ${ETAPA_LABEL[protocolo.etapa]}`
            return (
              <button
                key={protocolo.id}
                type="button"
                onClick={() => onAbrirDetalhe(protocolo.id)}
                className={cn(
                  surfaceCardVariants({ tom: chip.tom }),
                  'flex flex-wrap items-center gap-3 px-3.25 py-2.75 text-left hover:border-text-2',
                )}
              >
                <span className="w-[70px] flex-none font-mono text-[12.5px] font-medium">{protocolo.numero}</span>
                {/* No celular o tipo ficava espremido em "Venda e C…": com um piso de largura, o prazo
                    quebra pra linha de baixo, alinhado com o texto. */}
                <span className="min-w-0 flex-1 max-mobile:min-w-[170px]">
                  <span className="block truncate text-[13px] text-text-5">
                    {info.tipoAtoNome ?? protocolo.tipoAtoNomeOriginal ?? '—'}
                  </span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground" title={linha2}>
                    {info.escreventeNome ?? '—'} ·{' '}
                    <span className={info.equipeNome ? undefined : 'text-bad-fg'}>
                      {info.equipeNome ?? 'sem equipe'}
                    </span>{' '}
                    · {ETAPA_LABEL[protocolo.etapa]}
                  </span>
                </span>
                {protocolo.prioridade === 'Alta' && <PrioridadeAltaTag />}
                <NumeroConferenciaTag numero={protocolo.numeroDaConferencia} variante="media" />
                <span className="flex flex-none flex-col items-end gap-0.75 max-mobile:ml-[82px] max-mobile:flex-row max-mobile:items-center max-mobile:gap-2">
                  <PrazoTooltip>
                    <Chip tom={chip.tom}>{chip.label}</Chip>
                  </PrazoTooltip>
                  {/* O protótipo põe aqui "N com alçada" (não temos, ver acima); o status cabe no
                      lugar e ajuda na lista de um conferente, que mistura atribuídos e em conferência. */}
                  {protocolo.donoId && (
                    <span className="text-[10.5px] whitespace-nowrap text-muted-foreground">
                      {emConferencia ? 'em conferência' : 'atribuído'}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
          {protocolos.length === 0 && <p className="p-2 text-[12.5px] text-muted-foreground">Nada nesta coluna.</p>}
        </div>
      </SheetContent>
    </Sheet>
  )
}
