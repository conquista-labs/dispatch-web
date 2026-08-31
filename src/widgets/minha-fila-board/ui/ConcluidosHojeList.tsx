import type { ProtocoloConcluidoResumo } from '@/entities/protocolo'
import { useCancelarPedidoReabertura } from '@/features/minha-fila/cancelar-pedido-reabertura'
import { useCorrigirResultado } from '@/features/minha-fila/corrigir-resultado'
import { usePedirReabertura } from '@/features/minha-fila/pedir-reabertura'
import { formatDuracaoConcluida } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { SurfaceCard } from '@/shared/ui/surface-card'

const STATUS_LABEL: Record<string, string> = {
  Aprovado: 'Aprovado',
  Reprovado: 'Não aprovado',
}

const STATUS_CLASSE: Record<string, string> = {
  Aprovado: 'text-ok-fg',
  Reprovado: 'text-bad-fg',
}

// RF-24a: 15 min após concluído — mesma constante de CorrigirResultado.JanelaDeCorrecao no back.
const JANELA_DE_CORRECAO_MS = 15 * 60_000

type ConcluidosHojeListProps = {
  concluidos: ProtocoloConcluidoResumo[]
  now: number
  // Distribuidora vendo a fila de outro conferente (fila-do-conferente-board) — o back só
  // aceita essas ações do próprio dono mesmo, mas a UI não deve nem oferecer o que seria
  // rejeitado (mesmo padrão de ProtocoloCard/EmConferenciaCard).
  somenteLeitura?: boolean
}

// RF-24: lista de concluídos do dia, com resultado e duração — mais, dentro da janela de
// correção, corrigir o resultado sozinho; fora dela, pedir/cancelar reabertura.
export const ConcluidosHojeList = ({ concluidos, now, somenteLeitura = false }: ConcluidosHojeListProps) => {
  const corrigir = useCorrigirResultado()
  const pedirReabertura = usePedirReabertura()
  const cancelarPedido = useCancelarPedidoReabertura()

  if (concluidos.length === 0) return null

  return (
    <SurfaceCard className="mt-1.5">
      <div className="mb-1.5 text-xs font-semibold text-text-2">Concluídos hoje · {concluidos.length}</div>
      {concluidos.map((protocolo) => {
        const restanteMs = protocolo.concluidoEm ? JANELA_DE_CORRECAO_MS - (now - new Date(protocolo.concluidoEm).getTime()) : 0
        const naJanela = restanteMs > 0
        const trocaLabel = protocolo.status === 'Aprovado' ? 'não aprovado' : 'aprovado'

        return (
          <div key={protocolo.id} data-testid={`concluido-${protocolo.id}`} className="border-t border-secondary py-1 first:border-t-0">
            <div className="flex items-center justify-between gap-2 text-[12.5px]">
              <span className="font-mono text-xs text-text-2">{protocolo.numero}</span>
              <span className={`font-medium ${STATUS_CLASSE[protocolo.status] ?? 'text-text-2'}`}>{STATUS_LABEL[protocolo.status] ?? protocolo.status}</span>
              <span className="font-mono text-[11.5px] text-muted-foreground">{protocolo.duracao ? formatDuracaoConcluida(protocolo.duracao) : '—'}</span>
            </div>

            {!somenteLeitura && (
              <div className="mt-1">
                {protocolo.pedidoReaberturaPendenteId ? (
                  <div className="flex items-center justify-between gap-2 rounded-md bg-warn-bg-2 px-2 py-1">
                    <span className="text-[11.5px] text-warn-fg">Reabertura solicitada — aguardando a distribuidora</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-[11px]"
                      onClick={() => cancelarPedido.mutate(protocolo.pedidoReaberturaPendenteId!)}
                      disabled={cancelarPedido.isPending}
                    >
                      Cancelar pedido
                    </Button>
                  </div>
                ) : naJanela ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10.5px] text-muted-foreground">pode corrigir por {Math.ceil(restanteMs / 60_000)}min</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-[11px]"
                      onClick={() => corrigir.mutate(protocolo.id)}
                      disabled={corrigir.isPending}
                    >
                      Corrigir para {trocaLabel}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10.5px] text-muted-foreground">janela de correção encerrada</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-[11px]"
                      onClick={() => pedirReabertura.mutate(protocolo.id)}
                      disabled={pedirReabertura.isPending}
                    >
                      Pedir reabertura à distribuidora
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </SurfaceCard>
  )
}
