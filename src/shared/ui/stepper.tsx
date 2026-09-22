import { MinusIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'

export type StepperProps = {
  valor: string
  min: number
  max: number
  onAlterar: (valor: number) => void
  onDecrementar: () => void
  onIncrementar: () => void
}

// Extraído de datetime-picker.tsx (era privado ali) — reaproveitado também em
// shared/ui/campo-horario.tsx. O número do meio é um <input> (não só um <span>), pra dar pra
// digitar direto em vez de clicar em −/+ um por um.
export const Stepper = ({ valor, min, max, onAlterar, onDecrementar, onIncrementar }: StepperProps) => {
  const [texto, setTexto] = useState(valor)

  // Ajusta o estado local durante o render, sem efeito — mesmo padrão já usado em
  // datetime-picker.tsx/EquipeCard.tsx pra "resetar estado quando uma prop muda".
  const [valorRefletido, setValorRefletido] = useState(valor)
  if (valor !== valorRefletido) {
    setValorRefletido(valor)
    setTexto(valor)
  }

  const commit = () => {
    const numero = Number(texto)
    if (texto.trim() !== '' && Number.isInteger(numero) && numero >= min && numero <= max) onAlterar(numero)
    else setTexto(valor)
  }

  return (
    <div className="flex items-center gap-px rounded-md border border-border bg-background p-0.5">
      <button
        type="button"
        onClick={onDecrementar}
        className="flex size-5 items-center justify-center rounded text-text-2 hover:bg-secondary"
      >
        <MinusIcon className="size-3" />
      </button>
      <input
        value={texto}
        onChange={(event) => setTexto(event.target.value.replace(/\D/g, '').slice(0, 2))}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            commit()
            event.currentTarget.blur()
          }
        }}
        onFocus={(event) => event.target.select()}
        inputMode="numeric"
        size={2}
        className="w-[22px] flex-none border-none bg-transparent text-center font-mono text-[12.5px] font-medium outline-none"
      />
      <button
        type="button"
        onClick={onIncrementar}
        className="flex size-5 items-center justify-center rounded text-text-2 hover:bg-secondary"
      >
        <PlusIcon className="size-3" />
      </button>
    </div>
  )
}
