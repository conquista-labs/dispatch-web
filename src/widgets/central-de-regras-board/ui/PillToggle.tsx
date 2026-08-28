import { cn } from '@/shared/lib/utils'

type PillToggleProps = {
  label: string
  selecionado: boolean
  onClick: () => void
  redondo?: boolean
}

// Botão de seleção do construtor guiado de regra (RF-32) e dos prazos por equipe (RF-36) —
// preenchido (bg/texto invertidos) quando selecionado, só borda quando não, mesmo tratamento
// visual do protótipo pros dois usos (Dispatch.dc.html, builderSujeitoTipos/opcoesPre).
export const PillToggle = ({ label, selecionado, onClick, redondo = false }: PillToggleProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors',
      redondo ? 'rounded-full' : 'rounded-md',
      selecionado ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-text-3 hover:border-muted-foreground',
    )}
  >
    {label}
  </button>
)
