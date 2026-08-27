import { formatDuracaoCurta } from '@/shared/lib/format'
import type { Chip } from '@/shared/ui/chip'

import type { FaixaSemaforo } from '../model/types'

type TomChip = NonNullable<React.ComponentProps<typeof Chip>['tom']>

// Faixa (RF-14/seção 5) já vem pronta do back (Semaforo.Calcular, no momento do GET) — aqui só
// traduz pro `tom` do Chip e monta o texto ("vence em"/"estourou há"), que precisa do relógio
// local pra atualizar sozinho entre um refetch e outro (ver shared/lib/use-now).
const TOM_POR_FAIXA: Record<FaixaSemaforo, TomChip> = {
  Verde: 'ok',
  Amarelo: 'atencao',
  Laranja: 'critico',
  Vermelho: 'vencido',
}

export const prazoChip = (semaforo: FaixaSemaforo | null, vencimentoEm: string | null, now: number): { label: string; tom: TomChip } => {
  if (!semaforo || !vencimentoEm) {
    return { label: '—', tom: 'neutro' }
  }

  const restanteMs = new Date(vencimentoEm).getTime() - now
  const label = restanteMs < 0 ? `estourou há ${formatDuracaoCurta(-restanteMs)}` : `vence em ${formatDuracaoCurta(restanteMs)}`

  return { label, tom: TOM_POR_FAIXA[semaforo] }
}
