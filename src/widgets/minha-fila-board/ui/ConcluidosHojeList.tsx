import type { ProtocoloConcluidoResumo } from '@/entities/protocolo'
import { useCancelarPedidoReabertura } from '@/features/minha-fila/cancelar-pedido-reabertura'
import { useCorrigirResultado } from '@/features/minha-fila/corrigir-resultado'
import { usePedirReabertura } from '@/features/minha-fila/pedir-reabertura'
import { formatDuracaoConcluida } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Chip } from '@/shared/ui/chip'
import { SurfaceCard } from '@/shared/ui/surface-card'

const STATUS_LABEL: Record<string, string> = {
  Aprovado: 'Aprovado',
  Reprovado: 'Não aprovado',
}

const STATUS_TOM: Record<string, 'ok' | 'vencido'> = {
  Aprovado: 'ok',
  Reprovado: 'vencido',
}

// RF-24a: 15 min após concluído — mesma constante de CorrigirResultado.JanelaDeCorrecao no back.
const JANELA_DE_CORRECAO_MS = 15 * 60_000

type ConcluidosHojeListProps = {
  concluidos: ProtocoloConcluidoResumo[]
  now: number
  /** RF-14/RF-24: back manda só o id, front resolve o nome — mesmo padrão de InfoProtocolo. */
  nomePorTipoAtoId: Map<string, string>
  // Distribuidora vendo a fila de outro conferente (fila-do-conferente-board) — o back só
  // aceita essas ações do próprio dono mesmo, mas a UI não deve nem oferecer o que seria
  // rejeitado (mesmo padrão de ProtocoloCard/EmConferenciaCard).
  somenteLeitura?: boolean
}

// RF-24: lista de concluídos do dia, com resultado e duração — mais, dentro da janela de
// correção, corrigir o resultado sozinho; fora dela, pedir/cancelar reabertura. Layout espelha
// o protótipo aprovado (Dispatch.dc.html, `feitosCards`, linhas ~833-861) — confirmado direto
// no markup, não por aproximação visual: número + pill de status na primeira linha, tipo do
// ato + duração na segunda, e a ação de correção/reabertura empilhada embaixo (não lado a lado
// com o texto, que é como estava antes e que o dono viu como "fonte estranha" — o texto em
// mono da janela de correção só faz sentido com o prefixo "MARCOU ERRADO? ·" que dava contexto
// a ele; sem o prefixo virava prosa solta em fonte tabular, por isso "estranho").
export const ConcluidosHojeList = ({ concluidos, now, nomePorTipoAtoId, somenteLeitura = false }: ConcluidosHojeListProps) => {
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
        const trocaLabel = protocolo.status === 'Aprovado' ? '"não aprovado"' : '"aprovado"'
        const tipoAtoNome = protocolo.tipoAtoId ? (nomePorTipoAtoId.get(protocolo.tipoAtoId) ?? '—') : '—'

        return (
          <div key={protocolo.id} data-testid={`concluido-${protocolo.id}`} className="border-t border-secondary py-1.5 first:border-t-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-text-2">{protocolo.numero}</span>
              <Chip tom={STATUS_TOM[protocolo.status] ?? 'neutro'}>{STATUS_LABEL[protocolo.status] ?? protocolo.status}</Chip>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="min-w-0 flex-1 truncate text-[11.5px] text-text-3">{tipoAtoNome}</span>
              <span className="flex-none font-mono text-[11px] text-muted-foreground">{protocolo.duracao ? formatDuracaoConcluida(protocolo.duracao) : '—'}</span>
            </div>

            {protocolo.corrigidoEm && <div className="mt-1 text-[10.5px] text-warn-fg">resultado já corrigido uma vez</div>}

            {!somenteLeitura &&
              (protocolo.pedidoReaberturaPendenteId ? (
                <div className="mt-2 rounded-md border border-warn-border bg-warn-bg px-2.5 py-1.5">
                  <div className="text-[11.5px] text-warn-fg leading-snug">Reabertura solicitada — aguardando a distribuidora</div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1.5 h-6 px-2 text-[11px]"
                    onClick={() => cancelarPedido.mutate(protocolo.pedidoReaberturaPendenteId!)}
                    disabled={cancelarPedido.isPending}
                  >
                    Cancelar pedido
                  </Button>
                </div>
              ) : naJanela ? (
                <div className="mt-2 border-t border-secondary pt-2">
                  <div className="mb-1.5 font-mono text-[10.5px] text-muted-foreground">MARCOU ERRADO? · pode corrigir por {Math.ceil(restanteMs / 60_000)}min</div>
                  <Button variant="outline" size="sm" className="w-full text-[12px]" onClick={() => corrigir.mutate(protocolo.id)} disabled={corrigir.isPending}>
                    Corrigir para {trocaLabel}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-auto w-full justify-start px-1.5 py-1 text-[11.5px] font-medium text-text-2"
                  onClick={() => pedirReabertura.mutate(protocolo.id)}
                  disabled={pedirReabertura.isPending}
                >
                  Pedir reabertura à distribuidora
                </Button>
              ))}
          </div>
        )
      })}
    </SurfaceCard>
  )
}
