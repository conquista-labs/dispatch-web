import { cn } from '@/shared/lib/utils'

type PillToggleProps = {
  label: string
  selecionado: boolean
  onClick: () => void
  redondo?: boolean
  /** Valor curto e técnico (prazo "D+1", "1 hora") — mono 11,5px e 23px de altura, como no protótipo v2. */
  mono?: boolean
}

// Botão de seleção do construtor guiado de regra (RF-32), dos prazos por equipe (RF-36) e do
// modal de protocolo manual (RF-18f/g) — preenchido (bg/texto invertidos) quando selecionado,
// só borda quando não, mesmo tratamento visual do protótipo pros usos (Dispatch.dc.html,
// builderSujeitoTipos/opcoesPre/novo.etapas).
export const PillToggle = ({ label, selecionado, onClick, redondo = false, mono = false }: PillToggleProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors',
      redondo ? 'rounded-full' : 'rounded-md',
      mono && 'h-[23px] rounded-[6px] px-2 py-0 font-mono text-[11.5px] max-mobile:h-9',
      selecionado
        ? 'border-foreground bg-foreground text-background'
        : 'border-border bg-card text-text-3 hover:border-muted-foreground',
    )}
  >
    {label}
  </button>
)
