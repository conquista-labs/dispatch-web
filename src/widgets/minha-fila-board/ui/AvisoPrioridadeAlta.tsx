import { PrioridadeAltaTag } from '@/entities/protocolo'
import { cn } from '@/shared/lib/utils'

import type { AltaPendente, OndeAlta } from '../lib/prioridade-alta'

const ONDE_CURTO: Record<OndeAlta, string> = {
  minhas: 'seu',
  conf: 'em conferência',
  pool: 'pool',
}

// Até 3, um botão por protocolo; com 4 ou mais, os 2 primeiros + "Ver os N" — a faixa resume sem
// ocupar meia tela (RF-24h, protótipo).
const MAX_BOTOES_DIRETOS = 3
const BOTOES_QUANDO_RESUME = 2

type Props = {
  altas: AltaPendente[]
  onVer: (protocoloId: string) => void
  onVerTodos: () => void
}

// RF-24h — faixa presa no topo da Minha fila enquanto existir protocolo de prioridade alta
// atribuído ao conferente, em conferência com ele ou no pool dentro da alçada dele. Não fecha:
// some sozinha quando não há mais nenhum. Fundo "ink" invertido (segue o tema) com a pílula
// vermelha "Alta" — chama atenção sem competir com o vermelho do "estourado" nos cards, e a cor
// nunca é o único sinal (RNF-06: pílula + texto). No celular fica abaixo da barra superior e da
// tira de navegação do AppShell — as duas são sticky e terminam em ~111px (medido no Playwright a
// 390px); 116px deixa uma folga. Mudou a altura da barra mobile, confira este número. Lá o texto
// ocupa a linha inteira e os botões descem pra linha de baixo.
export const AvisoPrioridadeAlta = ({ altas, onVer, onVerTodos }: Props) => {
  if (altas.length === 0) return null

  const noPool = altas.filter((a) => a.onde === 'pool').length
  const seus = altas.length - noPool
  const resume = altas.length > MAX_BOTOES_DIRETOS
  const botoes = resume ? altas.slice(0, BOTOES_QUANDO_RESUME) : altas

  const resumo = [
    seus > 0 && `${seus} ${seus === 1 ? 'atribuído' : 'atribuídos'} a você`,
    noPool > 0 && `${noPool} no pool`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-2.5 z-[5] mb-3.5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[10px] bg-foreground px-3.5 py-2.5 text-background shadow-lg max-mobile:top-[116px]"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 max-mobile:basis-full">
        <PrioridadeAltaTag />
        <div className="min-w-0">
          <div className="text-[13px] font-semibold">
            {altas.length === 1 ? '1 protocolo com prioridade alta' : `${altas.length} protocolos com prioridade alta`}
          </div>
          <div className="text-[11.5px] opacity-75">{resumo}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 max-mobile:w-full">
        {botoes.map((alta) => (
          <button
            key={alta.protocolo.id}
            type="button"
            onClick={() => onVer(alta.protocolo.id)}
            className="rounded-md border border-background/30 px-2.5 py-1 font-mono text-[12px] hover:bg-background/10 max-mobile:min-h-11"
          >
            {alta.protocolo.numero} · {ONDE_CURTO[alta.onde]} →
          </button>
        ))}
        {resume && (
          <button
            type="button"
            onClick={onVerTodos}
            className={cn(
              'rounded-md bg-background px-2.5 py-1 text-[12px] font-semibold text-foreground hover:bg-background/90',
              'max-mobile:min-h-11',
            )}
          >
            Ver os {altas.length}
          </button>
        )}
      </div>
    </div>
  )
}
