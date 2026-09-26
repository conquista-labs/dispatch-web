import { useEhAdministrador } from '@/entities/usuario'
import { ConferentesBoard, NovoConferenteDialog, VincularExistenteDialog } from '@/widgets/conferentes-board'

// RF-25 a RF-30. RF-29a: pra distribuidora a tela vira só presença — cadastro, cargo e jornada
// ficam com a administração (o back também barra; aqui só some o que devolveria 403).
export const ConferentesPage = () => {
  const ehAdministrador = useEhAdministrador()

  return (
    <div className="max-w-[960px] px-7 pt-6 pb-7 max-mobile:px-3.5 max-mobile:pt-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-xl font-semibold tracking-[-0.015em]">Conferentes</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">
            {ehAdministrador
              ? 'Quem está na escala hoje, o nível e a jornada de cada um. O nível define a alçada, e a alçada é o que o motor de distribuição consulta.'
              : 'Quem está na escala hoje e quanto cada um tem na mão. Marque ausência aqui — os protocolos da pessoa voltam ao pool na hora. Cadastro e jornada ficam com a administração.'}
          </p>
        </div>
        {ehAdministrador && (
          <div className="flex flex-none flex-wrap gap-2 max-mobile:w-full">
            <VincularExistenteDialog />
            <NovoConferenteDialog />
          </div>
        )}
      </div>

      <div className="mt-5">
        <ConferentesBoard />
      </div>
    </div>
  )
}
