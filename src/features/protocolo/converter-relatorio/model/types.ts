import type { Etapa } from '@/entities/protocolo'
import type { LinhaImportacao } from '@/features/protocolo/importar-lote'

// Espelha a resposta de POST /protocolos/importar/converter — o conector do cartório (adaptador no
// back) lê o .xls exportado pelo sistema do cartório e devolve as linhas no formato genérico da
// importação, mais a etapa que o relatório declara e a conferência de totais.
export type RelatorioConvertido = {
  conector: string
  etapa: Etapa
  linhas: LinhaImportacao[]
  totalDeclarado: number
  totalLido: number
}
