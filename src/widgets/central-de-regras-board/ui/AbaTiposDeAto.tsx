import { useState } from 'react'

import { useTiposAtoComUso } from '@/entities/tipoAto'
import { useDebouncedValue } from '@/shared/lib/use-debounced-value'
import { Carregando } from '@/shared/ui/carregando'
import { Input } from '@/shared/ui/input'
import { SurfaceCard } from '@/shared/ui/surface-card'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/shared/ui/pagination'

import { NovoTipoAtoDialog } from './NovoTipoAtoDialog'
import { TipoAtoRow } from './TipoAtoRow'

const TAMANHO_PAGINA = 20

// RF-34a-b,d-f — catálogo completo, com volume e cobertura de alçada por tipo. RF-34c
// (mesclar dois tipos) fica de fora desta rodada — precisaria migrar as referências de
// Protocolo/RegraAlcada de um Id pro outro, operação maior que só bloquear a exclusão.
//
// Paginado de verdade no back (pedido do dono, catálogo real passou de duas dezenas de itens)
// — primeira paginação do sistema; o resto do app usa busca + rolagem contida (ver
// docs/decisions/0019-listas-longas-busca-no-cliente-paginacao-so-em-tipos-de-ato.md).
export const AbaTiposDeAto = () => {
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)
  const buscaComAtraso = useDebouncedValue(busca)

  const { data, isLoading } = useTiposAtoComUso({
    busca: buscaComAtraso || undefined,
    pagina,
    tamanhoPagina: TAMANHO_PAGINA,
  })
  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / TAMANHO_PAGINA)) : 1

  const handleBusca = (valor: string) => {
    setBusca(valor)
    setPagina(1)
  }

  return (
    <div className="max-w-[900px]">
      <h2 className="m-0 text-xl font-semibold tracking-[-0.015em]">Catálogo de tipos de ato</h2>
      <p className="mt-1.5 mb-3.5 max-w-[74ch] text-[13px] text-pretty text-text-2">
        O catálogo que a importação e as regras de alçada usam. Um tipo desativado não é apagado — só barra protocolos
        novos, que vão para exceção até alguém reativar. Só é possível remover um tipo que não está em uso.
      </p>

      {/* "Novo tipo de ato" ao lado da busca, como no protótipo — é onde se percebe que o tipo não existe. */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input
          value={busca}
          onChange={(e) => handleBusca(e.target.value)}
          placeholder="buscar tipo de ato…"
          className="min-w-[220px] flex-1"
        />
        <NovoTipoAtoDialog />
      </div>

      {isLoading && !data && <Carregando />}
      {data && data.total === 0 && (
        <p className="text-[13px] text-muted-foreground">
          {busca ? 'Nenhum tipo de ato bate com a busca.' : 'Nenhum tipo de ato cadastrado ainda.'}
        </p>
      )}

      {data && data.total > 0 && (
        <>
          <SurfaceCard className="overflow-x-auto p-0">
            <div className="flex min-w-[680px] border-b border-border px-3.5 py-2.25 text-[11.5px] font-medium text-text-2 max-mobile:hidden">
              <span className="min-w-[150px] flex-1">Tipo de ato</span>
              <span className="w-[78px] flex-none text-right" title="conferências concluídas deste tipo">
                Histórico
              </span>
              <span className="w-[104px] flex-none text-right">Complexidade</span>
              <span
                className="w-[150px] flex-none text-right"
                title="tempo esperado para conferir um ato deste tipo; base do ritmo"
              >
                Tempo de referência
              </span>
              <span className="w-[150px] flex-none text-right">Ações</span>
            </div>
            {data.itens.map((tipo) => (
              <TipoAtoRow key={tipo.id} tipo={tipo} />
            ))}
          </SurfaceCard>

          {totalPaginas > 1 && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[11.5px] text-muted-foreground">
                Página {pagina} de {totalPaginas} · {data.total} tipos
              </span>
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      text=""
                      aria-disabled={pagina === 1}
                      className={pagina === 1 ? 'pointer-events-none opacity-40' : ''}
                      onClick={(e) => {
                        e.preventDefault()
                        setPagina((p) => Math.max(1, p - 1))
                      }}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      text=""
                      aria-disabled={pagina === totalPaginas}
                      className={pagina === totalPaginas ? 'pointer-events-none opacity-40' : ''}
                      onClick={(e) => {
                        e.preventDefault()
                        setPagina((p) => Math.min(totalPaginas, p + 1))
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  )
}
