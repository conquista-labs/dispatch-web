import { ImportarLoteWizard } from '@/widgets/importar-lote-wizard'

// RF-05 a RF-12.
export const ImportarPage = () => (
  <div className="px-7 pt-6 pb-7">
    <h1 className="m-0 text-xl font-semibold tracking-[-0.015em]">Importar relatório</h1>
    <p className="mt-1.5 text-[13.5px] text-muted-foreground">Cole as linhas do relatório do cartório — nada é gravado até você confirmar.</p>

    <div className="mt-5">
      <ImportarLoteWizard />
    </div>
  </div>
)
