import type { DesempenhoTipoAto, FaixaBonificacao, PeriodoDashboard } from '@/entities/dashboard'
import { parseDuracaoParaMinutos } from '@/shared/lib/format'

// Contas só de apresentação sobre o que o back já calculou (nenhuma regra de negócio nova).

const DIAS_DO_PERIODO: Record<PeriodoDashboard, number> = { Semana: 7, Mes: 30, Trimestre: 90 }

// O back usa janela móvel (7/30/90 dias até agora — ObterDashboard). "N por dia útil, em média" do
// protótipo divide pelos dias de segunda a sexta dessa mesma janela; feriado não entra (o back ainda
// não conhece feriados — gaps §24 da API).
// Com o período por calendário (fatia 3), conta os dias úteis de `inicio` até `fim` (inclusive o
// dia de hoje). Sem as datas (API anterior), cai na janela móvel abaixo.
export const diasUteisEntre = (inicio: Date, fim: Date): number => {
  const primeiro = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate())
  const ultimo = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate())
  const totalDeDias = Math.round((ultimo.getTime() - primeiro.getTime()) / 86_400_000) + 1
  let uteis = 0
  for (let i = 0; i < totalDeDias; i++) {
    const dia = new Date(primeiro.getFullYear(), primeiro.getMonth(), primeiro.getDate() + i)
    if (dia.getDay() !== 0 && dia.getDay() !== 6) uteis++
  }
  return uteis
}

export const diasUteisNoPeriodo = (periodo: PeriodoDashboard, agora: Date): number => {
  let uteis = 0
  for (let i = 0; i < DIAS_DO_PERIODO[periodo]; i++) {
    const dia = new Date(agora)
    dia.setDate(agora.getDate() - i)
    if (dia.getDay() !== 0 && dia.getDay() !== 6) uteis++
  }
  return uteis
}

export type Tom = 'ok' | 'warn' | 'bad'

// Limiares de cor da tabela de desempenho do protótipo aprovado (Dispatch v2).
export const tomDoPrazo = (fracao: number): Tom => (fracao >= 0.9 ? 'ok' : fracao >= 0.8 ? 'warn' : 'bad')
export const tomDaAprovacao = (fracao: number): Tom => (fracao >= 0.85 ? 'ok' : fracao >= 0.78 ? 'warn' : 'bad')

export const TEXTO_DO_TOM: Record<Tom, string> = { ok: 'text-ok-fg', warn: 'text-warn-fg', bad: 'text-bad-fg' }

// "1,32×" — peso médio dos atos conferidos, como o protótipo mostra.
export const formatarComplexidade = (complexidade: number): string =>
  `${complexidade.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×`

// Pílula da faixa: "Fora do bônus" é neutra no protótipo — não é erro de ninguém, só não bateu a faixa.
export const CLASSE_DA_FAIXA: Record<FaixaBonificacao, string> = {
  Integral: 'border-ok-border bg-ok-bg text-ok-fg',
  Parcial: 'border-warn-border bg-warn-bg text-warn-fg',
  Fora: 'border-border bg-card text-text-2',
}

// "varia de 15 min (venda e compra) a 44 min (testamento)" — só entre tipos com tempo medido.
export const faixaDoTempoPorTipo = (porTipoAto: DesempenhoTipoAto[]): string | null => {
  const medidos = porTipoAto
    .filter((t) => t.tempoMedio)
    .map((t) => ({ nome: t.nome.toLowerCase(), minutos: parseDuracaoParaMinutos(t.tempoMedio!) }))
  if (medidos.length < 2) return null
  const menor = medidos.reduce((a, b) => (b.minutos < a.minutos ? b : a))
  const maior = medidos.reduce((a, b) => (b.minutos > a.minutos ? b : a))
  if (menor.minutos === maior.minutos) return null
  return `varia de ${menor.minutos} min (${menor.nome}) a ${maior.minutos} min (${maior.nome})`
}

// "1 estourou" / "3 estouraram" / "nenhum estourou" — os textos de apoio dos KPIs.
export const contagem = (n: number, nenhum: string, um: string, varios: string): string =>
  n === 0 ? nenhum : n === 1 ? `1 ${um}` : `${n} ${varios}`

// "91 por dia útil" com volume de verdade; com pouco volume o arredondamento zerava ("0 por dia
// útil"), então abaixo de 10 mostra uma casa decimal.
export const formatarMediaDiaria = (valor: number): string =>
  valor >= 10 ? String(Math.round(valor)) : valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
