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

// Aba "Por status" mostra o valor de tempo como texto simples colorido (sem pill) — mesma cor
// do Chip, sem o fundo/borda.
const TOM_TEXTO: Record<NonNullable<React.ComponentProps<typeof Chip>['tom']>, string> = {
  neutro: 'text-text-2',
  ok: 'text-ok-fg',
  atencao: 'text-warn-fg',
  critico: 'text-crit-fg',
  vencido: 'text-bad-fg',
}

type DistribuicaoProtocoloCardProps = {
  protocolo: ProtocoloResumo
  now: number
  /** Nome do dono — só faz sentido na aba "Por status" (coluna já é o dono na aba "Por conferente"). */
  donoNome?: string | null
  /**
   * "conferente": valor do prazo em chip/pill (protótipo, aba "Por conferente"). "status": texto
   * simples colorido, sem pill (protótipo, aba "Por status") — as duas abas usam o mesmo card,
   * mas o protótipo estiliza esse valor de jeito diferente em cada uma.
   */
  variant?: 'conferente' | 'status'
  /** RF-18a: clicar no card abre o painel de detalhe — mesmo card em qualquer aba. */
  onAbrirDetalhe?: (protocoloId: string) => void
}

// Card reaproveitado pelas abas "Por conferente" e "Por status" (RF-13/RF-14) — o card inteiro
// é pintado pela faixa do semáforo (SurfaceCard `tom`), igual Minha fila. Simplificações
// conscientes, todas por falta do dado no DTO (`ProtocoloResumo`), não por escolha de layout:
// sem linha de "tipo de ato" (só tem `tipoAtoId`, sem nome — precisaria de um `entities/tipoAto`
// que ainda não existe), sem nome de escrevente/equipe (só `escreventeId`), sem prioridade
// "Alta" (`Protocolo.Prioridade` não está exposto), e o canto de "Concluídos" mostra
// aprovado/não aprovado em vez do tempo de conferência (sem `ConcluidoEm` no DTO pra calcular
// duração) — ver CLAUDE.md.
export const DistribuicaoProtocoloCard = ({ protocolo, now, donoNome, variant = 'conferente', onAbrirDetalhe }: DistribuicaoProtocoloCardProps) => {
  const emConferencia = protocolo.status === 'Conferindo' && protocolo.iniciadoEm
  const concluido = protocolo.status === 'Aprovado' || protocolo.status === 'Reprovado'
  const chip = prazoChip(protocolo.semaforo, protocolo.vencimentoEm, now)
  // Protótipo trata protocolo concluído como card neutro (nem tinge de vermelho um aprovado só
  // porque o prazo dele já passou — a decisão já foi tomada, o semáforo deixou de importar).
  const tom = emConferencia || concluido ? undefined : chip.tom

  // Aba "Por status": protótipo mostra o dono (ou "sem dono"), nunca a etapa, nessa linha, e
  // completa com "· aprovado"/"· não aprovado" quando concluído. "Por conferente": a coluna já
  // é o dono, então essa linha mostra a etapa (aproximação da linha "escrevente · equipe ·
  // andamento · prazo" do protótipo — sem escrevente/equipe no DTO hoje, ver CLAUDE.md).
  const sufixoConcluido = concluido ? ` · ${STATUS_CONCLUIDO_LABEL[protocolo.status].toLowerCase()}` : ''
  const meta = variant === 'status' ? `${donoNome ?? 'sem dono'}${sufixoConcluido}` : ETAPA_LABEL[protocolo.etapa]

  return (
    <SurfaceCard
      tom={tom}
      destaque={!!emConferencia}
      onClick={() => onAbrirDetalhe?.(protocolo.id)}
      className={onAbrirDetalhe && 'cursor-pointer'}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="font-mono text-[12.5px] font-medium">{protocolo.numero}</span>
        {emConferencia && <span className="font-mono text-[11.5px] font-medium">{formatCronometro(now - new Date(protocolo.iniciadoEm!).getTime())}</span>}
        {!emConferencia && concluido && (
          <span className={`text-[11.5px] font-medium ${STATUS_CONCLUIDO_CLASSE[protocolo.status]}`}>{STATUS_CONCLUIDO_LABEL[protocolo.status]}</span>
        )}
        {!emConferencia &&
          !concluido &&
          (variant === 'status' ? (
            <span className={`font-mono text-[11.5px] font-medium ${TOM_TEXTO[chip.tom]}`}>{chip.label}</span>
          ) : (
            <Chip tom={chip.tom}>{chip.label}</Chip>
          ))}
      </div>
      {/* RNF-10: sem truncar — na variante "status" isso é o nome do dono do protocolo, dois
          donos com nome parecido não podem ficar indistinguíveis aqui. */}
      <div className="mt-1.5 text-[11.5px] text-pretty text-muted-foreground">{meta}</div>

      <ObservacaoField protocoloId={protocolo.id} observacao={protocolo.observacao} somenteLeitura />
    </SurfaceCard>
  )
}
