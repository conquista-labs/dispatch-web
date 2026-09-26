import { useState } from 'react'

import { ETAPA_LABEL, TIPO_PRAZO_LABEL, prazoChip, type Etapa } from '@/entities/protocolo'
import type { ResumoImportacao } from '@/features/protocolo/importar-lote'
import { formatDataHora } from '@/shared/lib/format'
import { useNow } from '@/shared/lib/use-now'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Chip } from '@/shared/ui/chip'
import { Input } from '@/shared/ui/input'

type PassoLinhasProps = {
  resumo: ResumoImportacao
  etapa: Etapa
  linhaDeCorte: string
  onVoltar: () => void
  onContinuar: () => void
  /** RF-10a — índice da linha em `resumo.linhas` (a prévia mantém a ordem do relatório). */
  onExcluirLinha: (indice: number) => void
  excluidas: number
  onDesfazerExclusoes: () => void
  /** A prévia está sendo refeita depois de uma exclusão. */
  recalculando: boolean
  erroAoRecalcular: boolean
}

// RF-08: pra cada linha, a regra que gerou o prazo ("5º andar · pós-conferência") — o back
// manda o fato cru (equipe + prazo), quem monta o texto é o front (ver
// dispatch-api/docs/patterns/endpoints.md, "Back manda o fato cru"). RF-07: linha antes da linha
// de corte ("já existe") não teve
// nada resolvido de verdade, então some o chip de prazo e a linha de regra, só mostra a leitura.
export const PassoLinhas = ({
  resumo,
  etapa,
  linhaDeCorte,
  onVoltar,
  onContinuar,
  onExcluirLinha,
  excluidas,
  onDesfazerExclusoes,
  recalculando,
  erroAoRecalcular,
}: PassoLinhasProps) => {
  const now = useNow()
  const [busca, setBusca] = useState('')
  const linhas = resumo.linhas ?? []
  const semEquipe = linhas.filter((l) => !l.jaExiste && !l.equipe).length

  // Achado real (dono): um lote pode ter centenas de linhas (dispatch-api/docs/historico.md,
  // "Importação de lote (RF-05 a RF-12)") — o "+N linhas"
  // de antes era só texto estático, sem jeito nenhum de rever o resto antes de confirmar a
  // importação. Busca + rolagem própria mostram todas as linhas (filtradas ou não), em vez de
  // truncar num beco sem saída.
  const q = busca.trim().toLowerCase()
  // Guarda o índice original de cada linha — com busca ativa, a posição na lista filtrada não é a
  // posição no lote, e é esta que a exclusão (RF-10a) precisa.
  const comIndice = linhas.map((linha, indice) => ({ linha, indice }))
  const linhasFiltradas = q
    ? comIndice.filter(({ linha: l }) =>
        [l.protocolo, l.tipoAto, l.escrevente, l.equipe].filter(Boolean).join(' ').toLowerCase().includes(q),
      )
    : comIndice
  const podeExcluir = linhas.length > 1 && !recalculando

  // Pílulas do resumo em sans com uma cor por significado, como no protótipo v2 (`resumoLote`).
  const badgesTodas: { label: string; className: string }[] = [
    { label: `${resumo.totalNoArquivo} linhas lidas`, className: 'border-border bg-secondary text-text-3' },
    { label: `${resumo.processadas} novos`, className: 'border-border bg-card text-foreground' },
    {
      label: `${resumo.ignoradasPelaLinhaDeCorte} já existem`,
      className: 'border-warn-border bg-warn-bg text-warn-fg',
    },
    { label: `${resumo.excecoes} exigem decisão`, className: 'border-bad-border bg-bad-bg text-bad-fg' },
    { label: `${semEquipe} sem equipe (prazo padrão)`, className: 'border-border bg-card text-text-2' },
  ]
  const badges = badgesTodas.filter((b) => !b.label.startsWith('0 '))

  return (
    <div>
      <p className="font-mono text-xs font-medium text-muted-foreground">
        {linhas.length} linhas · {ETAPA_LABEL[etapa]} · a partir de {formatDataHora(linhaDeCorte)}
      </p>

      <div className="mt-2.5 mb-3 flex flex-wrap items-center gap-1.5">
        {badges.map((b) => (
          <PilulaResumo key={b.label} className={b.className}>
            {b.label}
          </PilulaResumo>
        ))}
        {excluidas > 0 && (
          <span className="flex items-center gap-1.5 text-[12px] text-text-2">
            <PilulaResumo className="border-border bg-card text-text-2">
              {excluidas === 1 ? '1 linha excluída deste lote' : `${excluidas} linhas excluídas deste lote`}
            </PilulaResumo>
            <button
              type="button"
              onClick={onDesfazerExclusoes}
              disabled={recalculando}
              className="font-medium underline decoration-dotted hover:text-foreground disabled:opacity-50"
            >
              Desfazer
            </button>
          </span>
        )}
        {recalculando && <span className="text-[12px] text-muted-foreground">recalculando…</span>}
      </div>
      {erroAoRecalcular && (
        <p className="mb-2.5 text-[12.5px] text-bad-fg">Não foi possível atualizar o lote. Tente de novo.</p>
      )}

      {linhas.length > 9 && (
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="buscar protocolo, tipo de ato, escrevente, equipe…"
          className="mb-2.5"
        />
      )}

      <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border px-3.5 py-2 text-[11.5px] font-medium text-text-2">
          <span className="w-20 flex-none">Protocolo</span>
          <span className="min-w-24 flex-1">Tipo de ato</span>
          <span className="w-[126px] flex-none">Escrevente</span>
          <span className="w-[182px] flex-none">Prazo e regra aplicada</span>
          <span className="w-[98px] flex-none text-right">Leitura</span>
          <span className="w-[34px] flex-none" />
        </div>

        <div className="max-h-[480px] overflow-y-auto">
          {linhasFiltradas.map(({ linha, indice }) => {
            const chip = linha.jaExiste ? null : prazoChip(linha.semaforo, linha.vencimentoEm, now)
            const regraPrazo = linha.jaExiste
              ? null
              : linha.equipe
                ? `${linha.equipe} · ${ETAPA_LABEL[etapa]}`
                : 'padrão da casa · escrevente sem equipe'
            const leitura = linha.jaExiste
              ? 'já existe'
              : linha.tipoConhecido
                ? `${linha.comAlcada} com alçada`
                : 'tipo novo'

            return (
              // RNF-10: tipo de ato/escrevente/equipe não truncam mais — items-start (não center)
              // porque agora a linha pode crescer em altura; protocolo/leitura ganham mt-0.5 pra
              // ficar alinhados com a primeira linha das colunas que podem quebrar.
              <div
                key={`${linha.protocolo}-${indice}`}
                className={cn(
                  'flex items-start gap-2 border-b border-border/60 px-3.5 py-2 text-[13px] last:border-b-0',
                  !linha.jaExiste && !linha.tipoConhecido && 'bg-warn-bg',
                )}
              >
                <span className="mt-0.5 w-20 flex-none font-mono text-[12.5px] font-medium">{linha.protocolo}</span>
                <span className="min-w-24 flex-1 pr-2 text-pretty text-text-5">{linha.tipoAto}</span>
                <span className="w-[126px] flex-none">
                  <span className="block text-pretty text-text-2">{linha.escrevente}</span>
                  {!linha.jaExiste && (
                    <span
                      className={cn(
                        'mt-0.5 block font-mono text-[10.5px] text-pretty',
                        linha.equipe ? 'text-muted-foreground' : 'text-bad-fg',
                      )}
                    >
                      {linha.equipe ?? 'sem equipe'}
                    </span>
                  )}
                </span>
                <span className="w-[182px] flex-none pr-2">
                  {chip && linha.prazo ? (
                    <Chip tom={chip.tom}>{TIPO_PRAZO_LABEL[linha.prazo]}</Chip>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                  {regraPrazo && (
                    <span className="mt-0.5 block text-[10.5px] leading-snug text-muted-foreground">{regraPrazo}</span>
                  )}
                </span>
                <span
                  className={cn(
                    'mt-0.5 w-[98px] flex-none text-right text-[12px] font-medium',
                    linha.jaExiste ? 'text-muted-foreground' : linha.tipoConhecido ? 'text-text-2' : 'text-bad-fg',
                  )}
                >
                  {leitura}
                </span>
                {/* RF-10a — protocolo cancelado, lançado em duplicidade na origem ou que não deve
                    entrar na conferência: sai do lote e do resumo, e não é gravado. */}
                <span className="flex w-[34px] flex-none justify-end">
                  <button
                    type="button"
                    onClick={() => onExcluirLinha(indice)}
                    disabled={!podeExcluir}
                    title={linhas.length > 1 ? 'Excluir esta linha do lote' : 'O lote precisa de ao menos uma linha'}
                    aria-label={`Excluir o protocolo ${linha.protocolo} do lote`}
                    className="flex size-6 items-center justify-center rounded-md border border-border bg-card text-[14px] leading-none text-text-2 hover:border-bad-border hover:text-bad-fg disabled:opacity-40 max-mobile:size-9"
                  >
                    ×
                  </button>
                </span>
              </div>
            )
          })}
          {q && linhasFiltradas.length === 0 && (
            <div className="px-3.5 py-2 text-[12.5px] text-muted-foreground">Nenhuma linha bate com a busca.</div>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        <Button variant="outline" onClick={onVoltar}>
          Voltar
        </Button>
        <Button onClick={onContinuar}>Ver distribuição</Button>
      </div>
    </div>
  )
}

const PilulaResumo = ({ className, children }: { className: string; children: React.ReactNode }) => (
  <span className={cn('rounded-full border px-2.5 py-[3px] text-[12px] font-medium', className)}>{children}</span>
)
