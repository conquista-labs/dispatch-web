import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-zinc-900 text-white hover:bg-zinc-700 disabled:bg-zinc-300',
  secondary: 'bg-white text-zinc-900 border border-zinc-300 hover:bg-zinc-50',
}

// Kit de UI ainda mínimo — troca por Radix/shadcn quando as telas de verdade começarem a
// pedir componentes mais ricos (select, dialog, etc.). Por enquanto só o suficiente pro login.
export const Button = ({ variant = 'primary', className = '', ...props }: ButtonProps) => (
  <button
    className={`rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
    {...props}
  />
)
