import { useState } from 'react'

import { useSugestoesPendentes } from '@/entities/sugestao'
import { cn } from '@/shared/lib/utils'

import { AbaAlcada } from './AbaAlcada'
import { AbaPrazos } from './AbaPrazos'
import { AbaAprendizado } from './AbaAprendizado'

type Aba = 'aprendizado' | 'alcada' | 'prazos'

// As 3 abas de "Central de regras" (RF-31 a RF-41) — protótipo aprovado, Dispatch.dc.html,
// `isInteligencia`/`abasRegras`. Aprendizado é a aba padrão (mesmo default do protótipo).
export const CentralDeRegrasBoard = () => {
  const [aba, setAba] = useState<Aba>('aprendizado')
  const { data: pendentes } = useSugestoesPendentes()

  return (
    <div>
      <div className="inline-flex gap-0.5 rounded-lg bg-secondary p-0.75">
        {(
          [
            ['aprendizado', `Aprendizado · ${pendentes?.length ?? 0}`],
            ['alcada', 'Alçada'],
            ['prazos', 'Prazos por equipe'],
          ] as const
        ).map(([valor, label]) => (
          <button
            key={valor}
            onClick={() => setAba(valor)}
            className={cn('rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground', aba === valor && 'bg-card text-foreground shadow-sm')}
          >
            {label}
          </button>
        ))}
      </div>

      {aba === 'aprendizado' && <AbaAprendizado />}
      {aba === 'alcada' && <AbaAlcada />}
      {aba === 'prazos' && <AbaPrazos />}
    </div>
  )
}
