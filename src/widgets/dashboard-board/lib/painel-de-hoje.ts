import type { PainelDeHoje } from '@/entities/dashboard'
import { ROUTES } from '@/shared/config/routes'

export type TomDoItem = 'bad' | 'crit' | 'warn' | null

export type ItemDoPainel = {
  label: string
  valor: string
  sub: string
  tom: TomDoItem
  // Aba da Distribuição que explica o número (só na visão de gestão).
  destino?: string
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

// Textos do protótipo aprovado (Dispatch v2, `hoje`/`meu.hoje`) sobre os números do back (RF-42a).
export const itensDoPainel = (painel: PainelDeHoje): ItemDoPainel[] => {
  const { estourados, vencemEmUmaHora } = painel.emRisco
  const risco = estourados + vencemEmUmaHora
  const tomDoRisco: TomDoItem = estourados > 0 ? 'bad' : vencemEmUmaHora > 0 ? 'crit' : null
  const subDoRisco = `${plural(estourados, 'estourado', 'estourados')} · ${vencemEmUmaHora} vencem em 1h`
  const conferidos: ItemDoPainel = {
    label: 'Conferidos hoje',
    valor: String(painel.conferidosHoje),
    sub: painel.conferidosHoje > 0 ? 'aprovados e não aprovados' : 'nenhum ainda',
    tom: null,
  }

  if (painel.visao === 'Conferente') {
    const naMao = painel.naMao ?? { total: 0, emConferencia: 0 }
    return [
      conferidos,
      {
        label: 'Na sua mão',
        valor: String(naMao.total),
        sub: `${naMao.emConferencia} em conferência agora`,
        tom: null,
      },
      { label: 'Em risco com você', valor: String(risco), sub: subDoRisco, tom: tomDoRisco },
    ]
  }

  const naFila = painel.naFila ?? { pool: 0, comConferente: 0 }
  const excecoes = painel.excecoes ?? 0
  return [
    { ...conferidos, destino: `${ROUTES.distribuicao}?aba=status` },
    {
      label: 'Na fila',
      valor: String(naFila.pool + naFila.comConferente),
      sub: `${naFila.pool} no pool · ${naFila.comConferente} com conferente`,
      tom: null,
      destino: `${ROUTES.distribuicao}?aba=conferente`,
    },
    {
      label: 'Em risco',
      valor: String(risco),
      sub: subDoRisco,
      tom: tomDoRisco,
      destino: `${ROUTES.distribuicao}?aba=status`,
    },
    {
      label: 'Exceções',
      valor: String(excecoes),
      sub: excecoes > 0 ? 'esperando decisão manual' : 'nada parado',
      tom: excecoes > 0 ? 'warn' : null,
      destino: `${ROUTES.distribuicao}?aba=excecoes`,
    },
  ]
}

// "Quinto Andar concentra 5 dos protocolos estourados ou vencendo em 1h." — o back só manda o
// gargalo quando uma equipe tem mais de um.
export const textoDoGargalo = (
  painel: PainelDeHoje,
  nomeDaEquipe: (id: string) => string | undefined,
): string | null => {
  if (!painel.gargalo) return null
  const quem = painel.gargalo.equipeId
    ? (nomeDaEquipe(painel.gargalo.equipeId) ?? 'Uma equipe')
    : 'Escreventes sem equipe'
  return `${quem} ${painel.gargalo.equipeId ? 'concentra' : 'concentram'} ${painel.gargalo.quantidade} dos protocolos estourados ou vencendo em 1h.`
}
