import { useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { toast } from 'sonner'

import { NIVEL_LABEL, useConferentes, type Conferente } from '@/entities/conferente'
import { useEquipes } from '@/entities/equipe'
import { useEscreventes } from '@/entities/escrevente'
import {
  criarResolverInfoProtocolo,
  ETAPA_LABEL,
  NumeroConferenciaTag,
  PRIORIDADE_LABEL,
  prazoChip,
  PrazoTooltip,
  TIPO_PRAZO_LABEL,
  useDetalheProtocolo,
  type AjusteDeDuracao,
  type AlcadaConferente,
  type DetalheProtocolo,
  type HistoricoConferencia,
  type PausaConferencia,
  type StatusProtocolo,
} from '@/entities/protocolo'
import { fraseDaRegra, MOTIVO_ALCADA_LABEL, useRegrasAlcada } from '@/entities/regraAlcada'
import { useTiposAto } from '@/entities/tipoAto'
import { useAjustarDuracao } from '@/features/protocolo/ajustar-duracao'
import { useAtribuirAoMenosCarregado } from '@/features/protocolo/atribuir-ao-menos-carregado'
import { useAtribuirManualmente } from '@/features/protocolo/atribuir-manualmente'
import { useDevolverAoPool } from '@/features/protocolo/devolver-ao-pool'
import { ObservacaoField } from '@/features/protocolo/definir-observacao'
import { useDefinirPrioridade } from '@/features/protocolo/definir-prioridade'
import { useExcluirProtocolo } from '@/features/protocolo/excluir'
import { useReabrirConferencia } from '@/features/protocolo/reabrir-conferencia'
import { useRestaurarProtocolo } from '@/features/protocolo/restaurar'
import {
  formatDataHora,
  formatDuracaoConcluida,
  formatDuracaoCurta,
  parseDuracaoParaMinutos,
} from '@/shared/lib/format'
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible'
import { Input } from '@/shared/ui/input'
import { SeletorUnico } from '@/shared/ui/seletor-unico'
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
const avisoDeExclusao = (
  detalhe: DetalheProtocolo | undefined,
  nomePorConferenteId: Map<string, string>,
): string | null => {
  if (!detalhe) return null
  if (detalhe.status === 'Conferindo') return 'Isso interrompe a conferência de quem está com esse ato agora.'
  if (detalhe.status === 'Atribuido') {
    const nomeDono = detalhe.donoId
      ? (nomePorConferenteId.get(detalhe.donoId) ?? 'quem está com ele')
      : 'quem está com ele'
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
  const { escreventePorId, nomePorEquipeId, nomePorTipoAtoId } = criarResolverInfoProtocolo(
    escreventes,
    equipes,
    tiposAto,
  )

  const escrevente = detalhe ? escreventePorId.get(detalhe.escreventeId) : undefined
  const equipeNome = escrevente?.equipeId ? nomePorEquipeId.get(escrevente.equipeId) : undefined
  const regraAplicada = detalhe?.regraAplicadaId
    ? (regras ?? []).find((r) => r.id === detalhe.regraAplicadaId)
    : undefined

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
        // Só existe depois de concluído (Duracao no Domain exige IniciadoEm+ConcluidoEm) —
        // mesma regra de nulidade que já vale pros outros campos condicionais desta lista.
        ...(detalhe.duracao ? [{ k: 'Duração', v: formatDuracaoConcluida(detalhe.duracao) }] : []),
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
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-[min(432px,92vw)] gap-0 overflow-y-auto p-0 sm:max-w-[432px]"
        >
          <SheetHeader className="sticky top-0 z-10 flex-row items-start justify-between gap-3 space-y-0 border-b border-border bg-background p-5">
            <div className="min-w-0">
              <SheetTitle className="font-mono text-[17px] font-semibold tracking-[-0.01em]">
                {detalhe?.numero ?? '…'}
              </SheetTitle>
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
                  <PrazoTooltip>
                    <Chip tom={chip.tom}>{chip.label}</Chip>
                  </PrazoTooltip>
                  <NumeroConferenciaTag numero={detalhe.numeroDaConferencia} />
                </div>

                {detalhe.motivoExcecao && (
                  <div className="mt-3 rounded-[9px] border border-bad-border bg-bad-bg p-2.5 text-xs leading-relaxed text-pretty text-bad-fg">
                    {detalhe.motivoExcecao}
                  </div>
                )}

                <div className="mt-4 rounded-[10px] border border-border bg-card px-3.5">
                  {linhas.map((linha) => (
                    <div
                      key={linha.k}
                      className="flex items-baseline justify-between gap-3.5 border-t border-secondary py-2 first:border-t-0"
                    >
                      <span className="flex-none text-xs text-text-2">{linha.k}</span>
                      <span className="text-right text-[12.5px] text-pretty text-text-5">{linha.v}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4.5 mb-2 font-mono text-[10.5px] tracking-[0.04em] text-muted-foreground">
                  LINHA DO TEMPO
                </div>
                <div className="rounded-[10px] border border-border bg-card p-3">
                  <LinhaDoTempo rotulo="Andamento" quando={detalhe.andamentoEm} />
                  <LinhaDoTempo rotulo="Atribuído" quando={detalhe.atribuidoEm} />
                  <LinhaDoTempo rotulo="Iniciado" quando={detalhe.iniciadoEm} />
                  <LinhaDoTempo rotulo="Concluído" quando={detalhe.concluidoEm} />
                  <LinhaDoTempo rotulo="Corrigido" quando={detalhe.corrigidoEm} />
                  <LinhaDoTempo rotulo="Reaberto" quando={detalhe.reabertoEm} />
                  <LinhaDoTempo rotulo="Pausado" quando={detalhe.pausadoEm} />
                </div>

                <BlocoHistorico detalhe={detalhe} nomePorConferenteId={nomePorConferenteId} />

                <div className="mt-4.5 mb-2 font-mono text-[10.5px] tracking-[0.04em] text-muted-foreground">
                  QUEM PODE CONFERIR ESTE ATO
                </div>
                <ListaAlcada alcada={detalhe.alcada} conferentes={conferentes ?? []} />

                <div className="mt-4.5 mb-2 font-mono text-[10.5px] tracking-[0.04em] text-muted-foreground">
                  OBSERVAÇÃO
                </div>
                <ObservacaoField protocoloId={detalhe.id} observacao={detalhe.observacao} />

                <AcoesDeStatus detalhe={detalhe} conferentes={conferentes ?? []} />

                {/* RF-18g/i: separado das ações de status acima — editar/excluir valem pra
                  qualquer protocolo, não dependem do estado atual. */}
                <div className="mt-4.5 flex gap-1.5 border-t border-secondary pt-4.5">
                  <Button variant="outline" size="sm" onClick={() => setEditarAberto(true)}>
                    Editar protocolo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-bad-fg hover:bg-bad-bg"
                    onClick={() => setConfirmarExcluirAberto(true)}
                  >
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
              {avisoExclusao
                ? `${avisoExclusao} Essa ação não pode ser desfeita depois de fechar o aviso de "desfazer".`
                : 'Essa ação não pode ser desfeita depois de fechar o aviso de "desfazer".'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluir.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluir}
              disabled={excluir.isPending}
              className="bg-bad-fg text-white hover:bg-bad-fg/90"
            >
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
    <span className={cn('flex-1 text-xs text-pretty', quando ? 'text-text-5' : 'text-muted-foreground')}>
      {quando ? formatDataHora(quando) : '—'}
    </span>
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
            {a.elegivel ? 'pode conferir' : a.motivo ? MOTIVO_ALCADA_LABEL[a.motivo] : 'barrado'}
          </span>
        </div>
      )
    })}
    {alcada.length === 0 && <p className="text-[12.5px] text-muted-foreground">Ninguém na escala hoje.</p>}
  </div>
)

// Pedido do dono ("esse painel já tá ficando grande demais não?") — agrupa as 3 seções de
// auditoria (histórico de conferências, pausas, ajustes de duração) num único bloco recolhível,
// fechado por padrão: quem só quer ver status/prazo/dono não precisa rolar por elas; quem quer
// auditar expande. Some inteiro quando não há nada pra mostrar nas 3 (mesmo critério que cada
// seção já usava sozinha).
const BlocoHistorico = ({
  detalhe,
  nomePorConferenteId,
}: {
  detalhe: DetalheProtocolo
  nomePorConferenteId: Map<string, string>
}) => {
  const [aberto, setAberto] = useState(false)
  const total = detalhe.historicoConferencias.length + detalhe.pausas.length + detalhe.ajustesDeDuracao.length
  if (total === 0) return null

  return (
    <Collapsible open={aberto} onOpenChange={setAberto} className="mt-4.5">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 py-1">
        <span className="font-mono text-[10.5px] tracking-[0.04em] text-muted-foreground">HISTÓRICO · {total}</span>
        <ChevronDownIcon
          className={cn('size-3.5 text-muted-foreground transition-transform', aberto && 'rotate-180')}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-4">
        {detalhe.historicoConferencias.length > 0 && (
          <div>
            <div className="mt-2 mb-2 font-mono text-[10.5px] tracking-[0.04em] text-muted-foreground">
              CONFERÊNCIAS ANTERIORES
            </div>
            <HistoricoConferencias
              historico={detalhe.historicoConferencias}
              nomePorConferenteId={nomePorConferenteId}
            />
          </div>
        )}
        {detalhe.pausas.length > 0 && (
          <div>
            <div className="mt-2 mb-2 font-mono text-[10.5px] tracking-[0.04em] text-muted-foreground">PAUSAS</div>
            <HistoricoDePausas pausas={detalhe.pausas} />
          </div>
        )}
        {detalhe.ajustesDeDuracao.length > 0 && (
          <div>
            <div className="mt-2 mb-2 font-mono text-[10.5px] tracking-[0.04em] text-muted-foreground">
              AJUSTES DE DURAÇÃO
            </div>
            <HistoricoDeAjustesDeDuracao ajustes={detalhe.ajustesDeDuracao} />
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

// Continuidade de conferência (pedido do dono, não é RF numerado nem está no protótipo
// aprovado — ver dispatch-api/docs/decisions/0022-continuidade-de-conferencia.md): outras linhas
// com o mesmo Número, mais recente
// primeiro. Só renderizada pelo pai quando existe pelo menos uma (protocolo sem histórico não
// mostra a seção, igual `motivoExcecao` só aparece quando existe). Mesmo padrão visual de
// `ListaAlcada` — nome à esquerda, status + data à direita — reaproveitando STATUS_LABEL/
// STATUS_TOM já definidos neste arquivo.
const HistoricoConferencias = ({
  historico,
  nomePorConferenteId,
}: {
  historico: HistoricoConferencia[]
  nomePorConferenteId: Map<string, string>
}) => (
  <div className="flex flex-col gap-1.5">
    {historico.map((h) => (
      <div
        key={h.protocoloId}
        className="flex items-start justify-between gap-2.5 rounded-lg border border-border bg-card px-2.5 py-1.5"
      >
        <div className="min-w-0">
          <div className="text-[12.5px] text-text-5">
            {h.donoId ? (nomePorConferenteId.get(h.donoId) ?? '—') : 'sem dono'}
          </div>
          {/* RF-24k: a rodada daquela linha e, se ela foi reprovada, o motivo — a observação da
              própria linha (decisão do dono: o "Não aprovar" não pede motivo à parte). */}
          <div className="mt-px text-[11.5px] text-pretty text-muted-foreground">
            {h.numeroDaConferencia}ª conferência
            {h.status === 'Reprovado' && h.observacao ? ` — ${h.observacao}` : ''}
          </div>
        </div>
        <span className="mt-0.5 flex flex-none items-center gap-1.5">
          <Chip tom={STATUS_TOM[h.status]}>{STATUS_LABEL[h.status]}</Chip>
          <span className="text-[11px] text-muted-foreground">{formatDataHora(h.andamentoEm)}</span>
        </span>
      </div>
    ))}
  </div>
)

// Visibilidade da pausa (pedido do dono, "como garantir que ninguém abusa da pausa pra melhorar
// o próprio tempo?" — ver dispatch-api/docs/decisions/0033-pausar-conferencia.md): não bloqueia
// nada, só
// deixa auditável quantas vezes e por quanto tempo o ato ficou pausado. Mesmo padrão visual de
// `HistoricoConferencias` (lista de cards), com um resumo na primeira linha.
const HistoricoDePausas = ({ pausas }: { pausas: PausaConferencia[] }) => {
  const totalMs = pausas.reduce(
    (soma, p) => soma + (new Date(p.retomadoEm).getTime() - new Date(p.pausadoEm).getTime()),
    0,
  )
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11.5px] text-muted-foreground">
        {pausas.length} {pausas.length === 1 ? 'pausa' : 'pausas'} · {formatDuracaoCurta(totalMs)} no total
      </span>
      {pausas.map((p) => (
        <div
          key={p.pausadoEm}
          className="flex items-center justify-between gap-2.5 rounded-lg border border-border bg-card px-2.5 py-1.5"
        >
          <span className="text-[11px] text-muted-foreground">
            {formatDataHora(p.pausadoEm)} → {formatDataHora(p.retomadoEm)}
          </span>
          <span className="text-[11px] font-medium text-text-5">{formatDuracaoConcluida(p.duracao)}</span>
        </div>
      ))}
    </div>
  )
}

// Pedido do dono ("como distribuidora e admin, quero editar o tempo de conferência de um
// protocolo") — histórico auditável (RNF-02), sempre visível pra quem abre o painel. Nome de
// quem ajustou já vem resolvido do back (AjustadoPorId é sempre uma Distribuidora, não
// necessariamente alguém na lista de Conferentes que o front carrega — ver entities/protocolo).
// Mesmo padrão visual de HistoricoDePausas (resumo + lista de cards).
const HistoricoDeAjustesDeDuracao = ({ ajustes }: { ajustes: AjusteDeDuracao[] }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-[11.5px] text-muted-foreground">
      {ajustes.length} {ajustes.length === 1 ? 'ajuste' : 'ajustes'}
    </span>
    {ajustes.map((a) => (
      <div key={a.ajustadoEm} className="flex flex-col gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5">
        <div className="flex items-center justify-between gap-2.5">
          <span className="text-[11px] text-muted-foreground">
            {a.ajustadoPorNome} · {formatDataHora(a.ajustadoEm)}
          </span>
          <span className="text-[11px] font-medium text-text-5">
            {a.duracaoAnterior ? formatDuracaoConcluida(a.duracaoAnterior) : '—'} →{' '}
            {formatDuracaoConcluida(a.duracaoNova)}
          </span>
        </div>
        {a.motivo && <span className="text-[12.5px] text-pretty text-text-5">{a.motivo}</span>}
      </div>
    ))}
  </div>
)

// Idem — os botões de ação dependentes de status (cada um só faz sentido pra alguns status),
// mais o erro de "Atribuir ao menos carregado" (único que pode falhar de um jeito que vale a
// pena explicar: sem ninguém com alçada na escala). Cada mutation mora aqui dentro, não no
// componente pai — reduz o que PainelDetalheProtocolo precisa saber sobre essas ações.
const AcoesDeStatus = ({ detalhe, conferentes }: { detalhe: DetalheProtocolo; conferentes: Conferente[] }) => {
  const devolver = useDevolverAoPool()
  const atribuirMenosCarregado = useAtribuirAoMenosCarregado()
  const atribuirManualmente = useAtribuirManualmente()
  const reabrirConferencia = useReabrirConferencia()
  const definirPrioridade = useDefinirPrioridade()
  const ajustarDuracao = useAjustarDuracao()
  const [atribuindo, setAtribuindo] = useState(false)
  const [conferenteEscolhidoId, setConferenteEscolhidoId] = useState('')
  const [ajustandoDuracao, setAjustandoDuracao] = useState(false)
  const [duracaoMinutos, setDuracaoMinutos] = useState('')
  const [motivoAjuste, setMotivoAjuste] = useState('')

  const podeDevolverAoPool = detalhe.status === 'Atribuido'
  const podeAtribuirAoMenosCarregado = detalhe.status === 'Pool' || detalhe.status === 'Excecao'
  // Pedido do dono: mandar um ato pra um conferente escolhido na mão — sem checagem de alçada
  // (decisão humana deliberada, mesmo padrão já usado pra resolver exceção, RF-17). Além de
  // Pool/Exceção, também vale pra um protocolo já Atribuido — redireciona direto pra outra
  // pessoa sem precisar devolver ao pool antes. Não vale em Conferindo (interromperia trabalho
  // já em andamento) nem em status concluído/descartado/excluído.
  const podeAtribuirManualmente = ['Pool', 'Excecao', 'Atribuido'].includes(detalhe.status)
  // RF-18a/RF-24c — ação direta, sem exigir um pedido explícito do conferente (esse fluxo
  // vive na seção "Pedidos de reabertura" da aba Exceções).
  const podeReabrirConferencia = detalhe.status === 'Aprovado' || detalhe.status === 'Reprovado'
  // A importação nunca marca prioridade alta (não vem no relatório) — este botão é o único
  // jeito real de um protocolo virar urgente. Não faz sentido depois de concluído/descartado.
  const podeDefinirPrioridade = !['Aprovado', 'Reprovado', 'Descartado'].includes(detalhe.status)
  // Pedido do dono ("como distribuidora e admin, quero editar o tempo de conferência") — só faz
  // sentido pra um protocolo que já tem uma Duracao de verdade pra corrigir (mesma guarda do
  // caso de uso no back, AjustarDuracaoProtocolo).
  const podeAjustarDuracao = detalhe.status === 'Aprovado' || detalhe.status === 'Reprovado'

  const handleConfirmarAtribuicao = () => {
    if (!conferenteEscolhidoId) return
    atribuirManualmente.mutate(
      { protocoloId: detalhe.id, conferenteId: conferenteEscolhidoId },
      { onSuccess: () => setAtribuindo(false) },
    )
  }

  const handleAbrirAjusteDuracao = () => {
    setDuracaoMinutos(detalhe.duracao ? String(parseDuracaoParaMinutos(detalhe.duracao)) : '')
    setMotivoAjuste('')
    setAjustandoDuracao(true)
  }

  const handleConfirmarAjusteDuracao = () => {
    const minutos = Number(duracaoMinutos)
    if (!Number.isFinite(minutos) || minutos < 0) return
    ajustarDuracao.mutate(
      { protocoloId: detalhe.id, duracaoMinutos: minutos, motivo: motivoAjuste.trim() || null },
      { onSuccess: () => setAjustandoDuracao(false) },
    )
  }

  // RNF-11: mesmo seletor com busca já usado em todo canto que escolhe um conferente/tipo/
  // equipe (ex.: ProtocoloManualDialog) — o Select puro do shadcn (sem busca) destoava do
  // resto do app (achado pelo dono comparando os dois lado a lado).
  const conferenteOpcoes = conferentes.map((c) => ({ valor: c.id, label: c.nome, sub: NIVEL_LABEL[c.nivel] }))

  if (
    !podeDevolverAoPool &&
    !podeAtribuirAoMenosCarregado &&
    !podeAtribuirManualmente &&
    !podeReabrirConferencia &&
    !podeDefinirPrioridade &&
    !podeAjustarDuracao
  ) {
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => atribuirMenosCarregado.mutate(detalhe.id)}
            disabled={atribuirMenosCarregado.isPending}
          >
            Atribuir ao menos carregado
          </Button>
        )}
        {podeAtribuirManualmente && !atribuindo && (
          <Button variant="outline" size="sm" onClick={() => setAtribuindo(true)}>
            {detalhe.status === 'Atribuido' ? 'Reatribuir a…' : 'Atribuir a…'}
          </Button>
        )}
        {podeReabrirConferencia && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => reabrirConferencia.mutate(detalhe.id)}
            disabled={reabrirConferencia.isPending}
          >
            Reabrir conferência
          </Button>
        )}
        {podeDefinirPrioridade && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              definirPrioridade.mutate({
                protocoloId: detalhe.id,
                prioridade: detalhe.prioridade === 'Alta' ? 'Normal' : 'Alta',
              })
            }
            disabled={definirPrioridade.isPending}
          >
            {detalhe.prioridade === 'Alta' ? 'Remover urgência' : 'Marcar como urgente'}
          </Button>
        )}
        {podeAjustarDuracao && !ajustandoDuracao && (
          <Button variant="outline" size="sm" onClick={handleAbrirAjusteDuracao}>
            Editar tempo de conferência
          </Button>
        )}
      </div>
      {podeAtribuirManualmente && atribuindo && (
        <div className="mt-2 flex items-center gap-1.5">
          <SeletorUnico
            valor={conferenteEscolhidoId}
            opcoes={conferenteOpcoes}
            onSelecionar={setConferenteEscolhidoId}
            placeholder="buscar conferente…"
          />
          <Button variant="outline" size="sm" onClick={() => setAtribuindo(false)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleConfirmarAtribuicao}
            disabled={!conferenteEscolhidoId || atribuirManualmente.isPending}
          >
            Confirmar
          </Button>
        </div>
      )}
      {podeAjustarDuracao && ajustandoDuracao && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Input
            type="number"
            min={0}
            value={duracaoMinutos}
            onChange={(e) => setDuracaoMinutos(e.target.value)}
            placeholder="minutos"
            className="w-24"
          />
          <Input
            value={motivoAjuste}
            onChange={(e) => setMotivoAjuste(e.target.value)}
            placeholder="motivo (opcional)"
            className="min-w-[160px] flex-1"
          />
          <Button variant="outline" size="sm" onClick={() => setAjustandoDuracao(false)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleConfirmarAjusteDuracao}
            disabled={!duracaoMinutos || ajustarDuracao.isPending}
          >
            Confirmar
          </Button>
        </div>
      )}
      {atribuirMenosCarregado.isError && (
        <p className="mt-2 text-[12.5px] text-bad-fg">Ninguém com alçada na escala agora.</p>
      )}
      {atribuirManualmente.isError && (
        <p className="mt-2 text-[12.5px] text-bad-fg">Não foi possível atribuir. Tente de novo.</p>
      )}
      {ajustarDuracao.isError && (
        <p className="mt-2 text-[12.5px] text-bad-fg">Não foi possível ajustar a duração. Tente de novo.</p>
      )}
    </>
  )
}
