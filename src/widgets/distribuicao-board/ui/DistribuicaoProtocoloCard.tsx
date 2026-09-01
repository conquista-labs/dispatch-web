import { prazoChip, type InfoProtocolo, type ProtocoloResumo } from '@/entities/protocolo'
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
  /** RF-14: tipo de ato/escrevente/equipe do card. */
  info: InfoProtocolo
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
// é pintado pela faixa do semáforo (SurfaceCard `tom`), igual Minha fila. RF-14 (tipo de
// ato/escrevente/equipe) fechado via `info`, resolvido no board (ver DistribuicaoBoard.tsx).
// Simplificação consciente que continua de fora: o canto de "Concluídos" mostra aprovado/não
// aprovado em vez do tempo de conferência (sem `ConcluidoEm` no DTO pra calcular duração).
export const DistribuicaoProtocoloCard = ({ protocolo, now, donoNome, info, variant = 'conferente', onAbrirDetalhe }: DistribuicaoProtocoloCardProps) => {
  const emConferencia = protocolo.status === 'Conferindo' && protocolo.iniciadoEm
  const concluido = protocolo.status === 'Aprovado' || protocolo.status === 'Reprovado'
  const chip = prazoChip(protocolo.semaforo, protocolo.vencimentoEm, now)
  // Protótipo trata protocolo concluído como card neutro (nem tinge de vermelho um aprovado só
  // porque o prazo dele já passou — a decisão já foi tomada, o semáforo deixou de importar).
  const tom = emConferencia || concluido ? undefined : chip.tom

  // Aba "Por status": protótipo mostra o dono (ou "sem dono") nessa linha, e completa com
  // "· aprovado"/"· não aprovado" quando concluído — a coluna já é o dono na aba "Por
  // conferente", que não repete essa linha (a etapa entra na linha de escrevente/equipe logo
  // abaixo, ver `linhaEscreventeEquipe`).
  const sufixoConcluido = concluido ? ` · ${STATUS_CONCLUIDO_LABEL[protocolo.status].toLowerCase()}` : ''
  const meta = variant === 'status' ? `${donoNome ?? 'sem dono'}${sufixoConcluido}` : null

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
      {/* RF-14: tipo de ato (font-size/cor batendo com `p.tipo` do protótipo — 12.5px,
          var(--text-5)), depois "escrevente · equipe · etapa" numa linha só, truncada com
          reticências igual `p.meta` no protótipo (font-size 11.5px, var(--muted),
          overflow/ellipsis/nowrap — confirmado direto no Dispatch.dc.html, não é aproximação).
          `title` guarda o texto completo (RNF-10 via tooltip nativo, já que aqui é uma linha
          densa combinando 3 campos, não uma lista cujo propósito é distinguir registros). A
          equipe fica em vermelho quando o escrevente não tem equipe definida. */}
      <div className="mt-1.5 text-[12.5px] text-text-5">{info.tipoAtoNome ?? '—'}</div>
      {/* RF-18a: "Alta" (não "urgente") — mesmo rótulo/cor do protótipo, e na MESMA linha da
          meta de escrevente/equipe/etapa, não na linha do número/prazo — lá só cabem número e
          o chip de prazo (confirmado direto no Dispatch.dc.html: `p.alta` fica junto de
          `p.meta`, não de `p.protocolo`/`p.prazoLabel`). Botar o badge de prioridade na linha
          de cima quebrava o card em telas de coluna estreita (achado ao vivo pelo dono). */}
      <div className="mt-0.5 flex items-center gap-1.5">
        {protocolo.prioridade === 'Alta' && (
          <span className="flex-none rounded-full border border-bad-border bg-bad-bg px-1.5 text-[10.5px] font-semibold text-bad-fg">Alta</span>
        )}
        <div
          className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] text-muted-foreground"
          title={`${info.escreventeNome ?? '—'} · ${info.equipeNome ?? 'sem equipe'}${variant === 'conferente' ? ` · ${ETAPA_LABEL[protocolo.etapa]}` : ''}`}
        >
          {info.escreventeNome ?? '—'} ·{' '}
          <span className={info.equipeNome ? undefined : 'text-bad-fg'}>{info.equipeNome ?? 'sem equipe'}</span>
          {variant === 'conferente' && <> · {ETAPA_LABEL[protocolo.etapa]}</>}
        </div>
      </div>
      {/* RNF-10: sem truncar — na variante "status" isso é o nome do dono do protocolo, dois
          donos com nome parecido não podem ficar indistinguíveis aqui. */}
      {meta && <div className="mt-1.5 text-[11.5px] text-pretty text-muted-foreground">{meta}</div>}

      <ObservacaoField protocoloId={protocolo.id} observacao={protocolo.observacao} somenteLeitura />
    </SurfaceCard>
  )
}
