import { useState } from 'react'

import { Button } from '@/shared/ui/button'

import { useDefinirObservacao } from '../model/use-definir-observacao'

type ObservacaoFieldProps = {
  protocoloId: string
  observacao: string | null
  /**
   * Distribuição mostra a observação mas não deixa editar dali — no protótipo aprovado, o botão
   * "+ Observação"/"Editar observação" só existe no card de Minha fila (quem confere é quem
   * escreve a nota); a Distribuição só lê. Sem isso, nada renderiza quando `observacao` é nulo.
   */
  somenteLeitura?: boolean
}

// RF-15/RF-23: observação livre, editável em qualquer estado do protocolo. Três estados:
// mostrando o valor salvo, editando (textarea), ou vazio (só o botão "+ Observação").
export const ObservacaoField = ({ protocoloId, observacao, somenteLeitura }: ObservacaoFieldProps) => {
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState(observacao ?? '')
  const { mutate, isPending } = useDefinirObservacao()

  const handleClicar = () => {
    if (!editando) {
      setValor(observacao ?? '')
      setEditando(true)
      return
    }

    mutate({ protocoloId, observacao: valor.trim() || null }, { onSuccess: () => setEditando(false) })
  }

  return (
    <>
      {observacao && !editando && (
        <div className="mt-2 rounded-[7px] border border-secondary bg-background p-2 text-[11.5px] leading-snug text-text-3">
          <span className="mb-0.5 block font-mono text-[9.5px] tracking-[0.04em] text-muted-foreground">OBSERVAÇÃO</span>
          {observacao}
        </div>
      )}

      {!somenteLeitura && editando && (
        <textarea
          value={valor}
          onChange={(event) => setValor(event.target.value)}
          placeholder="Ex.: falta certidão negativa do vendedor"
          className="mt-2 min-h-[54px] w-full resize-y rounded-[7px] border border-primary bg-card p-2 text-xs leading-snug text-foreground outline-none"
        />
      )}

      {!somenteLeitura && (
        <Button variant="ghost" onClick={handleClicar} disabled={isPending} className="mt-1.5 h-auto w-full justify-start px-1.5 py-1 text-[11.5px] font-medium">
          {editando ? 'Salvar observação' : observacao ? 'Editar observação' : '+ Observação'}
        </Button>
      )}
    </>
  )
}
