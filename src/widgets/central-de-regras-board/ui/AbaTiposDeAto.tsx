import { useState } from 'react'

import { useTiposAtoComUso } from '@/entities/tipoAto'
import { useDebouncedValue } from '@/shared/lib/use-debounced-value'
import { Carregando } from '@/shared/ui/carregando'
import { Input } from '@/shared/ui/input'
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
// — primeira paginação do sistema; o resto do app usa busca + rolagem contida (ver CLAUDE.md).
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
      <div className="mt-5 mb-1 flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-[15px] font-semibold tracking-[-0.01em]">Tipos de ato</h2>
        <NovoTipoAtoDialog />
      </div>
      <p className="m-0 mb-3.5 max-w-[74ch] text-[12.5px] text-pretty text-muted-foreground">
        O catálogo que a importação e as regras de alçada usam. Um tipo desativado não é apagado — só barra protocolos
        novos, que vão para exceção até alguém reativar. Só é possível remover um tipo que não está em uso.
      </p>

      <Input
        value={busca}
        onChange={(e) => handleBusca(e.target.value)}
        placeholder="buscar tipo de ato…"
        className="mb-2"
      />

      {isLoading && !data && <Carregando />}
      {data && data.total === 0 && (
        <p className="text-[13px] text-muted-foreground">
          {busca ? 'Nenhum tipo de ato bate com a busca.' : 'Nenhum tipo de ato cadastrado ainda.'}
        </p>
      )}

      {data && data.total > 0 && (
        <>
          <div className="flex flex-col gap-1.5">
            {data.itens.map((tipo) => (
              <TipoAtoRow key={tipo.id} tipo={tipo} />
            ))}
          </div>

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
