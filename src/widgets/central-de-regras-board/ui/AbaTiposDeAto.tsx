import { useTiposAtoComUso } from '@/entities/tipoAto'
import { Carregando } from '@/shared/ui/carregando'

import { NovoTipoAtoDialog } from './NovoTipoAtoDialog'
import { TipoAtoRow } from './TipoAtoRow'

// RF-34a-b,d-f — catálogo completo, com volume e cobertura de alçada por tipo. RF-34c
// (mesclar dois tipos) fica de fora desta rodada — precisaria migrar as referências de
// Protocolo/RegraAlcada de um Id pro outro, operação maior que só bloquear a exclusão.
export const AbaTiposDeAto = () => {
  const { data: tipos } = useTiposAtoComUso()

  return (
    <div className="max-w-[900px]">
      <div className="mt-5 mb-1 flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-[15px] font-semibold tracking-[-0.01em]">Tipos de ato</h2>
        <NovoTipoAtoDialog />
      </div>
      <p className="m-0 mb-3.5 max-w-[74ch] text-[12.5px] text-muted-foreground text-pretty">
        O catálogo que a importação e as regras de alçada usam. Um tipo desativado não é apagado — só barra protocolos novos, que vão para exceção até
        alguém reativar. Só é possível remover um tipo que não está em uso.
      </p>

      {!tipos && <Carregando />}
      {tipos && tipos.length === 0 && <p className="text-[13px] text-muted-foreground">Nenhum tipo de ato cadastrado ainda.</p>}

      <div className="flex flex-col gap-1.5">
        {tipos?.map((tipo) => <TipoAtoRow key={tipo.id} tipo={tipo} />)}
      </div>
    </div>
  )
}
