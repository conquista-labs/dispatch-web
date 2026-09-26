import { ImportarLoteWizard } from '@/widgets/importar-lote-wizard'

// RF-05 a RF-12.
export const ImportarPage = () => (
  <div className="px-7 pt-6 pb-7 max-mobile:px-3.5 max-mobile:pt-4">
    <h1 className="m-0 text-xl font-semibold tracking-[-0.015em]">Importar relatório</h1>
    {/* Sem subtítulo, como no protótipo v2: o stepper vem logo depois do título, e o "nada é
        gravado até você confirmar" já é dito em cada passo. */}
    <div className="mt-4">
      <ImportarLoteWizard />
    </div>
  </div>
)
