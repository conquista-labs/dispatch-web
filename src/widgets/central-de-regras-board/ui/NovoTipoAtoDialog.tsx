import { isAxiosError } from 'axios'
import { useState } from 'react'

import { useCriarTipoAto } from '@/features/tipoAto/criar'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

// Cadastro manual — complementa o cadastro automático que a importação já faz (ImportarLote):
// a Distribuidora pode querer registrar um tipo antes dele aparecer num relatório, pra já ter
// alvo pronto pra uma regra de alçada (RF-31). Nome sai normalizado pelo back de qualquer jeito.
export const NovoTipoAtoDialog = () => {
  const [aberto, setAberto] = useState(false)
  const [nome, setNome] = useState('')
  const criar = useCriarTipoAto()

  const handleAbrir = (valor: boolean) => {
    setAberto(valor)
    if (valor) {
      setNome('')
      criar.reset()
    }
  }

  const handleSalvar = () => {
    criar.mutate(nome.trim(), { onSuccess: () => setAberto(false) })
  }

  const jaExiste = isAxiosError(criar.error) && criar.error.response?.status === 409

  return (
    <Dialog open={aberto} onOpenChange={handleAbrir}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Novo tipo de ato
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo tipo de ato</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nome-tipo-ato">Nome</Label>
          <Input id="nome-tipo-ato" value={nome} onChange={(event) => setNome(event.target.value)} autoFocus />
          {jaExiste && <p className="text-[13px] text-bad-fg">Já existe um tipo de ato com esse nome.</p>}
          {criar.isError && !jaExiste && <p className="text-[13px] text-bad-fg">Não foi possível cadastrar. Tente de novo.</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setAberto(false)} disabled={criar.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={nome.trim().length === 0 || criar.isPending}>
            {criar.isPending ? 'Cadastrando…' : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
