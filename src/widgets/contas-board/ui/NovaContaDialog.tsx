import { isAxiosError } from 'axios'
import { useState } from 'react'

import type { PapelDeConta } from '@/entities/conta'
import { gerarSenhaInicial, SENHA_INICIAL_MINIMA } from '@/entities/usuario'
import { useCriarConta } from '@/features/conta/criar'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

// Descrições do protótipo aprovado, com uma correção: lá a Distribuidora "ajusta regras", o que
// contradiz o RF-30a (Central só leitura pra ela) — aqui diz o que ela realmente faz.
const PAPEIS: { valor: PapelDeConta; sub: string }[] = [
  {
    valor: 'Distribuidora',
    sub: 'Distribui, acompanha e marca presença. Não vê cargo nem avaliação, e não edita regras.',
  },
  { valor: 'Administrador', sub: 'Tudo o que a distribuidora faz, mais contas, cargos e avaliação de desempenho.' },
]

const VAZIO = { nome: '', email: '', senha: '', papel: 'Distribuidora' as PapelDeConta }

// Mesma validação leve do protótipo, só pra responder na hora — o back revalida tudo.
const erroDoFormulario = (form: typeof VAZIO): string | null => {
  if (!form.nome.trim() || !form.email.trim() || !form.senha) return 'Preencha nome, e-mail e senha inicial.'
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return 'Esse e-mail não parece válido.'
  if (form.senha.length < SENHA_INICIAL_MINIMA)
    return `A senha inicial precisa ter pelo menos ${SENHA_INICIAL_MINIMA} caracteres.`
  return null
}

const erroDaApi = (erro: unknown): string => {
  const status = isAxiosError(erro) ? erro.response?.status : undefined
  if (status === 409) return 'Já existe uma conta com esse e-mail.'
  if (status === 400) return 'Confira o nome, o e-mail e a senha inicial.'
  return 'Não foi possível criar a conta. Tente de novo.'
}

// RF-45 — criar conta de gestão. A pessoa entra com a senha inicial e é obrigada a trocar no
// primeiro acesso (o back marca a conta; ADR-0040 do dispatch-api).
export const NovaContaDialog = () => {
  const [aberto, setAberto] = useState(false)
  const [form, setForm] = useState(VAZIO)
  const [erroLocal, setErroLocal] = useState<string | null>(null)
  const criar = useCriarConta()

  const handleAbrir = (valor: boolean) => {
    setAberto(valor)
    if (valor) {
      setForm(VAZIO)
      setErroLocal(null)
      criar.reset()
    }
  }

  const mudar = (parcial: Partial<typeof VAZIO>) => {
    setForm((atual) => ({ ...atual, ...parcial }))
    setErroLocal(null)
    criar.reset()
  }

  const handleCriar = () => {
    const erro = erroDoFormulario(form)
    if (erro) return setErroLocal(erro)
    criar.mutate(
      { nome: form.nome.trim(), email: form.email.trim().toLowerCase(), senhaInicial: form.senha, papel: form.papel },
      { onSuccess: () => setAberto(false) },
    )
  }

  const erro = erroLocal ?? (criar.isError ? erroDaApi(criar.error) : null)

  return (
    <Dialog open={aberto} onOpenChange={handleAbrir}>
      <DialogTrigger asChild>
        <Button className="max-mobile:w-full">Criar conta</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-32px)] overflow-y-auto sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Criar conta</DialogTitle>
          <DialogDescription>A pessoa entra com esta senha e troca no primeiro acesso.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="conta-nome">Nome</Label>
            <Input
              id="conta-nome"
              value={form.nome}
              placeholder="Ex.: Letícia Andrade"
              onChange={(event) => mudar({ nome: event.target.value })}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="conta-email">E-mail</Label>
            <Input
              id="conta-email"
              type="email"
              value={form.email}
              placeholder="nome@cartorio.com.br"
              onChange={(event) => mudar({ email: event.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="conta-senha">Senha inicial</Label>
            <div className="flex gap-1.5">
              {/* Texto visível de propósito: quem cria precisa ler a senha pra repassar. */}
              <Input
                id="conta-senha"
                value={form.senha}
                placeholder={`mínimo ${SENHA_INICIAL_MINIMA} caracteres`}
                onChange={(event) => mudar({ senha: event.target.value })}
                className="min-w-0 flex-1 font-mono"
                autoComplete="off"
              />
              <Button type="button" variant="outline" onClick={() => mudar({ senha: gerarSenhaInicial() })}>
                Gerar
              </Button>
            </div>
          </div>

          <div role="radiogroup" aria-label="Papel" className="flex flex-col gap-1.5">
            <span className="text-[11.5px] font-semibold text-text-2">Papel</span>
            {PAPEIS.map((papel) => {
              const selecionado = form.papel === papel.valor
              return (
                <button
                  key={papel.valor}
                  type="button"
                  role="radio"
                  aria-checked={selecionado}
                  onClick={() => mudar({ papel: papel.valor })}
                  className={cn(
                    'flex items-start gap-2.5 rounded-[9px] border px-3 py-2.5 text-left',
                    selecionado ? 'border-foreground bg-secondary' : 'border-border bg-card',
                  )}
                >
                  <span className="mt-px flex size-[15px] flex-none items-center justify-center rounded-full border-[1.5px] border-muted-foreground">
                    <span className={cn('block size-[7px] rounded-full bg-foreground', !selecionado && 'opacity-0')} />
                  </span>
                  <span>
                    <span className="block text-[13px] font-semibold">{papel.valor}</span>
                    <span className="mt-0.5 block text-[12px] leading-[1.4] text-pretty text-text-2">{papel.sub}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {erro && (
          <div
            role="alert"
            className="rounded-lg border border-bad-border bg-bad-bg px-[11px] py-[9px] text-[12.5px] text-bad-fg"
          >
            {erro}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setAberto(false)} disabled={criar.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleCriar} disabled={criar.isPending}>
            {criar.isPending ? 'Criando…' : 'Criar conta'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
