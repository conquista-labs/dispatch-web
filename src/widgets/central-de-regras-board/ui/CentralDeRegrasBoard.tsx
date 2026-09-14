import { useState } from 'react'

import { useSugestoesPendentes } from '@/entities/sugestao'
import { cn } from '@/shared/lib/utils'

import { AbaAlcada } from './AbaAlcada'
import { AbaConfiguracao } from './AbaConfiguracao'
import { AbaPrazos } from './AbaPrazos'
import { AbaAprendizado } from './AbaAprendizado'
import { AbaRegrasEmVigor } from './AbaRegrasEmVigor'
import { AbaTiposDeAto } from './AbaTiposDeAto'

type Aba = 'vigor' | 'aprendizado' | 'alcada' | 'tipos' | 'prazos' | 'config'

// As 6 abas de "Central de regras" (RF-30b a RF-41 + seção 8) — protótipo aprovado,
// Dispatch.dc.html, `isInteligencia`/`abasRegras`. "Regras em vigor" é a aba padrão (mesmo
// default do protótipo v2 — mudou de "Aprendizado" pra essa quando o dono atualizou o
// protótipo). "Configuração" é a mais nova, adicionada quando o protótipo ganhou a aba
// `config` de verdade (os 12 parâmetros da seção 8, antes só editáveis via curl/Swagger).
export const CentralDeRegrasBoard = () => {
  const [aba, setAba] = useState<Aba>('vigor')
  const { data: pendentes } = useSugestoesPendentes()

  return (
    <div>
      <div className="inline-flex max-w-full gap-0.5 overflow-x-auto rounded-lg bg-secondary p-0.75">
        {(
          [
            ['vigor', 'Regras em vigor'],
            ['aprendizado', `Aprendizado · ${pendentes?.length ?? 0}`],
            ['alcada', 'Alçada'],
            ['tipos', 'Tipos de ato'],
            ['prazos', 'Prazos por equipe'],
            ['config', 'Configuração'],
          ] as const
        ).map(([valor, label]) => (
          <button
            key={valor}
            onClick={() => setAba(valor)}
            className={cn(
              'flex-none rounded-md px-3 py-1.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground',
              aba === valor && 'bg-card text-foreground shadow-sm',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {aba === 'vigor' && (
        <AbaRegrasEmVigor
          onIrParaAlcada={() => setAba('alcada')}
          onIrParaTipos={() => setAba('tipos')}
          onIrParaPrazos={() => setAba('prazos')}
          onIrParaConfig={() => setAba('config')}
        />
      )}
      {aba === 'aprendizado' && <AbaAprendizado />}
      {aba === 'alcada' && <AbaAlcada />}
      {aba === 'tipos' && <AbaTiposDeAto />}
      {aba === 'prazos' && <AbaPrazos />}
      {aba === 'config' && <AbaConfiguracao />}
    </div>
  )
}
