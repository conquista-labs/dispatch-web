import { useState } from 'react'

import { useAlcance, useConferentes } from '@/entities/conferente'
import { useEquipes } from '@/entities/equipe'
import { useRegrasAlcada } from '@/entities/regraAlcada'
import { useTiposAto } from '@/entities/tipoAto'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Carregando } from '@/shared/ui/carregando'

import { criarNomesDaCentralDeRegras } from '../lib/nomes'
import { useAlcadaBuilder } from '../model/use-alcada-builder'
import { AbaAlcadaCamadas } from './AbaAlcadaCamadas'
import { AbaAlcadaMatriz } from './AbaAlcadaMatriz'
import { AbaAlcadaTestar } from './AbaAlcadaTestar'
import { AlcadaBuilderCard } from './AlcadaBuilderCard'

type SubAba = 'camadas' | 'matriz' | 'testar'

// RF-31 a RF-34 — motor v3: 3 sub-abas (Camadas/Matriz/Testar), mesmo construtor guiado
// compartilhado entre elas (RF-32), agora com alvo de grupo e permissão de reserva. O
// construtor em si (estado + JSX) mora em useAlcadaBuilder/AlcadaBuilderCard — extraído numa
// auditoria de qualidade, esta função virou só o shell da sub-aba (fetch + as 3 visões).
export const AbaAlcada = () => {
  const { data: regras } = useRegrasAlcada()
  const { data: conferentes } = useConferentes()
  const { data: tiposAto } = useTiposAto()
  const { data: equipes } = useEquipes()
  const { data: alcance } = useAlcance()

  const [subAba, setSubAba] = useState<SubAba>('camadas')

  // Maps/hook calculados com fallback `?? []` e chamados incondicionalmente ANTES do `return`
  // de carregamento abaixo — regra dos hooks (useAlcadaBuilder chama useState/useMutation por
  // dentro, não pode ficar atrás de um `if` condicionado a dado que ainda pode não ter
  // chegado).
  const { nomePorConferenteId, nomePorTipoAtoId, nomePorEquipeId } = criarNomesDaCentralDeRegras(conferentes ?? [], tiposAto ?? [], equipes ?? [])
  const builder = useAlcadaBuilder({
    conferentes: conferentes ?? [],
    equipes: equipes ?? [],
    tiposAto: tiposAto ?? [],
    nomePorConferenteId,
    nomePorTipoAtoId,
    nomePorEquipeId,
  })

  if (!regras || !conferentes || !tiposAto || !equipes || !alcance) {
    return <Carregando />
  }

  return (
    <div>
      <div className="mt-5 mb-1 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="m-0 text-[15px] font-semibold tracking-[-0.01em]">Regras de alçada</h2>
          <p className="m-0 mt-0.5 max-w-[74ch] text-[12.5px] text-muted-foreground text-pretty">
            Quem pode conferir o quê. As regras são lidas em três camadas — a de baixo vence a de cima. Quem está barrado nem recebe o protocolo, e se
            ninguém sobrar o ato vai para exceções com o motivo.
          </p>
        </div>
        {!builder.aberto && (
          <Button variant="outline" size="sm" className="flex-none" onClick={builder.abrir}>
            Nova regra
          </Button>
        )}
      </div>

      <div className="my-3.5 inline-flex gap-0.5 rounded-lg bg-secondary p-0.75">
        {(
          [
            ['camadas', 'Camadas'],
            ['matriz', 'Matriz'],
            ['testar', 'Testar'],
          ] as const
        ).map(([valor, label]) => (
          <button
            key={valor}
            onClick={() => setSubAba(valor)}
            className={cn(
              'rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground',
              subAba === valor && 'bg-card text-foreground shadow-sm',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <AlcadaBuilderCard builder={builder} conferentes={conferentes} />

      {subAba === 'camadas' && (
        <AbaAlcadaCamadas
          regras={regras}
          conferentes={conferentes}
          alcance={alcance}
          totalTipos={tiposAto.length}
          nomePorConferenteId={nomePorConferenteId}
          nomePorTipoAtoId={nomePorTipoAtoId}
          nomePorEquipeId={nomePorEquipeId}
          onAbrirBuilderParaCamada={builder.abrirParaCamada}
        />
      )}
      {subAba === 'matriz' && <AbaAlcadaMatriz conferentes={conferentes} tiposAto={tiposAto} alcance={alcance} />}
      {subAba === 'testar' && <AbaAlcadaTestar conferentes={conferentes} tiposAto={tiposAto} equipes={equipes} />}
    </div>
  )
}
