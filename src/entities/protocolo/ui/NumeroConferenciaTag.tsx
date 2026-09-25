import { Tag } from '@/shared/ui/tag'

import { rotuloNumeroConferencia, type VarianteNumeroConferencia } from '../lib/rotulos'

type Props = {
  numero: number
  variante?: VarianteNumeroConferencia
}

// RF-24k — nada pra 1ª conferência; a partir da 2ª, tag neutra. O texto completo vai sempre no
// `title`, porque a variante curta ("↻ 2ª") sozinha não diz o que é.
export const NumeroConferenciaTag = ({ numero, variante = 'completa' }: Props) => {
  const rotulo = rotuloNumeroConferencia(numero, variante)
  if (!rotulo) return null

  return (
    <Tag tom="neutro" title={`${numero}ª conferência — voltou depois de não aprovado`}>
      {rotulo}
    </Tag>
  )
}
