import { ETAPA_LABEL, TIPO_PRAZO_LABEL, prazoChip, type Etapa } from '@/entities/protocolo'
import type { ResumoImportacao } from '@/features/protocolo/importar-lote'
import { formatDataHora } from '@/shared/lib/format'
import { useNow } from '@/shared/lib/use-now'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Chip } from '@/shared/ui/chip'

type PassoLinhasProps = {
  resumo: ResumoImportacao
  etapa: Etapa
  linhaDeCorte: string
  onVoltar: () => void
  onContinuar: () => void
}

const MAX_LINHAS_VISIVEIS = 9

// RF-08: pra cada linha, a regra que gerou o prazo ("5º andar · pós-conferência") — o back
// manda o fato cru (equipe + prazo), quem monta o texto é o front (ver CLAUDE.md do
// dispatch-api, seção "RF-08"). RF-07: linha antes da linha de corte ("já existe") não teve
// nada resolvido de verdade, então some o chip de prazo e a linha de regra, só mostra a leitura.
export const PassoLinhas = ({ resumo, etapa, linhaDeCorte, onVoltar, onContinuar }: PassoLinhasProps) => {
  const now = useNow()
  const linhas = resumo.linhas ?? []
  const visiveis = linhas.slice(0, MAX_LINHAS_VISIVEIS)
  const restantes = Math.max(0, linhas.length - MAX_LINHAS_VISIVEIS)
  const semEquipe = linhas.filter((l) => !l.jaExiste && !l.equipe).length

  const badgesTodas: { label: string; tom: React.ComponentProps<typeof Chip>['tom'] }[] = [
    { label: `${resumo.totalNoArquivo} linhas lidas`, tom: 'neutro' },
    { label: `${resumo.processadas} novos`, tom: 'neutro' },
    { label: `${resumo.ignoradasPelaLinhaDeCorte} já existem`, tom: 'atencao' },
    { label: `${resumo.excecoes} exigem decisão`, tom: 'vencido' },
    { label: `${semEquipe} sem equipe (prazo padrão)`, tom: 'neutro' },
  ]
  const badges = badgesTodas.filter((b) => !b.label.startsWith('0 '))

  return (
    <div>
      <p className="font-mono text-xs font-medium text-muted-foreground">
        {linhas.length} linhas · {ETAPA_LABEL[etapa]} · a partir de {formatDataHora(linhaDeCorte)}
      </p>

      <div className="mt-2.5 mb-3 flex flex-wrap gap-1.5">
        {badges.map((b) => (
          <Chip key={b.label} tom={b.tom}>
            {b.label}
          </Chip>
        ))}
      </div>

      <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-border px-3.5 py-2 text-[11.5px] font-medium text-text-2">
          <span className="w-20 flex-none">Protocolo</span>
          <span className="min-w-24 flex-1">Tipo de ato</span>
          <span className="w-[126px] flex-none">Escrevente</span>
          <span className="w-[182px] flex-none">Prazo e regra aplicada</span>
          <span className="w-[98px] flex-none text-right">Leitura</span>
        </div>

        {visiveis.map((linha, indice) => {
          const chip = linha.jaExiste ? null : prazoChip(linha.semaforo, linha.vencimentoEm, now)
          const regraPrazo = linha.jaExiste
            ? null
            : linha.equipe
              ? `${linha.equipe} · ${ETAPA_LABEL[etapa]}`
              : 'padrão da casa · escrevente sem equipe'
          const leitura = linha.jaExiste ? 'já existe' : linha.tipoConhecido ? `${linha.comAlcada} com alçada` : 'tipo novo'

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
              <span className="min-w-24 flex-1 pr-2 text-text-5 text-pretty">{linha.tipoAto}</span>
              <span className="w-[126px] flex-none">
                <span className="block text-text-2 text-pretty">{linha.escrevente}</span>
                {!linha.jaExiste && (
                  <span className={cn('mt-0.5 block font-mono text-[10.5px] text-pretty', linha.equipe ? 'text-muted-foreground' : 'text-bad-fg')}>
                    {linha.equipe ?? 'sem equipe'}
                  </span>
                )}
              </span>
              <span className="w-[182px] flex-none pr-2">
                {chip && linha.prazo ? <Chip tom={chip.tom}>{TIPO_PRAZO_LABEL[linha.prazo]}</Chip> : <span className="text-muted-foreground">—</span>}
                {regraPrazo && <span className="mt-0.5 block text-[10.5px] leading-snug text-muted-foreground">{regraPrazo}</span>}
              </span>
              <span
                className={cn(
                  'mt-0.5 w-[98px] flex-none text-right text-[12px] font-medium',
                  linha.jaExiste ? 'text-muted-foreground' : linha.tipoConhecido ? 'text-text-2' : 'text-bad-fg',
                )}
              >
                {leitura}
              </span>
            </div>
          )
        })}

        {restantes > 0 && <div className="px-3.5 py-2 text-[12.5px] text-muted-foreground">+ {restantes} linhas</div>}
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

