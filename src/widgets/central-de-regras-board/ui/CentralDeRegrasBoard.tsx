import { useState } from 'react'

import { useSugestoesPendentes } from '@/entities/sugestao'
import { useEhAdministrador } from '@/entities/usuario'
import { cn } from '@/shared/lib/utils'

import { AbaAlcada } from './AbaAlcada'
import { AbaConfiguracao } from './AbaConfiguracao'
import { AbaPrazos } from './AbaPrazos'
import { AbaAprendizado } from './AbaAprendizado'
import { AbaRegrasEmVigor } from './AbaRegrasEmVigor'
import { AbaTiposDeAto } from './AbaTiposDeAto'

type Aba = 'vigor' | 'aprendizado' | 'alcada' | 'tipos' | 'prazos' | 'config'

// Mesmos grupos e rótulos do protótipo aprovado (Dispatch v2, `gruposCentral`).
const GRUPOS: { titulo: string; itens: { aba: Aba; label: string }[] }[] = [
  {
    titulo: 'VISÃO',
    itens: [
      { aba: 'vigor', label: 'Regras em vigor' },
      { aba: 'aprendizado', label: 'Aprendizado' },
    ],
  },
  {
    titulo: 'REGRAS',
    itens: [
      { aba: 'alcada', label: 'Alçada' },
      { aba: 'tipos', label: 'Tipos de ato' },
      { aba: 'prazos', label: 'Prazos por equipe' },
    ],
  },
  { titulo: 'SISTEMA', itens: [{ aba: 'config', label: 'Configuração' }] },
]

const TITULO = <h1 className="m-0 text-xl font-semibold tracking-[-0.015em]">Central de regras</h1>

// RF-30b a RF-41 + seção 8. Admin: em tela larga (≥1180px, como no protótipo v2) a navegação vira
// uma coluna fixa à esquerda com os grupos VISÃO/REGRAS/SISTEMA; abaixo disso, título + pílulas que
// quebram de linha (as abas antigas numa tira rolável escondiam as últimas no celular). Os dois
// layouts são só CSS — nada de medir a janela em JS. RF-30a: quem não é Administrador só consulta
// "Regras em vigor" (o back barra o resto com 403; aqui nem aparece).
export const CentralDeRegrasBoard = () => {
  const ehAdministrador = useEhAdministrador()
  const [aba, setAba] = useState<Aba>('vigor')
  const { data: pendentes } = useSugestoesPendentes({ enabled: ehAdministrador })

  if (!ehAdministrador) {
    return (
      <div>
        {TITULO}
        <p className="mt-1.5 max-w-[66ch] text-[13.5px] text-pretty text-text-2">
          As regras que o sistema usa para distribuir: quem pode conferir cada tipo de ato, de onde vem o prazo e os
          parâmetros da operação. Aqui você consulta o que está em vigor — ajustes ficam com a administração.
        </p>
        <AbaRegrasEmVigor />
      </div>
    )
  }

  const badge = (item: Aba) => (item === 'aprendizado' && pendentes && pendentes.length > 0 ? pendentes.length : null)

  return (
    <div className="max-w-[1220px] min-[1180px]:grid min-[1180px]:grid-cols-[188px_minmax(0,1fr)] min-[1180px]:gap-10">
      <aside className="hidden min-[1180px]:block">
        <div className="sticky top-6">
          <h1 className="m-0 text-[17px] font-semibold tracking-[-0.015em]">Central de regras</h1>
          <p className="mt-1.25 text-[12.5px] leading-[1.45] text-pretty text-apoio">
            Como o sistema decide quem confere o quê, e em quanto tempo.
          </p>
          <nav aria-label="Seções da Central de regras" className="mt-5.5 flex flex-col gap-4.5">
            {GRUPOS.map((grupo) => (
              <div key={grupo.titulo} className="flex flex-col gap-0.5">
                <span className="px-2.5 pb-1.25 font-mono text-[10px] font-medium tracking-[0.07em] text-apoio">
                  {grupo.titulo}
                </span>
                {grupo.itens.map((item) => (
                  <button
                    key={item.aba}
                    type="button"
                    onClick={() => setAba(item.aba)}
                    aria-current={aba === item.aba ? 'page' : undefined}
                    className={cn(
                      'flex items-center justify-between gap-2 rounded-[7px] px-2.5 py-1.75 text-left text-[13.5px] hover:bg-secondary hover:text-foreground',
                      aba === item.aba ? 'bg-secondary font-semibold text-foreground' : 'font-medium text-text-2',
                    )}
                  >
                    {item.label}
                    {badge(item.aba) !== null && (
                      <span className="rounded-full bg-foreground px-1.75 font-mono text-[11px] leading-[18px] font-medium text-background">
                        {badge(item.aba)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="min-[1180px]:hidden">
          {TITULO}
          <div className="mt-3.5 mb-1 flex flex-wrap gap-1.5">
            {GRUPOS.flatMap((grupo) => grupo.itens).map((item) => (
              <button
                key={item.aba}
                type="button"
                onClick={() => setAba(item.aba)}
                aria-current={aba === item.aba ? 'page' : undefined}
                className={cn(
                  'flex min-h-8 flex-none items-center gap-1.5 rounded-full border px-3.25 text-[13px] font-medium whitespace-nowrap max-mobile:min-h-10',
                  aba === item.aba
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-card text-text-2 hover:text-foreground',
                )}
              >
                {item.label}
                {badge(item.aba) !== null && <span className="font-mono text-[11px]">· {badge(item.aba)}</span>}
              </button>
            ))}
          </div>
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
    </div>
  )
}
