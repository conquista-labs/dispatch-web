import { NIVEL_LABEL, useConferentes } from '@/entities/conferente'
import { useEquipes } from '@/entities/equipe'
import { useEscreventes } from '@/entities/escrevente'
import { ETAPA_LABEL, prazoChip, TIPO_PRAZO_LABEL, useDetalheProtocolo, type StatusProtocolo } from '@/entities/protocolo'
import { fraseDaRegra, useRegrasAlcada } from '@/entities/regraAlcada'
import { useTiposAto } from '@/entities/tipoAto'
import { useAtribuirAoMenosCarregado } from '@/features/protocolo/atribuir-ao-menos-carregado'
import { useDevolverAoPool } from '@/features/protocolo/devolver-ao-pool'
import { ObservacaoField } from '@/features/protocolo/definir-observacao'
import { useReabrirConferencia } from '@/features/protocolo/reabrir-conferencia'
import { formatDataHora } from '@/shared/lib/format'
import { useNow } from '@/shared/lib/use-now'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Chip } from '@/shared/ui/chip'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet'

type PainelDetalheProtocoloProps = {
  protocoloId: string | null
  onFechar: () => void
}

const STATUS_LABEL: Record<StatusProtocolo, string> = {
  Pool: 'No pool',
  Atribuido: 'Atribuído',
  Conferindo: 'Em conferência',
  Aprovado: 'Aprovado',
  Reprovado: 'Não aprovado',
  Excecao: 'Exceção',
  Descartado: 'Descartado',
}

const STATUS_TOM: Record<StatusProtocolo, NonNullable<React.ComponentProps<typeof Chip>['tom']>> = {
  Pool: 'neutro',
  Atribuido: 'neutro',
  Conferindo: 'neutro',
  Aprovado: 'ok',
  Reprovado: 'vencido',
  Excecao: 'atencao',
  Descartado: 'neutro',
}

// RF-18a/b — drawer lateral, aberto ao clicar em qualquer card de protocolo em Distribuição.
// `Sheet` do shadcn (Radix Dialog por baixo) já resolve animação de entrada/saída, overlay e
// fechar por Esc/clique fora — nenhuma dessas três coisas precisa de código próprio aqui.
// Reaproveita ObservacaoField (mesmo campo de Minha fila/Distribuição) e fraseDaRegra (Central
// de Regras).
export const PainelDetalheProtocolo = ({ protocoloId, onFechar }: PainelDetalheProtocoloProps) => {
  // O painel fica montado o tempo todo em Distribuição (só o Sheet abre/fecha visualmente —
  // ver DistribuicaoBoard.tsx), então sem `enabled: !!protocoloId` essas 5 buscas disparariam
  // sempre que a tela carrega, painel aberto ou não. `useDetalheProtocolo` já tinha essa
  // guarda; as outras 4 ganharam agora (achado de auditoria de over-fetching).
  const estaAberto = !!protocoloId
  const { data: detalhe } = useDetalheProtocolo(protocoloId)
  const { data: conferentes } = useConferentes({ enabled: estaAberto })
  const { data: tiposAto } = useTiposAto({ enabled: estaAberto })
  const { data: regras } = useRegrasAlcada({ enabled: estaAberto })
  const { data: escreventes } = useEscreventes({ enabled: estaAberto })
  const { data: equipes } = useEquipes({ enabled: estaAberto })
  const now = useNow()

  const devolver = useDevolverAoPool()
  const atribuirMenosCarregado = useAtribuirAoMenosCarregado()
  const reabrirConferencia = useReabrirConferencia()

  const carregando = !detalhe || !conferentes || !tiposAto || !regras || !escreventes || !equipes

  const nomePorConferenteId = new Map((conferentes ?? []).map((c) => [c.id, c.nome]))
  const nomePorTipoAtoId = new Map((tiposAto ?? []).map((t) => [t.id, t.nome]))
  const nomePorEquipeId = new Map((equipes ?? []).map((e) => [e.id, e.nome]))
  const escreventePorId = new Map((escreventes ?? []).map((e) => [e.id, e]))
  const equipePorId = new Map((equipes ?? []).map((e) => [e.id, e]))

  const escrevente = detalhe ? escreventePorId.get(detalhe.escreventeId) : undefined
  const equipe = escrevente?.equipeId ? equipePorId.get(escrevente.equipeId) : undefined
  const regraAplicada = detalhe?.regraAplicadaId ? (regras ?? []).find((r) => r.id === detalhe.regraAplicadaId) : undefined

  const chip = detalhe ? prazoChip(detalhe.semaforo, detalhe.vencimentoEm, now) : null

  const linhas = detalhe
    ? [
        { k: 'Etapa', v: ETAPA_LABEL[detalhe.etapa] },
        { k: 'Escrevente', v: escrevente?.nome ?? '—' },
        { k: 'Equipe', v: equipe?.nome ?? 'sem equipe' },
        { k: 'Prazo', v: detalhe.prazo ? TIPO_PRAZO_LABEL[detalhe.prazo] : '—' },
        {
          k: 'Regra aplicada',
          v: regraAplicada
            ? fraseDaRegra(regraAplicada, {
                nomeConferente: (id) => nomePorConferenteId.get(id) ?? '—',
                nomeTipoAto: (id) => nomePorTipoAtoId.get(id) ?? '—',
                nomeEquipe: (id) => nomePorEquipeId.get(id) ?? '—',
              })
            : 'padrão aberto',
        },
        { k: 'Vencimento', v: detalhe.vencimentoEm ? formatDataHora(detalhe.vencimentoEm) : '—' },
        { k: 'Prioridade', v: detalhe.prioridade === 'Alta' ? 'Alta' : 'Normal' },
        { k: 'Dono', v: detalhe.donoId ? (nomePorConferenteId.get(detalhe.donoId) ?? '—') : 'sem dono' },
      ]
    : []

  const podeDevolverAoPool = detalhe?.status === 'Atribuido'
  const podeAtribuirAoMenosCarregado = detalhe?.status === 'Pool' || detalhe?.status === 'Excecao'
  // RF-18a/RF-24c — ação direta, sem exigir um pedido explícito do conferente (esse fluxo
  // vive na seção "Pedidos de reabertura" da aba Exceções).
  const podeReabrirConferencia = detalhe?.status === 'Aprovado' || detalhe?.status === 'Reprovado'

  return (
    <Sheet open={!!protocoloId} onOpenChange={(aberto) => !aberto && onFechar()}>
      <SheetContent side="right" showCloseButton={false} className="w-[min(432px,92vw)] gap-0 overflow-y-auto p-0 sm:max-w-[432px]">
        <SheetHeader className="sticky top-0 z-10 flex-row items-start justify-between gap-3 space-y-0 border-b border-border bg-background p-5">
          <div className="min-w-0">
            <SheetTitle className="font-mono text-[17px] font-semibold tracking-[-0.01em]">{detalhe?.numero ?? '…'}</SheetTitle>
            {/* RNF-10: nome do tipo de ato não trunca */}
            <SheetDescription className="mt-0.5 text-[12.5px] text-pretty">
              {detalhe ? (nomePorTipoAtoId.get(detalhe.tipoAtoId ?? '') ?? detalhe.tipoAtoNomeOriginal ?? '—') : ''}
            </SheetDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onFechar}>
            Fechar
          </Button>
        </SheetHeader>

        <div className="px-5 py-4">
          {carregando && <p className="text-[13.5px] text-muted-foreground">Carregando…</p>}

          {!carregando && detalhe && chip && (
            <>
              <div className="flex flex-wrap gap-1.5">
                <Chip tom={STATUS_TOM[detalhe.status]}>{STATUS_LABEL[detalhe.status]}</Chip>
                <Chip tom={chip.tom}>{chip.label}</Chip>
              </div>

              {detalhe.motivoExcecao && (
                <div className="mt-3 rounded-[9px] border border-bad-border bg-bad-bg p-2.5 text-xs leading-relaxed text-bad-fg text-pretty">
                  {detalhe.motivoExcecao}
                </div>
              )}

              <div className="mt-4 rounded-[10px] border border-border bg-card px-3.5">
                {linhas.map((linha) => (
                  <div key={linha.k} className="flex items-baseline justify-between gap-3.5 border-t border-secondary py-2 first:border-t-0">
                    <span className="flex-none text-xs text-text-2">{linha.k}</span>
                    <span className="text-right text-[12.5px] text-text-5 text-pretty">{linha.v}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4.5 mb-2 font-mono text-[10.5px] tracking-[0.04em] text-muted-foreground">LINHA DO TEMPO</div>
              <div className="rounded-[10px] border border-border bg-card p-3">
                <LinhaDoTempo rotulo="Andamento" quando={detalhe.andamentoEm} />
                <LinhaDoTempo rotulo="Atribuído" quando={detalhe.atribuidoEm} />
                <LinhaDoTempo rotulo="Iniciado" quando={detalhe.iniciadoEm} />
                <LinhaDoTempo rotulo="Concluído" quando={detalhe.concluidoEm} />
                <LinhaDoTempo rotulo="Corrigido" quando={detalhe.corrigidoEm} />
                <LinhaDoTempo rotulo="Reaberto" quando={detalhe.reabertoEm} />
              </div>

              <div className="mt-4.5 mb-2 font-mono text-[10.5px] tracking-[0.04em] text-muted-foreground">QUEM PODE CONFERIR ESTE ATO</div>
              <div className="flex flex-col gap-1.5">
                {detalhe.alcada.map((a) => {
                  const conferente = (conferentes ?? []).find((c) => c.id === a.conferenteId)
                  return (
                    <div
                      key={a.conferenteId}
                      className={cn(
                        'flex items-center justify-between gap-2.5 rounded-lg border px-2.5 py-1.5',
                        a.elegivel ? 'border-ok-border bg-ok-bg' : 'border-bad-border-2 bg-bad-bg',
                      )}
                    >
                      <span className="text-[12.5px] text-text-5">{conferente?.nome ?? '—'}</span>
                      <span className={cn('text-right text-[11px]', a.elegivel ? 'text-ok-fg' : 'text-bad-fg')}>
                        {conferente ? `Analista ${NIVEL_LABEL[conferente.nivel]}` : ''} · {a.elegivel ? 'pode conferir' : 'barrado'}
                      </span>
                    </div>
                  )
                })}
                {detalhe.alcada.length === 0 && <p className="text-[12.5px] text-muted-foreground">Ninguém na escala hoje.</p>}
              </div>

              <div className="mt-4.5 mb-2 font-mono text-[10.5px] tracking-[0.04em] text-muted-foreground">OBSERVAÇÃO</div>
              <ObservacaoField protocoloId={detalhe.id} observacao={detalhe.observacao} />

              {(podeDevolverAoPool || podeAtribuirAoMenosCarregado || podeReabrirConferencia) && (
                <div className="mt-4.5 flex flex-wrap gap-1.5">
                  {podeDevolverAoPool && (
                    <Button variant="outline" size="sm" onClick={() => devolver.mutate(detalhe.id)} disabled={devolver.isPending}>
                      Devolver ao pool
                    </Button>
                  )}
                  {podeAtribuirAoMenosCarregado && (
                    <Button variant="outline" size="sm" onClick={() => atribuirMenosCarregado.mutate(detalhe.id)} disabled={atribuirMenosCarregado.isPending}>
                      Atribuir ao menos carregado
                    </Button>
                  )}
                  {podeReabrirConferencia && (
                    <Button variant="outline" size="sm" onClick={() => reabrirConferencia.mutate(detalhe.id)} disabled={reabrirConferencia.isPending}>
                      Reabrir conferência
                    </Button>
                  )}
                </div>
              )}
              {atribuirMenosCarregado.isError && <p className="mt-2 text-[12.5px] text-bad-fg">Ninguém com alçada na escala agora.</p>}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

const LinhaDoTempo = ({ rotulo, quando }: { rotulo: string; quando: string | null }) => (
  <div className="flex items-baseline gap-2.5 py-1">
    <span className={cn('mt-1 block size-1.5 flex-none rounded-full', quando ? 'bg-foreground' : 'bg-border')} />
    <span className="w-[70px] flex-none text-xs text-text-2">{rotulo}</span>
    <span className={cn('flex-1 text-xs text-pretty', quando ? 'text-text-5' : 'text-muted-foreground')}>{quando ? formatDataHora(quando) : '—'}</span>
  </div>
)
