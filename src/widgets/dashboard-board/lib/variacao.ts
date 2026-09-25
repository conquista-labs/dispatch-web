import type { KpisDashboard, PeriodoDashboard, SerieDashboard } from '@/entities/dashboard'
import { parseDuracaoParaMinutos } from '@/shared/lib/format'

// Variação contra o mesmo trecho do período anterior (RF-42b), no formato do protótipo: volume em
// %, percentuais em pontos, tempo em minutos. `bom` decide a cor — tempo menor é bom.
export type Variacao = { texto: string; tom: 'bom' | 'ruim' | 'neutro' }

const seta = (diferenca: number) => (diferenca > 0 ? '↑' : diferenca < 0 ? '↓' : '=')
const numero = (n: number, casas = 0) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })

export const variacaoDeVolume = (atual: number, anterior: number | undefined): Variacao | null => {
  if (!anterior) return null // sem base (período anterior vazio) não há %
  const pct = Math.round(((atual - anterior) / anterior) * 100)
  return { texto: `${seta(pct)} ${numero(Math.abs(pct))}%`, tom: pct > 0 ? 'bom' : pct < 0 ? 'ruim' : 'neutro' }
}

export const variacaoEmPontos = (atual: number | null, anterior: number | null | undefined): Variacao | null => {
  if (atual === null || anterior === null || anterior === undefined) return null
  const pontos = Math.round((atual - anterior) * 1000) / 10
  return {
    texto: `${seta(pontos)} ${numero(Math.abs(pontos), 1)} pts`,
    tom: pontos > 0 ? 'bom' : pontos < 0 ? 'ruim' : 'neutro',
  }
}

export const variacaoDeTempo = (atual: string | null, anterior: string | null | undefined): Variacao | null => {
  if (!atual || !anterior) return null
  const minutos = parseDuracaoParaMinutos(atual) - parseDuracaoParaMinutos(anterior)
  return {
    texto: `${seta(minutos)} ${Math.abs(minutos)} min`,
    tom: minutos < 0 ? 'bom' : minutos > 0 ? 'ruim' : 'neutro',
  }
}

// "Aprovados na 1ª" (decisão do dono): vem do back a partir da fatia 4; com a API anterior o campo
// não existe e o KPI cai no percentual de aprovados de antes.
export const aprovadoNaPrimeira = (k: Pick<KpisDashboard, 'percentualAprovado' | 'percentualAprovadoNaPrimeira'>) =>
  k.percentualAprovadoNaPrimeira === undefined ? k.percentualAprovado : k.percentualAprovadoNaPrimeira

export const COMPARADO_COM: Record<PeriodoDashboard, string> = {
  Semana: 'variação contra a semana passada',
  Mes: 'variação contra o mês passado',
  Trimestre: 'variação contra o trimestre anterior',
}

const DIA_DA_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

// Rótulos do eixo do gráfico, como no protótipo: seg…sex na semana, dia do mês no mês, S1…S13 no
// trimestre. A data vem como "AAAA-MM-DD" (dia local) — lida sem fuso pra não voltar um dia.
export const rotulosDaSerie = (serie: SerieDashboard, periodo: PeriodoDashboard): string[] =>
  serie.pontos.map((ponto, indice) => {
    if (serie.granularidade === 'Semana') return `S${indice + 1}`
    const [ano, mes, dia] = ponto.inicio.split('-').map(Number)
    return periodo === 'Semana' ? DIA_DA_SEMANA[new Date(ano, mes - 1, dia).getDay()] : String(dia)
  })

export const TITULO_DA_SERIE: Record<PeriodoDashboard, { titulo: string; sub: string }> = {
  Semana: { titulo: 'Conferidos por dia', sub: 'dias úteis desta semana' },
  Mes: { titulo: 'Conferidos por dia', sub: 'dias úteis do mês' },
  Trimestre: { titulo: 'Conferidos por semana', sub: 'as semanas do trimestre' },
}
