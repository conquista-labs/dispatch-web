import { cn } from '@/shared/lib/utils'

import type { EstadoAlcance } from '../lib/alcance'

type CelulaAlcanceProps = {
  estado: EstadoAlcance
  titulo: string
  onClick: () => void
}

// Célula clicável da matriz de alcance — mesmo botão usado na linha de grupo e na linha de
// tipo (AbaAlcadaMatriz.tsx), extraído numa auditoria de qualidade (markup idêntico duplicado
// nas duas linhas, só o cálculo de estado differia).
export const CelulaAlcance = ({ estado, titulo, onClick }: CelulaAlcanceProps) => (
  <button type="button" title={titulo} onClick={onClick} className={cn('w-11 flex-none py-1 text-center text-sm hover:bg-background', estado.cor)}>
    {estado.glifo}
  </button>
)
