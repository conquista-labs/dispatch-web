import { useState } from 'react'

import { NIVEL_LABEL, useAlcance, useConferentes } from '@/entities/conferente'
import type { Nivel } from '@/entities/conferente'
import { useEquipes } from '@/entities/equipe'
import { ETAPA_LABEL } from '@/entities/protocolo'
import type { Etapa } from '@/entities/protocolo'
import { PERMISSAO_LABEL, useRegrasAlcada } from '@/entities/regraAlcada'
import type { PermissaoRegra } from '@/entities/regraAlcada'
import { GRUPO_LABEL, useTiposAto } from '@/entities/tipoAto'
import type { GrupoTipoAto } from '@/entities/tipoAto'
import { useCriarRegraAlcada } from '@/features/regra-alcada/criar'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { SurfaceCard } from '@/shared/ui/surface-card'

import { AbaAlcadaCamadas, type Camada } from './AbaAlcadaCamadas'
import { AbaAlcadaMatriz } from './AbaAlcadaMatriz'
import { AbaAlcadaTestar } from './AbaAlcadaTestar'
import { NovoTipoAtoDialog } from './NovoTipoAtoDialog'
import { PillToggle } from './PillToggle'

const NIVEIS: Nivel[] = ['Junior', 'Pleno', 'Senior']
const ETAPAS: Etapa[] = ['PreConferencia', 'PosConferencia']
const GRUPOS: GrupoTipoAto[] = ['Transmissoes', 'Sucessoes', 'Familia', 'Garantias', 'Notariais']

// Sentinela pra "sem equipe" dentro de alvoSelecionados (que só guarda string) — o back
// representa isso com AlvoEquipeId nulo (RF-29a: "sem equipe" é alvo válido, não ausência).
const SEM_EQUIPE = '__sem-equipe__'

type SujeitoTipo = 'nivel' | 'pessoa'
type AlvoTipo = 'tipo' | 'etapa' | 'equipe' | 'todos' | 'grupo'
type SubAba = 'camadas' | 'matriz' | 'testar'

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

// Pré-seleção do construtor a partir dos botões "Nova regra de X" de cada camada (aba
// Camadas) — mesmo espírito do protótipo (cada camada tem seu próprio atalho de criação).
const builderParaCamada = (camada: Camada, primeiroConferenteId: string): Builder => ({
  ...builderVazio(primeiroConferenteId),
  sujeitoTipo: camada === 'nivel' ? 'nivel' : 'pessoa',
  alvoTipo: camada === 'equipe' ? 'equipe' : 'tipo',
})

// RF-31 a RF-34 — motor v3: 3 sub-abas (Camadas/Matriz/Testar), mesmo construtor guiado
// compartilhado entre elas (RF-32), agora com alvo de grupo e permissão de reserva.
export const AbaAlcada = () => {
  const { data: regras } = useRegrasAlcada()
  const { data: conferentes } = useConferentes()
  const { data: tiposAto } = useTiposAto()
  const { data: equipes } = useEquipes()
  const { data: alcance } = useAlcance()

  const criar = useCriarRegraAlcada()

  const [subAba, setSubAba] = useState<SubAba>('camadas')
  const [builderAberto, setBuilderAberto] = useState(false)
  const [builder, setBuilder] = useState<Builder>(builderVazio(''))

  if (!regras || !conferentes || !tiposAto || !equipes || !alcance) {
    return <p className="text-[13.5px] text-muted-foreground">Carregando…</p>
  }

  const nomePorConferenteId = new Map(conferentes.map((c) => [c.id, c.nome]))
  const nomePorTipoAtoId = new Map(tiposAto.map((t) => [t.id, t.nome]))
  const nomePorEquipeId = new Map(equipes.map((e) => [e.id, e.nome]))

  const abrirBuilder = () => {
    setBuilder(builderVazio(conferentes[0]?.id ?? ''))
    setBuilderAberto(true)
  }

  const abrirBuilderParaCamada = (camada: Camada) => {
    setBuilder(builderParaCamada(camada, conferentes[0]?.id ?? ''))
    setBuilderAberto(true)
  }

  const quemTexto =
    builder.sujeitoTipo === 'nivel' ? `Nível ${NIVEL_LABEL[builder.sujeitoNivel]}` : (nomePorConferenteId.get(builder.sujeitoConferenteId) ?? '…')

  const alvoTexto =
    builder.alvoTipo === 'todos'
      ? 'conferir todos os atos'
      : builder.alvoSelecionados.length === 0
        ? '…'
        : builder.alvoTipo === 'etapa'
          ? `fazer ${builder.alvoSelecionados.map((e) => ETAPA_LABEL[e as Etapa]).join(' e ')}`
          : builder.alvoTipo === 'equipe'
            ? `conferir atos ${builder.alvoSelecionados.map((v) => (v === SEM_EQUIPE ? 'de escreventes sem equipe' : `da equipe ${nomePorEquipeId.get(v) ?? v}`)).join(' e ')}`
            : builder.alvoTipo === 'grupo'
              ? `conferir atos de ${builder.alvoSelecionados.map((g) => GRUPO_LABEL[g as GrupoTipoAto]).join(' e ')}`
              : `conferir ${builder.alvoSelecionados.map((id) => nomePorTipoAtoId.get(id) ?? id).join(', ')}`

  const podeCriar =
    (builder.alvoTipo === 'todos' || builder.alvoSelecionados.length > 0) &&
    (builder.sujeitoTipo === 'nivel' || builder.sujeitoConferenteId !== '')

  const handleCriarRegra = async () => {
    const sujeito = builder.sujeitoTipo === 'nivel' ? { sujeitoNivel: builder.sujeitoNivel } : { sujeitoConferenteId: builder.sujeitoConferenteId }

    if (builder.alvoTipo === 'todos') {
      await criar.mutateAsync({ ...sujeito, permissao: builder.permissao, alvoTodosOsAtos: true })
      setBuilderAberto(false)
      return
    }

    // Protótipo permite selecionar vários alvos numa tacada só; o back só aceita um alvo por
    // regra (RF-31: alvo é XOR etapa/tipo/equipe/grupo/todos) — cria uma regra por alvo
    // selecionado pra preservar a mesma UX sem inventar um conceito de "regra composta" que
    // não existe no domínio.
    await Promise.all(
      builder.alvoSelecionados.map((valor) =>
        criar.mutateAsync({
          ...sujeito,
          permissao: builder.permissao,
          ...(builder.alvoTipo === 'etapa'
            ? { alvoEtapa: valor as Etapa }
            : builder.alvoTipo === 'equipe'
              ? { alvoEhEquipe: true, alvoEquipeId: valor === SEM_EQUIPE ? null : valor }
              : builder.alvoTipo === 'grupo'
                ? { alvoGrupo: valor as GrupoTipoAto }
                : { alvoTipoAtoId: valor }),
        }),
      ),
    )
    setBuilderAberto(false)
  }

  const alvoOpcoes =
    builder.alvoTipo === 'etapa'
      ? ETAPAS.map((e) => ({ valor: e, label: ETAPA_LABEL[e] }))
      : builder.alvoTipo === 'equipe'
        ? [...equipes.map((e) => ({ valor: e.id, label: e.nome })), { valor: SEM_EQUIPE, label: 'sem equipe' }]
        : builder.alvoTipo === 'grupo'
          ? GRUPOS.map((g) => ({ valor: g, label: GRUPO_LABEL[g] }))
          : builder.alvoTipo === 'todos'
            ? []
            : tiposAto.map((t) => ({ valor: t.id, label: t.nome }))

  return (
    <div>
      <div className="mt-5 mb-1 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="m-0 text-[15px] font-semibold tracking-[-0.01em]">Regras de alçada</h2>
          <p className="m-0 mt-0.5 max-w-[74ch] text-[12.5px] text-muted-foreground text-pretty">
            Quem pode conferir o quê. As regras são lidas em três camadas — a de baixo vence a de cima. Quem está barrado nem recebe o protocolo, e se
            ninguém sobrar o ato vai para exceções com o motivo.
          </p>
        </div>
        {!builderAberto && (
          <div className="flex flex-none gap-1.5">
            <NovoTipoAtoDialog />
            <Button variant="outline" size="sm" onClick={abrirBuilder}>
              Nova regra
            </Button>
          </div>
        )}
      </div>

      <div className="my-3.5 inline-flex gap-0.5 rounded-lg bg-secondary p-0.75">
        {(
          [
            ['camadas', 'Camadas'],
            ['matriz', 'Matriz'],
            ['testar', 'Testar'],
          ] as const
        ).map(([valor, label]) => (
          <button
            key={valor}
            onClick={() => setSubAba(valor)}
            className={cn(
              'rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground',
              subAba === valor && 'bg-card text-foreground shadow-sm',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {builderAberto && (
        <SurfaceCard className="mb-3.5 border-foreground p-4">
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
            {(['Permite', 'Nega', 'Reserva'] as const).map((permissao) => (
              <PillToggle
                key={permissao}
                label={PERMISSAO_LABEL[permissao]}
                selecionado={builder.permissao === permissao}
                onClick={() => setBuilder((b) => ({ ...b, permissao }))}
              />
            ))}
            {(['grupo', 'tipo', 'etapa', 'equipe', 'todos'] as const).map((tipo) => (
              <PillToggle
                key={tipo}
                label={
                  tipo === 'grupo'
                    ? 'conferir atos de…'
                    : tipo === 'tipo'
                      ? 'conferir os atos…'
                      : tipo === 'etapa'
                        ? 'fazer a etapa…'
                        : tipo === 'equipe'
                          ? 'conferir atos da equipe…'
                          : 'conferir todos os atos'
                }
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

      {subAba === 'camadas' && (
        <AbaAlcadaCamadas
          regras={regras}
          conferentes={conferentes}
          alcance={alcance}
          totalTipos={tiposAto.length}
          nomePorConferenteId={nomePorConferenteId}
          nomePorTipoAtoId={nomePorTipoAtoId}
          nomePorEquipeId={nomePorEquipeId}
          onAbrirBuilderParaCamada={abrirBuilderParaCamada}
        />
      )}
      {subAba === 'matriz' && <AbaAlcadaMatriz conferentes={conferentes} tiposAto={tiposAto} alcance={alcance} />}
      {subAba === 'testar' && <AbaAlcadaTestar conferentes={conferentes} tiposAto={tiposAto} equipes={equipes} />}
    </div>
  )
}
