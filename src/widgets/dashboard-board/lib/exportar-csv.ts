import { NIVEL_LABEL } from '@/entities/conferente'
import { FAIXA_LABEL, type DesempenhoConferente } from '@/entities/dashboard'
import { parseDuracaoParaMinutos } from '@/shared/lib/format'

import { aprovadoNaPrimeira } from './variacao'

// RF-44 — "Exportar CSV" (decisão do dono: só a tabela de produção/desempenho do período). Formato
// pro Excel em português abrir direto: separador ";", vírgula decimal e BOM de UTF-8 (sem ele o Excel
// lê os acentos errado). Score, faixa e nível só entram quando quem exporta é Administrador — o
// back já manda nulo pra distribuidora, e a coluna nem aparece.

const numero = (valor: number, casas: number) =>
  valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas, useGrouping: false })
const pct = (fracao: number | null | undefined) =>
  fracao === null || fracao === undefined ? '' : numero(fracao * 100, 1)

// Aspas só quando precisa (nome com ";", aspas ou quebra de linha), dobrando as internas.
const celula = (valor: string) => (/[;"\n\r]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor)

export const gerarCsvDeDesempenho = (linhas: DesempenhoConferente[], comAvaliacao: boolean): string => {
  const cabecalho = [
    'Conferente',
    ...(comAvaliacao ? ['Nível'] : []),
    'Volume',
    'Ritmo',
    'Tempo médio (min)',
    'No prazo (%)',
    'Aprovados na 1ª (%)',
    'Complexidade',
    ...(comAvaliacao ? ['Score', 'Faixa'] : []),
  ]
  const corpo = linhas.map((d) => [
    d.nome ?? '',
    ...(comAvaliacao ? [d.nivel ? NIVEL_LABEL[d.nivel] : ''] : []),
    String(d.volume),
    d.ritmo === null || d.ritmo === undefined ? '' : numero(d.ritmo, 2),
    d.tempoMedio ? String(parseDuracaoParaMinutos(d.tempoMedio)) : '',
    pct(d.percentualNoPrazo),
    pct(aprovadoNaPrimeira(d)),
    numero(d.complexidadeMedia, 2),
    ...(comAvaliacao ? [d.score === null ? '' : String(d.score), d.faixa ? FAIXA_LABEL[d.faixa] : ''] : []),
  ])
  return '﻿' + [cabecalho, ...corpo].map((linha) => linha.map(celula).join(';')).join('\r\n')
}

export const nomeDoArquivo = (periodo: string, hoje: Date) =>
  `dispatch-producao-${periodo.toLowerCase()}-${hoje.toISOString().slice(0, 10)}.csv`

// Dispara o download no navegador (sem ida ao servidor).
export const baixarCsv = (conteudo: string, nome: string) => {
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  link.click()
  URL.revokeObjectURL(url)
}
