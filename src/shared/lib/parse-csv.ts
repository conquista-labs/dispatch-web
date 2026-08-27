// Parser mínimo pro formato usado nesta sessão pra colar relatório (RF-05: "aceitar .csv/.xlsx
// ou colar as linhas direto da planilha" — aqui só a colagem está implementada; arquivo de
// verdade fica pra depois, mesma pendência que o back já tem documentada). Sem lib externa:
// o formato é simples o bastante (vírgula, sem campo com vírgula dentro) pra não precisar de
// um parser CSV de verdade.
export type LinhaCsv = Record<string, string>

export const parseCsv = (texto: string): LinhaCsv[] => {
  const linhas = texto
    .trim()
    .split('\n')
    .map((linha) => linha.trim())
    .filter(Boolean)

  if (linhas.length < 2) return []

  const cabecalho = linhas[0].split(',').map((coluna) => coluna.trim())
  return linhas.slice(1).map((linha) => {
    const valores = linha.split(',').map((valor) => valor.trim())
    return Object.fromEntries(cabecalho.map((coluna, i) => [coluna, valores[i] ?? '']))
  })
}

// "2026-08-26 10:16:53" (sem fuso, como o relatório do cartório traz) → ISO 8601 com fuso, o
// que o DateTimeOffset do back espera. Interpreta como horário local do navegador — mesma
// suposição que já vale pro resto do app (sem seletor de fuso em lugar nenhum).
export const dataHoraParaIso = (valor: string): string => {
  const normalizado = valor.trim().replace(' ', 'T')
  return new Date(normalizado).toISOString()
}
