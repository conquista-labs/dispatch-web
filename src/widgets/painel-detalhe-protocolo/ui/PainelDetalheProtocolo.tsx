import { useState } from 'react'
import { toast } from 'sonner'

import { NIVEL_LABEL, useConferentes, type Conferente } from '@/entities/conferente'
import { useEquipes } from '@/entities/equipe'
import { useEscreventes } from '@/entities/escrevente'
import {
  criarResolverInfoProtocolo,
  ETAPA_LABEL,
  PRIORIDADE_LABEL,
  prazoChip,
  TIPO_PRAZO_LABEL,
  useDetalheProtocolo,
  type AlcadaConferente,
  type DetalheProtocolo,
  type StatusProtocolo,
} from '@/entities/protocolo'
import { fraseDaRegra, MOTIVO_ALCADA_LABEL, useRegrasAlcada } from '@/entities/regraAlcada'
import { useTiposAto } from '@/entities/tipoAto'
import { useAtribuirAoMenosCarregado } from '@/features/protocolo/atribuir-ao-menos-carregado'
import { useDevolverAoPool } from '@/features/protocolo/devolver-ao-pool'
import { ObservacaoField } from '@/features/protocolo/definir-observacao'
import { useDefinirPrioridade } from '@/features/protocolo/definir-prioridade'
import { useExcluirProtocolo } from '@/features/protocolo/excluir'
import { useReabrirConferencia } from '@/features/protocolo/reabrir-conferencia'
import { useRestaurarProtocolo } from '@/features/protocolo/restaurar'
import { formatDataHora } from '@/shared/lib/format'
import { useNow } from '@/shared/lib/use-now'
import { cn } from '@/shared/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import { Button } from '@/shared/ui/button'
import { Carregando } from '@/shared/ui/carregando'
import { Chip } from '@/shared/ui/chip'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet'
import { ProtocoloManualDialog } from '@/widgets/protocolo-manual'

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
  // RF-18i: painel fecha assim que a exclusão é confirmada (ver DistribuicaoBoard) — este
  // rótulo só existiria se alguém reabrisse o detalhe pelo id logo depois, janela mínima.
  Excluido: 'Excluído',
}

const STATUS_TOM: Record<StatusProtocolo, NonNullable<React.ComponentProps<typeof Chip>['tom']>> = {
  Pool: 'neutro',
  Atribuido: 'neutro',
  Conferindo: 'neutro',
  Aprovado: 'ok',
  Reprovado: 'vencido',
  Excecao: 'atencao',
  Descartado: 'neutro',
  Excluido: 'vencido',
}

// RF-18i: aviso condizente com o estado atual — em conferência interrompe quem está com o
// ato, atribuído tira da fila de alguém; nos demais estados não tem ninguém pra avisar.
// Extraída de um ternário aninhado dentro de template string (achado numa auditoria de
// qualidade) — mesma lógica, só mais fácil de ler com `if`s sequenciais.
const avisoDeExclusao = (detalhe: DetalheProtocolo | undefined, nomePorConferenteId: Map<string, string>): string | null => {
  if (!detalhe) return null
  if (detalhe.status === 'Conferindo') return 'Isso interrompe a conferência de quem está com esse ato agora.'
  if (detalhe.status === 'Atribuido') {
    const nomeDono = detalhe.donoId ? (nomePorConferenteId.get(detalhe.donoId) ?? 'quem está com ele') : 'quem está com ele'
    return `Isso tira o ato da fila de ${nomeDono}.`
  }
  return null
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

  const excluir = useExcluirProtocolo()
  const restaurar = useRestaurarProtocolo()
  const [editarAberto, setEditarAberto] = useState(false)
  const [confirmarExcluirAberto, setConfirmarExcluirAberto] = useState(false)

  const carregando = !detalhe || !conferentes || !tiposAto || !regras || !escreventes || !equipes

  // Extraído pra `entities/protocolo` — mesma lógica repetida em
  // DistribuicaoBoard/MinhaFilaBoard/FilaDoConferenteBoard. `nomePorConferenteId` fica fora do
  // hook (não é escrevente/equipe/tipoAto).
  const nomePorConferenteId = new Map((conferentes ?? []).map((c) => [c.id, c.nome]))
  const { escreventePorId, nomePorEquipeId, nomePorTipoAtoId } = criarResolverInfoProtocolo(escreventes, equipes, tiposAto)

  const escrevente = detalhe ? escreventePorId.get(detalhe.escreventeId) : undefined
  const equipeNome = escrevente?.equipeId ? nomePorEquipeId.get(escrevente.equipeId) : undefined
  const regraAplicada = detalhe?.regraAplicadaId ? (regras ?? []).find((r) => r.id === detalhe.regraAplicadaId) : undefined

  const chip = detalhe ? prazoChip(detalhe.semaforo, detalhe.vencimentoEm, now) : null

  const linhas = detalhe
    ? [
        { k: 'Etapa', v: ETAPA_LABEL[detalhe.etapa] },
        { k: 'Escrevente', v: escrevente?.nome ?? '—' },
        { k: 'Equipe', v: equipeNome ?? 'sem equipe' },
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
        { k: 'Prioridade', v: PRIORIDADE_LABEL[detalhe.prioridade] },
        { k: 'Dono', v: detalhe.donoId ? (nomePorConferenteId.get(detalhe.donoId) ?? '—') : 'sem dono' },
      ]
    : []

  const avisoExclusao = avisoDeExclusao(detalhe, nomePorConferenteId)

  const handleExcluir = () => {
    if (!detalhe) return
    const { id, numero } = detalhe
    excluir.mutate(id, {
      onSuccess: () => {
        setConfirmarExcluirAberto(false)
        onFechar()
        // RF-18j: desfazer por alguns segundos — restaura o mesmo vencimento/dono/histórico
        // (o back é soft-delete, nada além do status muda).
        toast(`Protocolo ${numero} excluído`, {
          action: { label: 'Desfazer', onClick: () => restaurar.mutate(id) },
          duration: 8000,
        })
      },
    })
  }

  return (
    <>
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
          {carregando && <Carregando />}

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
              <ListaAlcada alcada={detalhe.alcada} conferentes={conferentes ?? []} />

              <div className="mt-4.5 mb-2 font-mono text-[10.5px] tracking-[0.04em] text-muted-foreground">OBSERVAÇÃO</div>
              <ObservacaoField protocoloId={detalhe.id} observacao={detalhe.observacao} />

              <AcoesDeStatus detalhe={detalhe} />

              {/* RF-18g/i: separado das ações de status acima — editar/excluir valem pra
                  qualquer protocolo, não dependem do estado atual. */}
              <div className="mt-4.5 flex gap-1.5 border-t border-secondary pt-4.5">
                <Button variant="outline" size="sm" onClick={() => setEditarAberto(true)}>
                  Editar protocolo
                </Button>
                <Button variant="outline" size="sm" className="text-bad-fg hover:bg-bad-bg" onClick={() => setConfirmarExcluirAberto(true)}>
                  Excluir
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
      </Sheet>

      {detalhe && (
        <ProtocoloManualDialog
          aberto={editarAberto}
          onFechar={() => setEditarAberto(false)}
          protocoloParaEditar={detalhe}
          onPedirExclusao={() => {
            setEditarAberto(false)
            setConfirmarExcluirAberto(true)
          }}
        />
      )}

      <AlertDialog open={confirmarExcluirAberto} onOpenChange={setConfirmarExcluirAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir protocolo {detalhe?.numero}
              {detalhe && ` · ${nomePorTipoAtoId.get(detalhe.tipoAtoId ?? '') ?? detalhe.tipoAtoNomeOriginal ?? '—'}`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {avisoExclusao ? `${avisoExclusao} Essa ação não pode ser desfeita depois de fechar o aviso de "desfazer".` : 'Essa ação não pode ser desfeita depois de fechar o aviso de "desfazer".'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluir.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir} disabled={excluir.isPending} className="bg-bad-fg text-white hover:bg-bad-fg/90">
              {excluir.isPending ? 'Excluindo…' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

const LinhaDoTempo = ({ rotulo, quando }: { rotulo: string; quando: string | null }) => (
  <div className="flex items-baseline gap-2.5 py-1">
    <span className={cn('mt-1 block size-1.5 flex-none rounded-full', quando ? 'bg-foreground' : 'bg-border')} />
    <span className="w-[70px] flex-none text-xs text-text-2">{rotulo}</span>
    <span className={cn('flex-1 text-xs text-pretty', quando ? 'text-text-5' : 'text-muted-foreground')}>{quando ? formatDataHora(quando) : '—'}</span>
  </div>
)

// Extraído do corpo de PainelDetalheProtocolo (achado numa auditoria de qualidade — o
// componente principal fazia resolução de nomes, metadados, linha do tempo, alçada, ações e o
// diálogo de exclusão, tudo junto). "Ninguém na escala hoje" cobre tanto lista vazia quanto
// nenhum candidato elegível ter sido avaliado.
const ListaAlcada = ({ alcada, conferentes }: { alcada: AlcadaConferente[]; conferentes: Conferente[] }) => (
  <div className="flex flex-col gap-1.5">
    {alcada.map((a) => {
      const conferente = conferentes.find((c) => c.id === a.conferenteId)
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
            {conferente ? `Analista ${NIVEL_LABEL[conferente.nivel]}` : ''} ·{' '}
            {a.elegivel ? 'pode conferir' : (a.motivo ? MOTIVO_ALCADA_LABEL[a.motivo] : 'barrado')}
          </span>
        </div>
      )
    })}
    {alcada.length === 0 && <p className="text-[12.5px] text-muted-foreground">Ninguém na escala hoje.</p>}
  </div>
)

// Idem — os 4 botões de ação dependentes de status (cada um só faz sentido pra alguns status),
// mais o erro de "Atribuir ao menos carregado" (único que pode falhar de um jeito que vale a
// pena explicar: sem ninguém com alçada na escala). Cada mutation mora aqui dentro, não no
// componente pai — reduz o que PainelDetalheProtocolo precisa saber sobre essas 4 ações.
const AcoesDeStatus = ({ detalhe }: { detalhe: DetalheProtocolo }) => {
  const devolver = useDevolverAoPool()
  const atribuirMenosCarregado = useAtribuirAoMenosCarregado()
  const reabrirConferencia = useReabrirConferencia()
  const definirPrioridade = useDefinirPrioridade()

  const podeDevolverAoPool = detalhe.status === 'Atribuido'
  const podeAtribuirAoMenosCarregado = detalhe.status === 'Pool' || detalhe.status === 'Excecao'
  // RF-18a/RF-24c — ação direta, sem exigir um pedido explícito do conferente (esse fluxo
  // vive na seção "Pedidos de reabertura" da aba Exceções).
  const podeReabrirConferencia = detalhe.status === 'Aprovado' || detalhe.status === 'Reprovado'
  // A importação nunca marca prioridade alta (não vem no relatório) — este botão é o único
  // jeito real de um protocolo virar urgente. Não faz sentido depois de concluído/descartado.
  const podeDefinirPrioridade = !['Aprovado', 'Reprovado', 'Descartado'].includes(detalhe.status)

  if (!podeDevolverAoPool && !podeAtribuirAoMenosCarregado && !podeReabrirConferencia && !podeDefinirPrioridade) {
    return null
  }

  return (
    <>
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
        {podeDefinirPrioridade && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => definirPrioridade.mutate({ protocoloId: detalhe.id, prioridade: detalhe.prioridade === 'Alta' ? 'Normal' : 'Alta' })}
            disabled={definirPrioridade.isPending}
          >
            {detalhe.prioridade === 'Alta' ? 'Remover urgência' : 'Marcar como urgente'}
          </Button>
        )}
      </div>
      {atribuirMenosCarregado.isError && <p className="mt-2 text-[12.5px] text-bad-fg">Ninguém com alçada na escala agora.</p>}
    </>
  )
}
