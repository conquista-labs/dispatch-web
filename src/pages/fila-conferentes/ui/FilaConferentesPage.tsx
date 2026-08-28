import { useEffect, useState } from 'react'

import { useAlcance, useConferentes, type Nivel } from '@/entities/conferente'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { FilaDoConferenteBoard } from '@/widgets/fila-do-conferente-board'

const NIVEL_LABEL: Record<Nivel, string> = { Junior: 'Júnior', Pleno: 'Pleno', Senior: 'Sênior' }

// RF-19 — protótipo aprovado tem "Minha fila" no menu de quem é gestão também: pra Conferente
// é a própria fila, pra Distribuidora é a fila de quem ela escolher (lá, um botão cicla entre
// conferentes; aqui um seletor de verdade — mais direto quando há mais que dois ou três
// conferentes cadastrados). Sempre somente leitura — RNF-04, os endpoints de ação nem aceitam
// chamada de quem não é o próprio Conferente.
export const FilaConferentesPage = () => {
  const { data: conferentes } = useConferentes()
  const { data: alcance } = useAlcance()
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)

  useEffect(() => {
    if (!selecionadoId && conferentes && conferentes.length > 0) {
      const primeiroNaEscala = conferentes.find((c) => c.naEscala) ?? conferentes[0]
      setSelecionadoId(primeiroNaEscala.id)
    }
  }, [conferentes, selecionadoId])

  const selecionado = conferentes?.find((c) => c.id === selecionadoId)
  const alcanceSelecionado = alcance?.find((a) => a.conferenteId === selecionadoId)

  return (
    <div className="px-7 pt-6 pb-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-xl font-semibold tracking-[-0.015em]">Minha fila</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">
            {selecionado
              ? `${selecionado.nome} · Analista ${NIVEL_LABEL[selecionado.nivel]}${
                  alcanceSelecionado ? ` · pode conferir ${alcanceSelecionado.tiposPermitidosIds.length} tipos de ato` : ''
                }`
              : 'Escolha um conferente pra acompanhar a fila.'}
          </p>
        </div>

        {conferentes && conferentes.length > 0 && (
          <Select value={selecionadoId ?? undefined} onValueChange={setSelecionadoId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Escolher conferente" />
            </SelectTrigger>
            <SelectContent>
              {conferentes.map((conferente) => (
                <SelectItem key={conferente.id} value={conferente.id}>
                  {conferente.nome}
                  {!conferente.naEscala && ' · ausente'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="mt-5">
        {selecionadoId ? (
          <FilaDoConferenteBoard conferenteId={selecionadoId} />
        ) : (
          <p className="text-[13.5px] text-muted-foreground">Nenhum conferente cadastrado ainda.</p>
        )}
      </div>
    </div>
  )
}
