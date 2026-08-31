import { useState } from 'react'

import { NIVEL_LABEL, useAlcance, useConferentes } from '@/entities/conferente'
import type { Nivel } from '@/entities/conferente'
import { ETAPA_LABEL } from '@/entities/protocolo'
import type { Etapa } from '@/entities/protocolo'
import { fraseDaRegra, PERMISSAO_LABEL, useRegrasAlcada } from '@/entities/regraAlcada'
import type { PermissaoRegra } from '@/entities/regraAlcada'
import { useTiposAto } from '@/entities/tipoAto'
import { useAlterarStatusRegraAlcada } from '@/features/regra-alcada/alterar-status'
import { useCriarRegraAlcada } from '@/features/regra-alcada/criar'
import { useRemoverRegraAlcada } from '@/features/regra-alcada/remover'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { SurfaceCard } from '@/shared/ui/surface-card'

import { NovoTipoAtoDialog } from './NovoTipoAtoDialog'
import { PillToggle } from './PillToggle'

const NIVEIS: Nivel[] = ['Junior', 'Pleno', 'Senior']
const ETAPAS: Etapa[] = ['PreConferencia', 'PosConferencia']

type SujeitoTipo = 'nivel' | 'pessoa'
type AlvoTipo = 'tipo' | 'etapa'

type Builder = {
  sujeitoTipo: SujeitoTipo
  sujeitoNivel: Nivel
  sujeitoConferenteId: string
  permissao: PermissaoRegra
  alvoTipo: AlvoTipo
  alvoSelecionados: string[]
}

const builderVazio = (primeiroConferenteId: string): Builder => ({
  sujeitoTipo: 'nivel',
  sujeitoNivel: 'Junior',
  sujeitoConferenteId: primeiroConferenteId,
  permissao: 'Permite',
  alvoTipo: 'tipo',
  alvoSelecionados: [],
})

// RF-31 a RF-34 — regras de alçada: construtor guiado (RF-32), lista com ativar/desativar/
// remover (RF-33) e painel do que cada um alcança hoje (RF-34).
export const AbaAlcada = () => {
  const { data: regras } = useRegrasAlcada()
  const { data: conferentes } = useConferentes()
  const { data: tiposAto } = useTiposAto()
  const { data: alcance } = useAlcance()

  const criar = useCriarRegraAlcada()
  const alterarStatus = useAlterarStatusRegraAlcada()
  const remover = useRemoverRegraAlcada()

  const [builderAberto, setBuilderAberto] = useState(false)
  const [builder, setBuilder] = useState<Builder>(builderVazio(''))

  if (!regras || !conferentes || !tiposAto || !alcance) {
    return <p className="text-[13.5px] text-muted-foreground">Carregando…</p>
  }

  const nomePorConferenteId = new Map(conferentes.map((c) => [c.id, c.nome]))
  const nomePorTipoAtoId = new Map(tiposAto.map((t) => [t.id, t.nome]))
  const alcancePorConferenteId = new Map(alcance.map((a) => [a.conferenteId, a]))

  const abrirBuilder = () => {
    setBuilder(builderVazio(conferentes[0]?.id ?? ''))
    setBuilderAberto(true)
  }

  const quemTexto =
    builder.sujeitoTipo === 'nivel' ? `Nível ${NIVEL_LABEL[builder.sujeitoNivel]}` : (nomePorConferenteId.get(builder.sujeitoConferenteId) ?? '…')

  const alvoTexto =
    builder.alvoSelecionados.length === 0
      ? '…'
      : builder.alvoTipo === 'etapa'
        ? `fazer ${builder.alvoSelecionados.map((e) => ETAPA_LABEL[e as Etapa]).join(' e ')}`
        : `conferir ${builder.alvoSelecionados.map((id) => nomePorTipoAtoId.get(id) ?? id).join(', ')}`

  const podeCriar = builder.alvoSelecionados.length > 0 && (builder.sujeitoTipo === 'nivel' || builder.sujeitoConferenteId !== '')

  const handleCriarRegra = async () => {
    const sujeito = builder.sujeitoTipo === 'nivel' ? { sujeitoNivel: builder.sujeitoNivel } : { sujeitoConferenteId: builder.sujeitoConferenteId }

    // Protótipo permite selecionar vários alvos numa tacada só; o back só aceita um alvo por
    // regra (RF-31: alvo é XOR etapa/tipo) — cria uma regra por alvo selecionado pra preservar
    // a mesma UX sem inventar um conceito de "regra composta" que não existe no domínio.
    await Promise.all(
      builder.alvoSelecionados.map((valor) =>
        criar.mutateAsync({
          ...sujeito,
          permissao: builder.permissao,
          ...(builder.alvoTipo === 'etapa' ? { alvoEtapa: valor as Etapa } : { alvoTipoAtoId: valor }),
        }),
      ),
    )
    setBuilderAberto(false)
  }

  const alvoOpcoes = builder.alvoTipo === 'etapa' ? ETAPAS.map((e) => ({ valor: e, label: ETAPA_LABEL[e] })) : tiposAto.map((t) => ({ valor: t.id, label: t.nome }))

  const totalTipos = tiposAto.length

  return (
    <div>
      <div className="mt-5 mb-1 flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-[15px] font-semibold tracking-[-0.01em]">Regras de alçada</h2>
        {!builderAberto && (
          <div className="flex gap-1.5">
            <NovoTipoAtoDialog />
            <Button variant="outline" size="sm" onClick={abrirBuilder}>
              Nova regra
            </Button>
          </div>
        )}
      </div>
      <p className="m-0 mb-2.5 max-w-[74ch] text-[12.5px] text-muted-foreground text-pretty">
        Quem pode conferir o quê, por nível ou por pessoa. O motor consulta estas frases antes de distribuir — quem está barrado nem recebe o protocolo, e
        se ninguém sobrar o ato vai para exceções com o motivo.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <span className="mr-0.5 text-[11.5px] font-medium text-text-2">Catálogo de tipos de ato ({tiposAto.length})</span>
        {tiposAto.map((t) => (
          <span
            key={t.id}
            className={cn('rounded-full border border-border bg-secondary px-2 py-0.5 text-[11.5px] text-text-3', !t.ativo && 'opacity-50')}
          >
            {t.nome}
          </span>
        ))}
        {tiposAto.length === 0 && <span className="text-[12.5px] text-muted-foreground">nenhum tipo cadastrado ainda</span>}
      </div>

      {builderAberto && (
        <SurfaceCard className="mb-2 border-foreground p-4">
          <div className="text-[14.5px] font-semibold tracking-[-0.01em]">
            {quemTexto} {PERMISSAO_LABEL[builder.permissao]} {alvoTexto}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="w-[60px] flex-none text-[11.5px] font-medium text-text-2">Quem</span>
            {(['nivel', 'pessoa'] as const).map((tipo) => (
              <PillToggle
                key={tipo}
                label={tipo === 'nivel' ? 'Por nível' : 'Por pessoa'}
                selecionado={builder.sujeitoTipo === tipo}
                onClick={() =>
                  setBuilder((b) => ({
                    ...b,
                    sujeitoTipo: tipo,
                    sujeitoConferenteId: tipo === 'pessoa' ? (conferentes[0]?.id ?? '') : b.sujeitoConferenteId,
                  }))
                }
              />
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5 pl-[68px]">
            {builder.sujeitoTipo === 'nivel'
              ? NIVEIS.map((nivel) => (
                  <PillToggle
                    key={nivel}
                    redondo
                    label={NIVEL_LABEL[nivel]}
                    selecionado={builder.sujeitoNivel === nivel}
                    onClick={() => setBuilder((b) => ({ ...b, sujeitoNivel: nivel }))}
                  />
                ))
              : conferentes.map((c) => (
                  <PillToggle
                    key={c.id}
                    redondo
                    label={c.nome}
                    selecionado={builder.sujeitoConferenteId === c.id}
                    onClick={() => setBuilder((b) => ({ ...b, sujeitoConferenteId: c.id }))}
                  />
                ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="w-[60px] flex-none text-[11.5px] font-medium text-text-2">Permissão</span>
            {(['Permite', 'Nega'] as const).map((permissao) => (
              <PillToggle
                key={permissao}
                label={PERMISSAO_LABEL[permissao]}
                selecionado={builder.permissao === permissao}
                onClick={() => setBuilder((b) => ({ ...b, permissao }))}
              />
            ))}
            {(['tipo', 'etapa'] as const).map((tipo) => (
              <PillToggle
                key={tipo}
                label={tipo === 'tipo' ? 'conferir os atos…' : 'fazer a etapa…'}
                selecionado={builder.alvoTipo === tipo}
                onClick={() => setBuilder((b) => ({ ...b, alvoTipo: tipo, alvoSelecionados: [] }))}
              />
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5 pl-[68px]">
            {alvoOpcoes.map((opcao) => (
              <PillToggle
                key={opcao.valor}
                redondo
                label={opcao.label}
                selecionado={builder.alvoSelecionados.includes(opcao.valor)}
                onClick={() =>
                  setBuilder((b) => ({
                    ...b,
                    alvoSelecionados: b.alvoSelecionados.includes(opcao.valor)
                      ? b.alvoSelecionados.filter((v) => v !== opcao.valor)
                      : [...b.alvoSelecionados, opcao.valor],
                  }))
                }
              />
            ))}
          </div>

          <div className="mt-3.5 flex gap-1.5">
            {podeCriar && (
              <Button size="sm" onClick={handleCriarRegra} disabled={criar.isPending}>
                Criar regra
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setBuilderAberto(false)}>
              Cancelar
            </Button>
          </div>
        </SurfaceCard>
      )}

      <div className="flex flex-col gap-1.5">
        {regras.map((regra) => (
          <SurfaceCard key={regra.id} className={cn('flex flex-wrap items-center justify-between gap-3.5 p-3', !regra.ativa && 'opacity-55')}>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-medium text-pretty">{fraseDaRegra(regra, { nomeConferente: (id) => nomePorConferenteId.get(id) ?? '—', nomeTipoAto: (id) => nomePorTipoAtoId.get(id) ?? '—' })}</div>
              <div className="mt-1 font-mono text-[10.5px] text-muted-foreground">{regra.origem === 'Manual' ? 'definida por você' : 'aprendida'}</div>
            </div>
            <div className="flex flex-none gap-1.5">
              <button
                onClick={() => alterarStatus.mutate({ regraId: regra.id, ativa: !regra.ativa })}
                disabled={alterarStatus.isPending}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium',
                  regra.ativa ? 'border-ok-border bg-ok-bg text-ok-fg' : 'border-border bg-card text-text-2',
                )}
              >
                {regra.ativa ? 'Ativa' : 'Inativa'}
              </button>
              <Button variant="outline" size="sm" onClick={() => remover.mutate(regra.id)} disabled={remover.isPending}>
                Remover
              </Button>
            </div>
          </SurfaceCard>
        ))}
        {regras.length === 0 && !builderAberto && <p className="text-[13px] text-muted-foreground">Nenhuma regra criada ainda.</p>}
      </div>

      <h2 className="mt-6.5 mb-2.5 text-[15px] font-semibold tracking-[-0.01em]">O que cada um alcança hoje</h2>
      <SurfaceCard className="p-4">
        {conferentes.map((c) => {
          const a = alcancePorConferenteId.get(c.id)
          const qtd = a?.tiposPermitidosIds.length ?? 0
          const etapasLabel = a && a.etapasPermitidas.length > 0 ? a.etapasPermitidas.map((e) => ETAPA_LABEL[e]).join(' e ') : 'nenhuma etapa liberada'
          const largura = totalTipos > 0 ? Math.round((qtd / totalTipos) * 100) : 0
          return (
            // RNF-10: nome não trunca — items-start (não center) porque o nome agora pode
            // quebrar em mais de uma linha, e os outros campos da linha (barra, contagem,
            // etapas) ganham mt-1 pra ficar alinhados com a primeira linha do nome, não com o
            // meio de um bloco que pode ter 1 ou 2 linhas.
            <div key={c.id} className={cn('flex items-start gap-3 py-1.5', !c.ativo && 'opacity-50')}>
              <span className="w-[130px] flex-none text-[13px] text-pretty">{c.nome}</span>
              <span className="mt-1 w-[110px] flex-none text-[11.5px] text-text-2">Analista {NIVEL_LABEL[c.nivel]}</span>
              <div className="mt-1.5 h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <div className="h-2 rounded-full bg-foreground" style={{ width: `${largura}%` }} />
              </div>
              <span className="mt-1 w-[52px] flex-none text-right font-mono text-[12.5px] font-medium">
                {qtd}/{totalTipos}
              </span>
              <span className="mt-1 w-[150px] flex-none text-right text-[11.5px] text-muted-foreground">{etapasLabel}</span>
            </div>
          )
        })}
      </SurfaceCard>
    </div>
  )
}
