import { cn } from '@/shared/lib/utils'

type PillToggleProps = {
  label: string
  selecionado: boolean
  onClick: () => void
  redondo?: boolean
}

// Botão de seleção do construtor guiado de regra (RF-32), dos prazos por equipe (RF-36) e do
// modal de protocolo manual (RF-18f/g) — preenchido (bg/texto invertidos) quando selecionado,
// só borda quando não, mesmo tratamento visual do protótipo pros usos (Dispatch.dc.html,
// builderSujeitoTipos/opcoesPre/novo.etapas).
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
