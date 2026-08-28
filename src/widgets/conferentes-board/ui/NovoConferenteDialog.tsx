import { isAxiosError } from 'axios'
import { useState } from 'react'

import type { Nivel } from '@/entities/conferente'
import { useCadastrarConferente } from '@/features/conferente/cadastrar'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

const NIVEL_LABEL: Record<Nivel, string> = { Junior: 'Júnior', Pleno: 'Pleno', Senior: 'Sênior' }

const VAZIO = { nome: '', email: '', senha: '', nivel: 'Pleno' as Nivel, jornadaHoras: '8' }

// RF-25 — o protótipo aprovado cria um "rascunho" na hora (nome fixo "Novo conferente") e edita
// tudo inline depois; aqui não dá pra fazer isso porque o back exige e-mail/senha de verdade
// pra criar o usuário de login junto (CadastrarConferente) — não tem "editar e-mail depois".
// Modal com validação mínima em vez do atalho do protótipo.
export const NovoConferenteDialog = () => {
  const [aberto, setAberto] = useState(false)
  const [form, setForm] = useState(VAZIO)
  const cadastrar = useCadastrarConferente()

  const handleAbrir = (valor: boolean) => {
    setAberto(valor)
    if (valor) {
      setForm(VAZIO)
      cadastrar.reset()
    }
  }

  const handleSalvar = () => {
    cadastrar.mutate(
      { nome: form.nome.trim(), email: form.email.trim(), senha: form.senha, nivel: form.nivel, jornadaHoras: Number(form.jornadaHoras) },
      { onSuccess: () => setAberto(false) },
    )
  }

  const emailDuplicado = isAxiosError(cadastrar.error) && cadastrar.error.response?.status === 409
  const valido = form.nome.trim().length > 0 && form.email.trim().length > 0 && form.senha.length >= 6 && Number(form.jornadaHoras) > 0

  return (
    <Dialog open={aberto} onOpenChange={handleAbrir}>
      <DialogTrigger asChild>
        <Button>Novo conferente</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo conferente</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} autoFocus />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="senha">Senha</Label>
            <Input id="senha" type="password" value={form.senha} onChange={(event) => setForm({ ...form, senha: event.target.value })} />
            <span className="text-[11px] text-muted-foreground">mínimo 6 caracteres</span>
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
              <Label htmlFor="jornada">Jornada (horas)</Label>
              <Input
                id="jornada"
                type="number"
                min={2}
                max={12}
                value={form.jornadaHoras}
                onChange={(event) => setForm({ ...form, jornadaHoras: event.target.value })}
              />
            </div>
          </div>

          {emailDuplicado && <p className="text-[13px] text-bad-fg">Já existe um conferente com esse e-mail.</p>}
          {cadastrar.isError && !emailDuplicado && <p className="text-[13px] text-bad-fg">Não foi possível cadastrar. Tente de novo.</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setAberto(false)} disabled={cadastrar.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={!valido || cadastrar.isPending}>
            {cadastrar.isPending ? 'Salvando…' : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
