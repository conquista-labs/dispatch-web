import { ConferentesBoard, NovoConferenteDialog } from '@/widgets/conferentes-board'

// RF-25 a RF-30.
export const ConferentesPage = () => (
  <div className="px-7 pt-6 pb-7">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="m-0 text-xl font-semibold tracking-[-0.015em]">Conferentes</h1>
        <p className="mt-1.5 max-w-[70ch] text-[13.5px] text-muted-foreground">
          Quem está na escala hoje, o nível e a jornada de cada um. O nível define a alçada, e a alçada é o que o motor de distribuição consulta.
        </p>
      </div>
      <NovoConferenteDialog />
    </div>

    <div className="mt-5">
      <ConferentesBoard />
    </div>
  </div>
)
