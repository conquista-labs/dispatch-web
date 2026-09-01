import { useState } from 'react'

import type { AlcanceDoConferente, Conferente } from '@/entities/conferente'
import { useRegrasAlcada, type RegraAlcada } from '@/entities/regraAlcada'
import { useCriarRegraAlcada } from '@/features/regra-alcada/criar'
import { useRemoverRegraAlcada } from '@/features/regra-alcada/remover'
import { GRUPO_LABEL, type GrupoTipoAto, type TipoAto } from '@/entities/tipoAto'
import { cn } from '@/shared/lib/utils'
import { Input } from '@/shared/ui/input'

const GRUPOS: GrupoTipoAto[] = ['Transmissoes', 'Sucessoes', 'Familia', 'Garantias', 'Notariais']

type AbaAlcadaMatrizProps = {
  conferentes: Conferente[]
  tiposAto: TipoAto[]
  alcance: AlcanceDoConferente[]
}

// Matriz de alcance (grupo/tipo × pessoa) — RF-34, layout novo do protótipo v2. Diferente do
// protótipo (que deixa uma regra mirar vários tipos num array só), aqui cada clique cria ou
// remove uma regra atômica (o back só aceita um alvo por regra) — clicar num grupo cria/remove
// "pessoa pode conferir atos do grupo X"; clicar num tipo individual (grupo expandido) cria/
// remove "pessoa pode conferir o tipo Y". Simplificação consciente em relação ao protótipo: sem
// o "clicar num grupo já cheio vira negação explícita" — aqui clicar só desfaz a regra que essa
// própria matriz criou; se o alcance vier de outro lugar (nível, alçada plena), a matriz não
// inventa uma regra de bloqueio escondida — quem quer negar usa o construtor guiado, onde a
// escolha "Nega" é explícita.
export const AbaAlcadaMatriz = ({ conferentes, tiposAto, alcance }: AbaAlcadaMatrizProps) => {
  const { data: regras } = useRegrasAlcada()
  const criar = useCriarRegraAlcada()
  const remover = useRemoverRegraAlcada()

  const [busca, setBusca] = useState('')
  const [grupoAberto, setGrupoAberto] = useState<GrupoTipoAto | null>(null)

  if (!regras) {
    return <p className="text-[13.5px] text-muted-foreground">Carregando…</p>
  }

  const alcancePorConferenteId = new Map(alcance.map((a) => [a.conferenteId, a]))
  const q = busca.trim().toLowerCase()

  const regraDeGrupo = (conferenteId: string, grupo: GrupoTipoAto): RegraAlcada | undefined =>
    regras.find((r) => r.ativa && r.permissao === 'Permite' && r.sujeitoConferenteId === conferenteId && r.alvoGrupo === grupo)

  const regraDeTipo = (conferenteId: string, tipoId: string): RegraAlcada | undefined =>
    regras.find((r) => r.ativa && r.permissao === 'Permite' && r.sujeitoConferenteId === conferenteId && r.alvoTipoAtoId === tipoId)

  const alternaGrupo = (conferenteId: string, grupo: GrupoTipoAto) => {
    const existente = regraDeGrupo(conferenteId, grupo)
    if (existente) {
      remover.mutate(existente.id)
    } else {
      criar.mutate({ sujeitoConferenteId: conferenteId, permissao: 'Permite', alvoGrupo: grupo })
    }
  }

  const alternaTipo = (conferenteId: string, tipoId: string) => {
    const existente = regraDeTipo(conferenteId, tipoId)
    if (existente) {
      remover.mutate(existente.id)
    } else {
      criar.mutate({ sujeitoConferenteId: conferenteId, permissao: 'Permite', alvoTipoAtoId: tipoId })
    }
  }

  const grupos = GRUPOS.filter((g) => tiposAto.some((t) => t.grupo === g))

  return (
    <div>
      <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="buscar grupo ou tipo de ato…" className="mb-2.5" />

      <div className="overflow-x-auto rounded-[10px] border border-border bg-card shadow-sm">
        <div className="flex min-w-max border-b border-border bg-card px-3 py-2 text-[11px] font-medium text-text-2">
          <span className="w-[220px] flex-none">Grupo / tipo de ato</span>
          {conferentes.map((c) => (
            <span key={c.id} title={c.nome} className="w-11 flex-none truncate text-center">
              {c.nome.split(' ')[0].slice(0, 4)}
            </span>
          ))}
          <span className="w-20 flex-none text-right">cobertura</span>
        </div>

        {grupos.map((grupo) => {
          const tiposDoGrupo = tiposAto.filter((t) => t.grupo === grupo)
          const visiveis = q ? tiposDoGrupo.filter((t) => t.nome.toLowerCase().includes(q)) : tiposDoGrupo
          if (q && visiveis.length === 0 && !GRUPO_LABEL[grupo].toLowerCase().includes(q)) {
            return null
          }

          const coberturaGrupo = conferentes.filter((c) => {
            const permitidos = alcancePorConferenteId.get(c.id)?.tiposPermitidosIds ?? []
            return tiposDoGrupo.some((t) => permitidos.includes(t.id))
          }).length
          const aberto = grupoAberto === grupo

          return (
            <div key={grupo}>
              <div className="flex min-w-max items-center border-b border-secondary bg-secondary/50 px-3 py-1.5">
                <span className="flex w-[220px] flex-none min-w-0 items-center gap-1.5">
                  <button
                    type="button"
                    data-testid={`expandir-grupo-${grupo}`}
                    onClick={() => setGrupoAberto(aberto ? null : grupo)}
                    className="flex size-[18px] flex-none items-center justify-center rounded border border-border bg-card font-mono text-xs text-text-2 hover:bg-background"
                  >
                    {aberto ? '−' : '+'}
                  </button>
                  <span className="truncate text-[13px] font-semibold">{GRUPO_LABEL[grupo]}</span>
                  <span className="flex-none font-mono text-[10.5px] text-muted-foreground">{tiposDoGrupo.length} tipos</span>
                </span>
                {conferentes.map((c) => {
                  const permitidos = alcancePorConferenteId.get(c.id)?.tiposPermitidosIds ?? []
                  const cobertosPelaPessoa = tiposDoGrupo.filter((t) => permitidos.includes(t.id)).length
                  const cheio = cobertosPelaPessoa === tiposDoGrupo.length
                  const parcial = cobertosPelaPessoa > 0 && !cheio
                  return (
                    <button
                      key={c.id}
                      type="button"
                      title={`${c.nome} · ${cobertosPelaPessoa}/${tiposDoGrupo.length} em ${GRUPO_LABEL[grupo]}`}
                      onClick={() => alternaGrupo(c.id, grupo)}
                      className={cn('w-11 flex-none py-1 text-center text-sm hover:bg-background', cheio ? 'text-foreground' : parcial ? 'text-warn-fg' : 'text-muted-foreground')}
                    >
                      {cheio ? '●' : parcial ? '◐' : '·'}
                    </button>
                  )
                })}
                <span
                  className={cn(
                    'w-20 flex-none text-right text-[11px]',
                    coberturaGrupo === 0 ? 'text-bad-fg' : coberturaGrupo === 1 ? 'text-warn-fg' : 'text-text-2',
                  )}
                >
                  {coberturaGrupo > 0 ? `${coberturaGrupo} pessoas` : 'ninguém'}
                </span>
              </div>

              {aberto &&
                visiveis.map((tipo) => {
                  const comAlcada = conferentes.filter((c) => (alcancePorConferenteId.get(c.id)?.tiposPermitidosIds ?? []).includes(tipo.id)).length
                  return (
                    <div key={tipo.id} className={cn('flex min-w-max items-center border-b border-secondary px-3 py-1', comAlcada === 0 && 'bg-bad-bg')}>
                      <span className="flex w-[220px] flex-none min-w-0 items-center gap-1.5 pl-[25px]">
                        <span className="truncate text-[12.5px] text-text-3">{tipo.nome}</span>
                      </span>
                      {conferentes.map((c) => {
                        const permitidos = alcancePorConferenteId.get(c.id)?.tiposPermitidosIds ?? []
                        const bloq = !permitidos.includes(tipo.id)
                        const excecao = !!regraDeTipo(c.id, tipo.id)
                        return (
                          <button
                            key={c.id}
                            type="button"
                            title={bloq ? `${c.nome}: fora da alçada` : `${c.nome} pode conferir${excecao ? ' (exceção individual)' : ' (herdado do grupo)'}`}
                            onClick={() => alternaTipo(c.id, tipo.id)}
                            className={cn(
                              'w-11 flex-none py-1 text-center text-sm hover:bg-background',
                              bloq ? 'text-muted-foreground' : excecao ? 'text-warn-fg' : 'text-foreground',
                            )}
                          >
                            {bloq ? '·' : excecao ? '◆' : '●'}
                          </button>
                        )
                      })}
                      <span className={cn('w-20 flex-none text-right text-[11px]', comAlcada === 0 ? 'text-bad-fg' : comAlcada === 1 ? 'text-warn-fg' : 'text-muted-foreground')}>
                        {comAlcada > 0 ? `${comAlcada} pessoas` : 'ninguém'}
                      </span>
                    </div>
                  )
                })}
            </div>
          )
        })}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-4 text-[11.5px] text-text-2">
        <span>● pode conferir</span>
        <span className="text-warn-fg">◐ parte do grupo</span>
        <span className="text-warn-fg">◆ exceção individual</span>
        <span className="text-muted-foreground">· não confere</span>
      </div>
      <p className="mt-2 max-w-[78ch] text-[12px] text-pretty text-muted-foreground">
        Clique na linha do <strong>grupo</strong> pra ligar ou desligar a pessoa no grupo inteiro. Expanda e clique num <strong>tipo</strong> pra abrir
        exceção individual, sem tocar no resto do grupo.
      </p>
    </div>
  )
}
