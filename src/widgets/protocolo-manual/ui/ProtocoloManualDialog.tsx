import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'

import { NIVEL_LABEL, useConferentes } from '@/entities/conferente'
import { useEquipes } from '@/entities/equipe'
import { useEscreventes } from '@/entities/escrevente'
import {
  ETAPA_LABEL,
  PRIORIDADE_LABEL,
  TIPO_PRAZO_LABEL,
  useSimularProtocoloManual,
  type DetalheProtocolo,
  type Etapa,
  type Prioridade,
} from '@/entities/protocolo'
import { GRUPO_LABEL, useTiposAto } from '@/entities/tipoAto'
import { useAtribuirManualmente } from '@/features/protocolo/atribuir-manualmente'
import { useCriarProtocoloManual } from '@/features/protocolo/criar-manual'
import { useEditarProtocoloManual } from '@/features/protocolo/editar-manual'
import { formatDataHora } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { DateTimePicker } from '@/shared/ui/datetime-picker'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { PillToggle } from '@/shared/ui/pill-toggle'
import { SeletorUnico } from '@/shared/ui/seletor-unico'

const ETAPAS: Etapa[] = ['PreConferencia', 'PosConferencia']
// Ordem de exibição do seletor de 3 botões, igual ao protótipo (Dispatch.dc.html: ['Alta','Média','Baixa']).
const PRIORIDADES: Prioridade[] = ['Alta', 'Normal', 'Baixa']

const DESTINO_LABEL: Record<string, string> = {
  Atribuido: 'atribuído automaticamente',
  EnviadoParaPool: 'pool aberto — quem tiver alçada pega',
  Excecao: 'fila de exceções',
}

// Prioridade: 'Baixa' — mesmo default do protótipo (nvPrioridade: 'Baixa' no criar), só vale
// pro modo criação; editar sempre pré-preenche do protocolo real (ver useEffect abaixo).
const formVazio = {
  numero: '',
  tipoAtoId: '',
  escreventeNome: '',
  etapa: 'PosConferencia' as Etapa,
  prioridade: 'Baixa' as Prioridade,
  observacao: '',
}

type ProtocoloManualDialogProps = {
  aberto: boolean
  onFechar: () => void
  /** Presente = modo edição, pré-preenche o formulário. Ausente/null = modo criação. */
  protocoloParaEditar?: DetalheProtocolo | null
  /** RF-18i: no protótipo, "Excluir" também aparece dentro do modal de edição (redundante com
   * o do painel de detalhe) — só passa isso em modo edição, quem decide o que fazer (abrir a
   * confirmação) é o chamador, que já tem o AlertDialog. */
  onPedirExclusao?: () => void
}

// RF-18f/g — mesmo modal serve "Novo protocolo" (Distribuição) e "Editar protocolo" (painel de
// detalhe), só troca o texto/verbo e a mutation disparada. Prévia ao vivo (equipe, prazo, grupo
// do ato, destino previsto) via SimularProtocoloManual, sem persistir nada — RF-18f: "o modal
// mostra, antes de confirmar...". Layout espelha o protótipo aprovado (Dispatch.dc.html,
// `novoAberto`, linhas ~1739-1808): 520px, número+etapa numa linha, tipo de ato sozinho,
// escrevente+prioridade numa linha, observação, prévia com eyebrow "O QUE O SISTEMA VAI FAZER",
// rodapé com Cancelar+Excluir à esquerda e Criar/Salvar à direita.
export const ProtocoloManualDialog = ({
  aberto,
  onFechar,
  protocoloParaEditar,
  onPedirExclusao,
}: ProtocoloManualDialogProps) => {
  const editando = !!protocoloParaEditar
  const { data: escreventes } = useEscreventes()
  const { data: equipes } = useEquipes()
  const { data: tiposAto } = useTiposAto()
  const { data: conferentes } = useConferentes()
  const criar = useCriarProtocoloManual()
  const editar = useEditarProtocoloManual()
  const atribuirManualmente = useAtribuirManualmente()
  const [form, setForm] = useState(formVazio)
  // "Hora de entrada" (RF-18f) — só existe no modo criação; a importação já lê isso do
  // relatório, mas o cadastro manual sempre assumia "agora" sem deixar a distribuidora corrigir
  // um ato que chegou antes. Reseta pra "agora" toda vez que o modal abre pra criar (abaixo).
  const [andamentoEm, setAndamentoEm] = useState(new Date())
  // Pedido do dono: mandar o ato direto pra alguém já na criação, sem esperar o motor decidir
  // e depois reatribuir na mão. Só existe no modo criação — em edição a atribuição já existe e
  // tem seu próprio fluxo (painel de detalhe, "Atribuir a…"/"Reatribuir a…"). Opcional: vazio
  // significa "deixa o motor decidir" (comportamento de sempre).
  const [conferenteEscolhidoId, setConferenteEscolhidoId] = useState('')

  useEffect(() => {
    if (!aberto) return
    criar.reset()
    editar.reset()
    if (protocoloParaEditar) {
      const escrevente = (escreventes ?? []).find((e) => e.id === protocoloParaEditar.escreventeId)
      setForm({
        numero: protocoloParaEditar.numero,
        tipoAtoId: protocoloParaEditar.tipoAtoId ?? '',
        escreventeNome: escrevente?.nome ?? '',
        etapa: protocoloParaEditar.etapa,
        prioridade: protocoloParaEditar.prioridade,
        observacao: protocoloParaEditar.observacao ?? '',
      })
    } else {
      setForm(formVazio)
      setAndamentoEm(new Date())
      setConferenteEscolhidoId('')
    }
    // `!!escreventes` (não o array inteiro) — dispara de novo quando a lista carrega pela
    // primeira vez (corrige o nome do escrevente pré-preenchido), sem resetar o formulário a
    // cada refetch em segundo plano depois disso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, protocoloParaEditar?.id, !!escreventes])

  const podeSimular = form.tipoAtoId !== '' && form.escreventeNome.trim() !== ''
  const { data: simulacao, isFetching: simulando } = useSimularProtocoloManual(
    {
      numero: form.numero.trim(),
      tipoAtoId: form.tipoAtoId,
      escreventeNome: form.escreventeNome.trim(),
      etapa: form.etapa,
      prioridade: form.prioridade,
      // Só no modo criação — em edição a referência real é o AndamentoEm original do
      // protocolo (que este modal não mexe), não faz sentido simular com o estado local daqui.
      ...(editando ? {} : { andamentoEm: andamentoEm.toISOString() }),
    },
    podeSimular,
  )

  const numeroValido = /^\d{4,}$/.test(form.numero.trim())
  // No modo edição o próprio número atual não conta como "duplicado" — a simulação roda contra
  // o mesmo escrevente/tipo/etapa de sempre, mas ExisteComNumeroAsync não sabe que é o mesmo
  // registro; só bloqueia se o número digitado mudou pra outro que já existe.
  const numeroIndisponivel = simulacao
    ? !simulacao.numeroDisponivel && (!editando || form.numero.trim() !== protocoloParaEditar!.numero)
    : false
  const podeSalvar = numeroValido && !numeroIndisponivel && form.tipoAtoId !== '' && form.escreventeNome.trim() !== ''

  const mutation = editando ? editar : criar
  const numeroJaExiste = isAxiosError(mutation.error) && mutation.error.response?.status === 409
  // Criação com conferente escolhido é duas chamadas em sequência (criar → atribuir) — o botão/
  // erro precisam refletir as duas, não só a primeira.
  const salvando = mutation.isPending || atribuirManualmente.isPending
  const erroAoSalvar = mutation.isError || (!editando && atribuirManualmente.isError)

  const handleSalvar = () => {
    if (editando) {
      editar.mutate(
        {
          id: protocoloParaEditar!.id,
          tipoAtoId: form.tipoAtoId,
          escreventeNome: form.escreventeNome.trim(),
          etapa: form.etapa,
          prioridade: form.prioridade,
          observacao: form.observacao.trim() || null,
        },
        { onSuccess: onFechar },
      )
    } else {
      criar.mutate(
        {
          numero: form.numero.trim(),
          tipoAtoId: form.tipoAtoId,
          escreventeNome: form.escreventeNome.trim(),
          etapa: form.etapa,
          prioridade: form.prioridade,
          observacao: form.observacao.trim() || null,
          andamentoEm: andamentoEm.toISOString(),
        },
        {
          onSuccess: (resultado) => {
            // Conferente escolhido na hora de criar (opcional) — o protocolo já nasceu (Pool,
            // Atribuído automaticamente ou Exceção, tanto faz: AtribuirManualmente aceita os
            // 3), aqui só sobrescreve pra quem foi escolhido, sem esperar o motor decidir.
            if (conferenteEscolhidoId) {
              atribuirManualmente.mutate(
                { protocoloId: resultado.protocoloId, conferenteId: conferenteEscolhidoId },
                { onSuccess: onFechar },
              )
            } else {
              onFechar()
            }
          },
        },
      )
    }
  }

  const nomePorEquipeId = new Map((equipes ?? []).map((e) => [e.id, e.nome]))
  const tipoOpcoes = (tiposAto ?? [])
    .filter((t) => t.ativo)
    .map((t) => ({ valor: t.id, label: t.nome, sub: t.grupo ? GRUPO_LABEL[t.grupo] : 'sem grupo' }))
  const escreventeOpcoes = (escreventes ?? []).map((e) => ({
    valor: e.nome,
    label: e.nome,
    sub: e.equipeId ? (nomePorEquipeId.get(e.equipeId) ?? 'sem equipe') : 'sem equipe',
  }))
  const conferenteOpcoes = (conferentes ?? []).map((c) => ({
    valor: c.id,
    label: c.nome,
    sub: c.nivel ? NIVEL_LABEL[c.nivel] : undefined,
  }))
  const nomeConferenteEscolhido = conferenteOpcoes.find((c) => c.valor === conferenteEscolhidoId)?.label

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && onFechar()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar protocolo' : 'Novo protocolo'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="numero">Nº do protocolo</Label>
              <Input
                id="numero"
                value={form.numero}
                onChange={(event) => setForm({ ...form, numero: event.target.value })}
                placeholder="ex. 261480"
                disabled={editando}
                autoFocus={!editando}
              />
              {form.numero && !numeroValido && (
                <span className="text-[11px] text-bad-fg">só números, mínimo 4 dígitos</span>
              )}
              {numeroValido && numeroIndisponivel && (
                <span className="text-[11px] text-bad-fg">
                  este protocolo já existe no sistema — se ele precisa de uma nova conferência, abra-o e use
                  &quot;Reabrir conferência&quot; em vez de cadastrar de novo
                </span>
              )}
            </div>

            <div className="flex flex-none flex-col gap-1.5">
              <Label>Etapa</Label>
              <div className="flex gap-1.5">
                {ETAPAS.map((etapa) => (
                  <PillToggle
                    key={etapa}
                    label={ETAPA_LABEL[etapa]}
                    selecionado={form.etapa === etapa}
                    onClick={() => setForm({ ...form, etapa })}
                  />
                ))}
              </div>
            </div>
          </div>

          {!editando && (
            <div className="flex flex-col gap-1.5">
              <Label>Hora de entrada</Label>
              <DateTimePicker value={andamentoEm} onChange={setAndamentoEm} />
              <span className="text-[11px] text-muted-foreground">
                quando o ato chegou de verdade — ajuste se não foi agora mesmo
              </span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Tipo de ato</Label>
            <SeletorUnico
              valor={form.tipoAtoId}
              opcoes={tipoOpcoes}
              onSelecionar={(tipoAtoId) => setForm({ ...form, tipoAtoId })}
              placeholder="buscar tipo de ato…"
            />
            <span className="text-[11px] text-muted-foreground">
              só tipos já cadastrados — sem opção de criar um novo por aqui
            </span>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label>Escrevente</Label>
              <SeletorUnico
                valor={form.escreventeNome}
                opcoes={escreventeOpcoes}
                onSelecionar={(escreventeNome) => setForm({ ...form, escreventeNome })}
                placeholder="buscar escrevente…"
                permiteValorLivre
              />
            </div>

            <div className="flex flex-none flex-col gap-1.5">
              <Label>Prioridade</Label>
              <div className="flex flex-col gap-1.5">
                {PRIORIDADES.map((prioridade) => (
                  <PillToggle
                    key={prioridade}
                    label={PRIORIDADE_LABEL[prioridade]}
                    selecionado={form.prioridade === prioridade}
                    onClick={() => setForm({ ...form, prioridade })}
                  />
                ))}
              </div>
            </div>
          </div>

          {!editando && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <Label>Conferente específico (opcional)</Label>
                {conferenteEscolhidoId && (
                  <button
                    type="button"
                    onClick={() => setConferenteEscolhidoId('')}
                    className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    Limpar
                  </button>
                )}
              </div>
              <SeletorUnico
                valor={conferenteEscolhidoId}
                opcoes={conferenteOpcoes}
                onSelecionar={setConferenteEscolhidoId}
                placeholder="buscar conferente…"
              />
              <span className="text-[11px] text-muted-foreground">
                pula a distribuição automática e o motor — vai direto pra essa pessoa, sem checar alçada
              </span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="observacao">Observação</Label>
            <Input
              id="observacao"
              value={form.observacao}
              onChange={(event) => setForm({ ...form, observacao: event.target.value })}
              placeholder="opcional — o conferente vê isso no card"
            />
          </div>

          {podeSimular && (
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <div className="mb-1.5 font-mono text-[10.5px] tracking-[0.04em] text-muted-foreground">
                O QUE O SISTEMA VAI FAZER
              </div>
              {simulando && !simulacao ? (
                <span className="text-[12.5px] text-muted-foreground">calculando…</span>
              ) : simulacao ? (
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12.5px]">
                  <dt className="text-muted-foreground">Equipe</dt>
                  <dd className={simulacao.semEquipeSinalizado ? 'text-bad-fg' : ''}>
                    {simulacao.equipeNome ?? 'sem equipe'}
                  </dd>
                  <dt className="text-muted-foreground">Prazo</dt>
                  <dd>
                    {TIPO_PRAZO_LABEL[simulacao.prazo]} · vence {formatDataHora(simulacao.vencimentoEm)}
                  </dd>
                  <dt className="text-muted-foreground">Grupo do ato</dt>
                  <dd>{simulacao.grupo ? GRUPO_LABEL[simulacao.grupo] : 'sem grupo'}</dd>
                  <dt className="text-muted-foreground">Destino</dt>
                  <dd className={!conferenteEscolhidoId && simulacao.destino === 'Excecao' ? 'text-bad-fg' : ''}>
                    {/* Conferente específico escolhido sobrescreve o que o motor decidiria —
                        a prévia tem que refletir o que vai acontecer de verdade, não o cálculo
                        automático que nem vai ser usado (ver handleSalvar). */}
                    {nomeConferenteEscolhido
                      ? `atribuído direto a ${nomeConferenteEscolhido}`
                      : DESTINO_LABEL[simulacao.destino]}
                  </dd>
                </dl>
              ) : null}
            </div>
          )}

          {numeroJaExiste && (
            <p className="text-[13px] text-bad-fg">
              Este protocolo já existe no sistema. Se ele precisa de uma nova conferência (ex.: foi aprovado mas algo
              mudou), abra-o e use &quot;Reabrir conferência&quot; em vez de cadastrar de novo.
            </p>
          )}
          {erroAoSalvar && !numeroJaExiste && (
            <p className="text-[13px] text-bad-fg">Não foi possível salvar. Tente de novo.</p>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onFechar} disabled={salvando}>
              Cancelar
            </Button>
            {editando && onPedirExclusao && (
              <Button
                variant="outline"
                className="text-bad-fg hover:bg-bad-bg"
                onClick={onPedirExclusao}
                disabled={salvando}
              >
                Excluir
              </Button>
            )}
          </div>
          <Button onClick={handleSalvar} disabled={!podeSalvar || salvando}>
            {salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Criar protocolo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
