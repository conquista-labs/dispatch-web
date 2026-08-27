import { prazoChip, type ProtocoloResumo } from '@/entities/protocolo'
import { ObservacaoField } from '@/features/protocolo/definir-observacao'
import { formatCronometro } from '@/shared/lib/format'
import { Chip } from '@/shared/ui/chip'
import { SurfaceCard } from '@/shared/ui/surface-card'

const ETAPA_LABEL: Record<ProtocoloResumo['etapa'], string> = {
  PreConferencia: 'Pré-conferência',
  PosConferencia: 'Pós-conferência',
}

const STATUS_CONCLUIDO_LABEL: Record<string, string> = {
  Aprovado: 'Aprovado',
  Reprovado: 'Não aprovado',
}

const STATUS_CONCLUIDO_CLASSE: Record<string, string> = {
  Aprovado: 'text-ok-fg',
  Reprovado: 'text-bad-fg',
}

type DistribuicaoProtocoloCardProps = {
  protocolo: ProtocoloResumo
  now: number
  /** Nome do dono — só faz sentido na aba "Por status" (coluna já é o dono na aba "Por conferente"). */
  donoNome?: string | null
}

// Card reaproveitado pelas abas "Por conferente" e "Por status" (RF-13/RF-14) — o card inteiro
// é pintado pela faixa do semáforo (SurfaceCard `tom`), igual Minha fila. Simplificação
// conhecida: sem nome de escrevente/equipe (ProtocoloResumo não carrega isso hoje, só
// escreventeId) e sem prioridade "Alta" (Protocolo.Prioridade não está exposto no DTO) — ver
// CLAUDE.md.
export const DistribuicaoProtocoloCard = ({ protocolo, now, donoNome }: DistribuicaoProtocoloCardProps) => {
  const emConferencia = protocolo.status === 'Conferindo' && protocolo.iniciadoEm
  const concluido = protocolo.status === 'Aprovado' || protocolo.status === 'Reprovado'
  const chip = prazoChip(protocolo.semaforo, protocolo.vencimentoEm, now)

  const meta = donoNome ? `${ETAPA_LABEL[protocolo.etapa]} · ${donoNome}` : ETAPA_LABEL[protocolo.etapa]

  return (
    <SurfaceCard tom={emConferencia ? undefined : chip.tom} destaque={!!emConferencia}>
      <div className="flex items-center justify-between gap-1.5">
        <span className="font-mono text-[12.5px] font-medium">{protocolo.numero}</span>
        {emConferencia && <span className="font-mono text-[11.5px] font-medium">{formatCronometro(now - new Date(protocolo.iniciadoEm!).getTime())}</span>}
        {!emConferencia && concluido && (
          <span className={`text-[11.5px] font-medium ${STATUS_CONCLUIDO_CLASSE[protocolo.status]}`}>{STATUS_CONCLUIDO_LABEL[protocolo.status]}</span>
        )}
        {!emConferencia && !concluido && <Chip tom={chip.tom}>{chip.label}</Chip>}
      </div>
      <div className="mt-1.5 truncate text-[11.5px] text-muted-foreground">{meta}</div>

      <ObservacaoField protocoloId={protocolo.id} observacao={protocolo.observacao} />
    </SurfaceCard>
  )
}
