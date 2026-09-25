import { useEffect, useEffectEvent } from 'react'
import { toast } from 'sonner'

import { diffAltas, gravarAltasVistos, lerAltasVistos } from '../lib/alta-vistos'
import type { AltaPendente } from '../lib/prioridade-alta'

type Params = {
  altas: AltaPendente[]
  // `dataUpdatedAt` da query da fila: muda a cada resposta nova (inclusive o polling de 30s),
  // é o que dispara a comparação — não cada re-render do board.
  atualizadoEm: number
  usuarioId: string | undefined
  onVer: (protocoloId: string) => void
  onVerTodos: () => void
}

// RF-24i — toast quando um protocolo de prioridade alta aparece pela primeira vez pra este
// conferente. Um novo → toast com o número e o destino; vários na mesma atualização → um toast
// resumo. A primeira carga da sessão não avisa (a faixa já mostra), e o mesmo id nunca avisa
// duas vezes (memória em sessionStorage, ver alta-vistos.ts). Em StrictMode o efeito roda duas
// vezes com a mesma resposta: a segunda já encontra os ids gravados e não repete o toast.
//
// `useEffectEvent` (React 19.2): a comparação lê sempre as `altas` e os callbacks do render
// mais recente, mas só roda quando chega resposta nova (`atualizadoEm`) ou troca o usuário —
// callbacks recriados a cada render do board não são motivo pra comparar de novo.
export const useAvisoPrioridadeAlta = ({ altas, atualizadoEm, usuarioId, onVer, onVerTodos }: Params) => {
  const verSeChegouAlgoNovo = useEffectEvent((usuario: string) => {
    const atuais = altas
    const { novos, vistos } = diffAltas(
      lerAltasVistos(usuario),
      atuais.map((a) => a.protocolo.id),
    )
    gravarAltasVistos(usuario, vistos)

    if (novos.length === 1) {
      const alta = atuais.find((a) => a.protocolo.id === novos[0])
      if (!alta) return
      toast.warning(`Protocolo ${alta.protocolo.numero} chegou com prioridade alta`, {
        id: `alta-${alta.protocolo.id}`,
        description: alta.onde === 'pool' ? 'no pool' : 'atribuído a você',
        duration: 9000,
        action: { label: 'Ver', onClick: () => onVer(alta.protocolo.id) },
      })
    } else if (novos.length > 1) {
      toast.warning(`${novos.length} protocolos chegaram com prioridade alta`, {
        id: 'altas-em-lote',
        duration: 9000,
        action: { label: 'Ver todos', onClick: onVerTodos },
      })
    }
  })

  useEffect(() => {
    if (usuarioId && atualizadoEm) verSeChegouAlgoNovo(usuarioId)
  }, [atualizadoEm, usuarioId])
}
