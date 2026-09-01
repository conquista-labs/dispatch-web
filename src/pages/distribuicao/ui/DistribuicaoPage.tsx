import { Loader2Icon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useVisaoDistribuicao } from '@/entities/protocolo'
import { useRedistribuirPool } from '@/features/protocolo/redistribuir-pool'
import { ROUTES } from '@/shared/config/routes'
import { Button } from '@/shared/ui/button'
import { DistribuicaoBoard } from '@/widgets/distribuicao-board'

// RF-13 a RF-18.
export const DistribuicaoPage = () => {
  const { data: visao } = useVisaoDistribuicao()
  const redistribuir = useRedistribuirPool()
  const navigate = useNavigate()

  const ativos = visao ? visao.pool.length + visao.atribuidos.length + visao.emConferencia.length : 0
  const vencidos = visao ? [...visao.pool, ...visao.atribuidos, ...visao.emConferencia].filter((p) => p.semaforo === 'Vermelho').length : 0

  return (
    <div className="px-7 pt-6 pb-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-xl font-semibold tracking-[-0.015em]">Distribuição</h1>
          {visao && (
            <p className="mt-1.5 text-[13.5px] text-muted-foreground">
              {ativos} protocolos ativos · {visao.pool.length} no pool · {visao.emConferencia.length} em conferência ·{' '}
              {vencidos > 0 ? `${vencidos} com prazo estourado` : 'nenhum prazo estourado'}
            </p>
          )}
        </div>
        <div className="flex flex-none gap-2">
          {/* RF-16: indicador de carregamento no próprio botão — já tinha disabled, faltava o
              feedback visual de "está rodando" (spinner + texto muda). */}
          <Button variant="outline" onClick={() => redistribuir.mutate()} disabled={redistribuir.isPending}>
            {redistribuir.isPending && <Loader2Icon className="size-3.5 animate-spin" />}
            {redistribuir.isPending ? 'Redistribuindo…' : 'Redistribuir pool'}
          </Button>
          <Button onClick={() => navigate(ROUTES.importar)}>Importar relatório</Button>
        </div>
      </div>

      <div className="mt-4">
        <DistribuicaoBoard />
      </div>
    </div>
  )
}
