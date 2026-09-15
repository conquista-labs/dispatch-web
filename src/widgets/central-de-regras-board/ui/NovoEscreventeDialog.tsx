import { isAxiosError } from 'axios'
import { useState } from 'react'

import { useEquipes } from '@/entities/equipe'
import { useCriarEscrevente } from '@/features/escrevente/criar'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { SeletorUnico } from '@/shared/ui/seletor-unico'

// Cadastro manual — até aqui um escrevente só nascia como efeito colateral de importar um lote
// ou de criar/editar um protocolo manual com nome novo. Pedido do dono: um jeito deliberado de
// cadastrar sozinho, sem precisar de nenhum protocolo por trás. Equipe é opcional na criação —
// mesma lógica de "sem equipe" já usada no resto da aba (RF-37 aloca depois, se for o caso).
export const NovoEscreventeDialog = () => {
  const [aberto, setAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [equipeId, setEquipeId] = useState<string | null>(null)
  const { data: equipes } = useEquipes({ enabled: aberto })
  const criar = useCriarEscrevente()

  const handleAbrir = (valor: boolean) => {
    setAberto(valor)
    if (valor) {
      setNome('')
      setEquipeId(null)
      criar.reset()
    }
  }

  const handleSalvar = () => {
    criar.mutate({ nome: nome.trim(), equipeId }, { onSuccess: () => setAberto(false) })
  }

  const jaExiste = isAxiosError(criar.error) && criar.error.response?.status === 409
  const opcoesEquipe = [
    { valor: null as string | null, label: 'Sem equipe' },
    ...(equipes ?? []).map((equipe) => ({ valor: equipe.id as string | null, label: equipe.nome })),
  ]

  return (
    <Dialog open={aberto} onOpenChange={handleAbrir}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Novo escrevente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo escrevente</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome-escrevente">Nome</Label>
            <Input id="nome-escrevente" value={nome} onChange={(event) => setNome(event.target.value)} autoFocus />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Equipe (opcional)</Label>
            <SeletorUnico
              valor={equipeId}
              opcoes={opcoesEquipe}
              onSelecionar={setEquipeId}
              placeholder="buscar equipe…"
            />
          </div>

          {jaExiste && <p className="text-[13px] text-bad-fg">Já existe um escrevente com esse nome.</p>}
          {criar.isError && !jaExiste && (
            <p className="text-[13px] text-bad-fg">Não foi possível cadastrar. Tente de novo.</p>
          )}
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
