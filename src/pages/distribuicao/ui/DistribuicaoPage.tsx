import { useVisaoDistribuicao } from '@/entities/protocolo'
import { useRedistribuirPool } from '@/features/protocolo/redistribuir-pool'
import { Button } from '@/shared/ui/button'
import { DistribuicaoBoard } from '@/widgets/distribuicao-board'

// RF-13 a RF-18. "Importar relatório" (RF-05 a RF-12) é tela própria que ainda não existe —
// o botão do protótipo pra ela fica de fora por enquanto, não faz sentido linkar pra uma rota
// que não existe.
export const DistribuicaoPage = () => {
  const { data: visao } = useVisaoDistribuicao()
  const redistribuir = useRedistribuirPool()

  const ativos = visao ? visao.pool.length + visao.atribuidos.length + visao.emConferencia.length : 0

  return (
    <div className="px-7 pt-6 pb-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-xl font-semibold tracking-[-0.015em]">Distribuição</h1>
          {visao && (
            <p className="mt-1.5 text-[13.5px] text-muted-foreground">
              {ativos} protocolo{ativos === 1 ? '' : 's'} ativo{ativos === 1 ? '' : 's'} · {visao.pool.length} no pool
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => redistribuir.mutate()} disabled={redistribuir.isPending}>
          Redistribuir pool
        </Button>
      </div>

      <div className="mt-4">
        <DistribuicaoBoard />
      </div>
    </div>
  )
}
