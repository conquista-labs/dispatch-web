import type { MeuTempoPorTipo } from '@/entities/dashboard'
import { parseDuracaoParaMinutos } from '@/shared/lib/format'

import type { Variacao } from './variacao'

// Ritmo = tempo real ÷ tempo de referência dos tipos de ato conferidos (RF-46a). Textos e limiares
// do protótipo aprovado (Dispatch v2).

export const formatarRitmo = (ritmo: number) =>
  `${ritmo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×`

// Cor da coluna Ritmo na tabela: até 0,95 verde, até 1,10 neutro, acima disso laranja.
export const classeDoRitmo = (ritmo: number) =>
  ritmo <= 0.95 ? 'text-ok-fg' : ritmo <= 1.1 ? 'text-text-3' : 'text-crit-fg'

// "24% mais rápido que a referência do tipo de ato" (sub do KPI do conferente).
export const textoDoRitmo = (ritmo: number) => {
  const pct = Math.round((1 - ritmo) * 100)
  if (pct === 0) return 'no tempo de referência do tipo de ato'
  return `${Math.abs(pct)}% ${pct > 0 ? 'mais rápido' : 'mais lento'} que a referência do tipo de ato`
}

// Variação do ritmo em valor absoluto ("↓ 0,06"): cair é bom.
export const variacaoDoRitmo = (
  atual: number | null | undefined,
  anterior: number | null | undefined,
): Variacao | null => {
  if (atual === null || atual === undefined || anterior === null || anterior === undefined) return null
  const diferenca = Math.round((atual - anterior) * 100) / 100
  const seta = diferenca > 0 ? '↑' : diferenca < 0 ? '↓' : '='
  return {
    texto: `${seta} ${Math.abs(diferenca).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    tom: diferenca < 0 ? 'bom' : diferenca > 0 ? 'ruim' : 'neutro',
  }
}

export type LinhaDoTempoPorTipo = {
  tipoAtoId: string
  nome: string
  atos: number
  meuMinutos: number
  referenciaMinutos: number
  diferenca: string
  classe: string
  // Largura da barra "você" e posição do marcador da referência, em % da maior barra (×1,15 de folga).
  larguraPct: number
  referenciaPct: number
}

// "Seu tempo por tipo de ato" (RF-46b): diferença "=", "+N%" ou "−N%", verde a partir de −5%,
// laranja a partir de +10%.
export const linhasDoTempoPorTipo = (tipos: MeuTempoPorTipo[]): LinhaDoTempoPorTipo[] => {
  const linhas = tipos.map((t) => ({ ...t, meuMinutos: parseDuracaoParaMinutos(t.meuTempoMedio) }))
  const maior = Math.max(1, ...linhas.flatMap((l) => [l.meuMinutos, l.referenciaMinutos])) * 1.15
  return linhas.map((l) => {
    const dif = l.referenciaMinutos > 0 ? Math.round((l.meuMinutos / l.referenciaMinutos - 1) * 100) : 0
    return {
      tipoAtoId: l.tipoAtoId,
      nome: l.nome,
      atos: l.atos,
      meuMinutos: l.meuMinutos,
      referenciaMinutos: l.referenciaMinutos,
      diferenca: dif === 0 ? '=' : dif > 0 ? `+${dif}%` : `−${Math.abs(dif)}%`,
      classe: dif <= -5 ? 'text-ok-fg' : dif >= 10 ? 'text-crit-fg' : 'text-text-3',
      larguraPct: (l.meuMinutos / maior) * 100,
      referenciaPct: (l.referenciaMinutos / maior) * 100,
    }
  })
}

// Frase do protótipo que explica por que o ritmo não é o tempo bruto.
export const explicacaoDoRitmo = (tempoMedio: string | null, referenciaMedia: string | null, ritmo: number | null) => {
  if (!tempoMedio || !referenciaMedia || ritmo === null) return null
  return `Seu tempo bruto é ${parseDuracaoParaMinutos(tempoMedio)} min, e a referência para o mesmo conjunto de atos seria ${parseDuracaoParaMinutos(referenciaMedia)} min — por isso seu ritmo é ${formatarRitmo(ritmo)}. Quem só confere venda e compra tem tempo bruto menor sem ser mais rápido.`
}
