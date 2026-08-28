import { useState } from 'react'

import { TIPO_PRAZO_LABEL } from '@/entities/protocolo'
import type { TipoPrazo } from '@/entities/protocolo'
import { useCriarEquipe } from '@/features/equipe/criar'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

import { PillToggle } from './PillToggle'

const TIPOS_PRAZO = Object.keys(TIPO_PRAZO_LABEL) as TipoPrazo[]
const VAZIO = { nome: '', prazoPreConferencia: 'D1' as TipoPrazo, prazoPosConferencia: 'D1' as TipoPrazo }

// RF-35 — diferente do "rascunho" do protótipo (cria com nome fixo, edita depois), aqui o back
// exige os dois prazos já na criação (Prazo é value object obrigatório da Equipe), então um
// modal mínimo em vez do atalho.
export const NovaEquipeDialog = () => {
  const [aberto, setAberto] = useState(false)
  const [form, setForm] = useState(VAZIO)
  const criar = useCriarEquipe()

  const handleAbrir = (valor: boolean) => {
    setAberto(valor)
    if (valor) {
      setForm(VAZIO)
      criar.reset()
    }
  }

  const handleSalvar = () => {
    criar.mutate({ ...form, nome: form.nome.trim() }, { onSuccess: () => setAberto(false) })
  }

  const valido = form.nome.trim().length > 0

  return (
    <Dialog open={aberto} onOpenChange={handleAbrir}>
      <DialogTrigger asChild>
        <Button variant="outline">Nova equipe</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova equipe</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome-equipe">Nome</Label>
            <Input id="nome-equipe" value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} autoFocus />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Prazo de pré-conferência</Label>
            <div className="flex flex-wrap gap-1.5">
              {TIPOS_PRAZO.map((tipo) => (
                <PillToggle
                  key={tipo}
                  label={TIPO_PRAZO_LABEL[tipo]}
                  selecionado={form.prazoPreConferencia === tipo}
                  onClick={() => setForm({ ...form, prazoPreConferencia: tipo })}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Prazo de pós-conferência</Label>
            <div className="flex flex-wrap gap-1.5">
              {TIPOS_PRAZO.map((tipo) => (
                <PillToggle
                  key={tipo}
                  label={TIPO_PRAZO_LABEL[tipo]}
                  selecionado={form.prazoPosConferencia === tipo}
                  onClick={() => setForm({ ...form, prazoPosConferencia: tipo })}
                />
              ))}
            </div>
          </div>

          {criar.isError && <p className="text-[13px] text-bad-fg">Não foi possível criar. Tente de novo.</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setAberto(false)} disabled={criar.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={!valido || criar.isPending}>
            {criar.isPending ? 'Criando…' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
