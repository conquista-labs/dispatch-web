import { useState } from 'react'

import { useSugestoesPendentes } from '@/entities/sugestao'
import { cn } from '@/shared/lib/utils'

import { AbaAlcada } from './AbaAlcada'
import { AbaPrazos } from './AbaPrazos'
import { AbaAprendizado } from './AbaAprendizado'
import { AbaRegrasEmVigor } from './AbaRegrasEmVigor'
import { AbaTiposDeAto } from './AbaTiposDeAto'

type Aba = 'vigor' | 'aprendizado' | 'alcada' | 'tipos' | 'prazos'

// As 5 abas de "Central de regras" (RF-30b a RF-41) — protótipo aprovado, Dispatch.dc.html,
// `isInteligencia`/`abasRegras`. "Regras em vigor" é a aba padrão (mesmo default do protótipo
// v2 — mudou de "Aprendizado" pra essa quando o dono atualizou o protótipo).
export const CentralDeRegrasBoard = () => {
  const [aba, setAba] = useState<Aba>('vigor')
  const { data: pendentes } = useSugestoesPendentes()

  return (
    <div>
      <div className="inline-flex gap-0.5 rounded-lg bg-secondary p-0.75">
        {(
          [
            ['vigor', 'Regras em vigor'],
            ['aprendizado', `Aprendizado · ${pendentes?.length ?? 0}`],
            ['alcada', 'Alçada'],
            ['tipos', 'Tipos de ato'],
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

      {aba === 'vigor' && <AbaRegrasEmVigor onIrParaAlcada={() => setAba('alcada')} onIrParaTipos={() => setAba('tipos')} onIrParaPrazos={() => setAba('prazos')} />}
      {aba === 'aprendizado' && <AbaAprendizado />}
      {aba === 'alcada' && <AbaAlcada />}
      {aba === 'tipos' && <AbaTiposDeAto />}
      {aba === 'prazos' && <AbaPrazos />}
    </div>
  )
}
