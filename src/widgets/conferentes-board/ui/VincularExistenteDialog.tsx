import { isAxiosError } from 'axios'
import { useState } from 'react'

import type { Nivel } from '@/entities/conferente'
import { NIVEL_LABEL } from '@/entities/conferente'
import { useVincularExistente } from '@/features/conferente/vincular-existente'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

const VAZIO = { email: '', nivel: 'Pleno' as Nivel, jornadaHoras: '8' }

// Pedido do dono: alguém que já tem conta (tipicamente a distribuidora) também confere atos
// pessoalmente — em vez de um segundo cadastro/login, essa ação vincula um Conferente à conta
// já existente (busca por e-mail, RF-25 adjacente). Diferente de "Novo conferente" (que sempre
// cria Usuario+Conferente juntos), aqui não pede nome/senha — a conta já existe.
export const VincularExistenteDialog = () => {
  const [aberto, setAberto] = useState(false)
  const [form, setForm] = useState(VAZIO)
  const vincular = useVincularExistente()

  const handleAbrir = (valor: boolean) => {
    setAberto(valor)
    if (valor) {
      setForm(VAZIO)
      vincular.reset()
    }
  }

  const handleSalvar = () => {
    vincular.mutate(
      { email: form.email.trim(), nivel: form.nivel, jornadaHoras: Number(form.jornadaHoras) },
      { onSuccess: () => setAberto(false) },
    )
  }

  const usuarioNaoEncontrado = isAxiosError(vincular.error) && vincular.error.response?.status === 404
  const jaEhConferente = isAxiosError(vincular.error) && vincular.error.response?.status === 409
  const valido = form.email.trim().length > 0 && Number(form.jornadaHoras) > 0

  return (
    <Dialog open={aberto} onOpenChange={handleAbrir}>
      <DialogTrigger asChild>
        <Button variant="outline">Adicionar alçada a uma conta existente</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar alçada de conferente</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email-vincular">E-mail da conta já cadastrada</Label>
            <Input
              id="email-vincular"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label>Nível</Label>
              <Select value={form.nivel} onValueChange={(valor) => setForm({ ...form, nivel: valor as Nivel })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(NIVEL_LABEL) as Nivel[]).map((nivel) => (
                    <SelectItem key={nivel} value={nivel}>
                      {NIVEL_LABEL[nivel]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="jornada-vincular">Jornada (horas)</Label>
              <Input
                id="jornada-vincular"
                type="number"
                min={2}
                max={12}
                value={form.jornadaHoras}
                onChange={(event) => setForm({ ...form, jornadaHoras: event.target.value })}
              />
            </div>
          </div>

          {usuarioNaoEncontrado && <p className="text-[13px] text-bad-fg">Nenhuma conta com esse e-mail.</p>}
          {jaEhConferente && <p className="text-[13px] text-bad-fg">Essa conta já é conferente.</p>}
          {vincular.isError && !usuarioNaoEncontrado && !jaEhConferente && (
            <p className="text-[13px] text-bad-fg">Não foi possível vincular. Tente de novo.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setAberto(false)} disabled={vincular.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={!valido || vincular.isPending}>
            {vincular.isPending ? 'Vinculando…' : 'Vincular'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
