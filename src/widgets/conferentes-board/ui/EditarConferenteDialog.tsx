import { isAxiosError } from 'axios'
import { PencilIcon } from 'lucide-react'
import { useState } from 'react'

import type { Conferente } from '@/entities/conferente'
import { useEditarPerfil } from '@/features/conferente/editar-perfil'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

type EditarConferenteDialogProps = {
  conferente: Conferente
}

// RF-25 "editar" — nome/e-mail, mesmo padrão de modal do "Novo conferente" (Dialog +
// Input/Label), só que com dois campos em vez de cinco (nível/jornada continuam editáveis
// direto no card, via stepper/pill — só nome/e-mail entram aqui, é um agregado diferente
// no back: Usuario, não Conferente).
export const EditarConferenteDialog = ({ conferente }: EditarConferenteDialogProps) => {
  const [aberto, setAberto] = useState(false)
  const [nome, setNome] = useState(conferente.nome)
  const [email, setEmail] = useState(conferente.email)
  const editarPerfil = useEditarPerfil()

  const handleAbrir = (valor: boolean) => {
    setAberto(valor)
    if (valor) {
      setNome(conferente.nome)
      setEmail(conferente.email)
      editarPerfil.reset()
    }
  }

  const handleSalvar = () => {
    editarPerfil.mutate({ conferenteId: conferente.id, nome: nome.trim(), email: email.trim() }, { onSuccess: () => setAberto(false) })
  }

  const emailDuplicado = isAxiosError(editarPerfil.error) && editarPerfil.error.response?.status === 409
  const valido = nome.trim().length > 0 && email.trim().length > 0

  return (
    <Dialog open={aberto} onOpenChange={handleAbrir}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex size-5 flex-none items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Editar nome e e-mail"
        >
          <PencilIcon className="size-3" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar conferente</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome-editar">Nome</Label>
            <Input id="nome-editar" value={nome} onChange={(event) => setNome(event.target.value)} autoFocus />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email-editar">E-mail</Label>
            <Input id="email-editar" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>

          {emailDuplicado && <p className="text-[13px] text-bad-fg">Já existe um conferente com esse e-mail.</p>}
          {editarPerfil.isError && !emailDuplicado && <p className="text-[13px] text-bad-fg">Não foi possível salvar. Tente de novo.</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setAberto(false)} disabled={editarPerfil.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={!valido || editarPerfil.isPending}>
            {editarPerfil.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
