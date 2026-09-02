import { isAxiosError } from 'axios'
import { MinusIcon, PlusIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { GrupoTipoAto, TipoAtoComUso } from '@/entities/tipoAto'
import { GRUPO_LABEL, GRUPOS } from '@/entities/tipoAto'
import { useAlterarStatusTipoAto } from '@/features/tipoAto/alterar-status'
import { useDefinirGrupoTipoAto } from '@/features/tipoAto/definir-grupo'
import { useDefinirPesoTipoAto } from '@/features/tipoAto/definir-peso'
import { useRemoverTipoAto } from '@/features/tipoAto/remover'
import { useRenomearTipoAto } from '@/features/tipoAto/renomear'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { SurfaceCard } from '@/shared/ui/surface-card'

const PESO_MIN = 1
const PESO_MAX = 5

const SEM_GRUPO = '__sem-grupo__'
type TipoAtoRowProps = {
  tipo: TipoAtoComUso
}

// RF-34a-b,d-f — uma linha da tabela: nome edita inline (commit no blur, mesmo padrão de
// EquipeCard), peso via stepper ± OU digitando direto (mesmo padrão de hora/minuto do
// DateTimePicker — input controlado com w-[Npx] fixo, não min-w sozinho, senão o tamanho
// intrínseco do <input> estoura o layout), ativar/desativar e remover com feedback do 409
// "em uso" (RF-34e — mesclar dois tipos, RF-34c, fica de fora, não tem ação aqui pra isso ainda).
export const TipoAtoRow = ({ tipo }: TipoAtoRowProps) => {
  const [nome, setNome] = useState(tipo.nome)
  const [pesoTexto, setPesoTexto] = useState(String(tipo.pesoComplexidade))
  const renomear = useRenomearTipoAto()
  const alterarStatus = useAlterarStatusTipoAto()
  const definirPeso = useDefinirPesoTipoAto()
  const definirGrupo = useDefinirGrupoTipoAto()
  const remover = useRemoverTipoAto()

  useEffect(() => setNome(tipo.nome), [tipo.nome])
  useEffect(() => setPesoTexto(String(tipo.pesoComplexidade)), [tipo.pesoComplexidade])

  const commitNome = () => {
    const aparado = nome.trim()
    if (aparado && aparado !== tipo.nome) {
      renomear.mutate({ tipoAtoId: tipo.id, nome: aparado })
    } else {
      setNome(tipo.nome)
    }
  }

  const aplicarPeso = (novo: number) => {
    const clampado = Math.min(PESO_MAX, Math.max(PESO_MIN, novo))
    if (clampado === tipo.pesoComplexidade) {
      setPesoTexto(String(tipo.pesoComplexidade))
      return
    }
    definirPeso.mutate({ tipoAtoId: tipo.id, peso: clampado })
  }

  const mexerPeso = (delta: number) => aplicarPeso(tipo.pesoComplexidade + delta)

  const commitPesoTexto = () => {
    const numero = Number.parseInt(pesoTexto, 10)
    if (Number.isNaN(numero)) {
      setPesoTexto(String(tipo.pesoComplexidade))
      return
    }
    aplicarPeso(numero)
  }

  const emUso = isAxiosError(remover.error) && remover.error.response?.status === 409

  return (
    <SurfaceCard className={cn('flex flex-wrap items-center gap-3.5 p-3', !tipo.ativo && 'opacity-60')}>
      <input
        value={nome}
        onChange={(event) => setNome(event.target.value)}
        onBlur={commitNome}
        className="min-w-[160px] flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-[13.5px] font-medium text-foreground outline-none hover:border-border focus:border-foreground focus:bg-card"
      />

      <span className="flex-none font-mono text-[11.5px] text-muted-foreground">{tipo.volume} em circulação</span>
      <span className="flex-none font-mono text-[11.5px] text-muted-foreground">{tipo.conferentesComAlcada} com alçada</span>

      <div className="flex flex-none items-center gap-2">
        <span className="text-[11.5px] font-medium text-text-2">Peso</span>
        <div className="flex items-center gap-px rounded-md border border-border bg-background p-0.5">
          <button
            type="button"
            onClick={() => mexerPeso(-1)}
            className="flex size-5 items-center justify-center rounded text-text-2 hover:bg-secondary"
          >
            <MinusIcon className="size-3" />
          </button>
          <input
            value={pesoTexto}
            onChange={(event) => setPesoTexto(event.target.value.replace(/\D/g, ''))}
            onBlur={commitPesoTexto}
            onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
            inputMode="numeric"
            size={2}
            className="w-[20px] flex-none rounded text-center font-mono text-[12.5px] font-medium outline-none focus:bg-secondary"
          />
          <button
            type="button"
            onClick={() => mexerPeso(1)}
            className="flex size-5 items-center justify-center rounded text-text-2 hover:bg-secondary"
          >
            <PlusIcon className="size-3" />
          </button>
        </div>
      </div>

      <Select
        value={tipo.grupo ?? SEM_GRUPO}
        onValueChange={(valor) => definirGrupo.mutate({ tipoAtoId: tipo.id, grupo: valor === SEM_GRUPO ? null : (valor as GrupoTipoAto) })}
      >
        <SelectTrigger size="sm" className="h-7 flex-none text-[11.5px]">
          <SelectValue placeholder="Grupo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SEM_GRUPO}>sem grupo</SelectItem>
          {GRUPOS.map((grupo) => (
            <SelectItem key={grupo} value={grupo}>
              {GRUPO_LABEL[grupo]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        onClick={() => alterarStatus.mutate({ tipoAtoId: tipo.id, ativo: !tipo.ativo })}
        disabled={alterarStatus.isPending}
        className={cn(
          'flex-none rounded-full border px-2.5 py-1 text-xs font-medium',
          tipo.ativo ? 'border-ok-border bg-ok-bg text-ok-fg' : 'border-border bg-card text-text-2',
        )}
      >
        {tipo.ativo ? 'Ativo' : 'Inativo'}
      </button>

      <Button variant="outline" size="sm" onClick={() => remover.mutate(tipo.id)} disabled={remover.isPending} className="flex-none">
        Remover
      </Button>

      {emUso && <p className="w-full text-[12px] text-bad-fg">Em uso — tem protocolo ou regra de alçada apontando pra este tipo.</p>}
    </SurfaceCard>
  )
}
