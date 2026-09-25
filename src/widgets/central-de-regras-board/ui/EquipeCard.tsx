import { useState } from 'react'

import type { Equipe } from '@/entities/equipe'
import type { Escrevente } from '@/entities/escrevente'
import { TIPO_PRAZO_LABEL } from '@/entities/protocolo'
import type { TipoPrazo } from '@/entities/protocolo'
import { useEditarEquipe } from '@/features/equipe/editar'
import { CampoHorario } from '@/shared/ui/campo-horario'
import { SurfaceCard } from '@/shared/ui/surface-card'
import { Switch } from '@/shared/ui/switch'

import { PillToggle } from '@/shared/ui/pill-toggle'

// CorteDeHorario nunca é um TipoPrazo base escolhível pela distribuidora — ele só existe como
// resultado transitório de Equipe.PrazoPara (ver
// dispatch-api/docs/decisions/0037-corte-de-horario-por-equipe-e-etapa.md), então some da lista
// de pills de prazo normal.
const TIPOS_PRAZO = (Object.keys(TIPO_PRAZO_LABEL) as TipoPrazo[]).filter((tipo) => tipo !== 'CorteDeHorario')

const CORTE_PADRAO_HORARIO_CORTE = '16:00'
const CORTE_PADRAO_HORARIO_VENCIMENTO = '10:00'

type EquipeCardProps = {
  equipe: Equipe
  escreventes: Escrevente[]
  selecionadosIds: string[]
  onSelecionarEscrevente: (id: string) => void
  onMoverParaCa: () => void
  movendo: boolean
}

// RF-35/RF-36 — nome edita inline (commit no blur, evita um PUT por tecla já que o back
// recalcula vencimento a cada troca de prazo — RF-38), prazo pré/pós edita direto pelos pills.
export const EquipeCard = ({
  equipe,
  escreventes,
  selecionadosIds,
  onSelecionarEscrevente,
  onMoverParaCa,
  movendo,
}: EquipeCardProps) => {
  const [nome, setNome] = useState(equipe.nome)
  // Ajusta o estado local durante o render, sem efeito (achado ligando mais categorias do
  // oxlint) — mesmo padrão recomendado pelo React pra "resetar estado quando uma prop muda":
  // evita o flash de valor desatualizado que um useEffect (roda depois do paint) causaria.
  const [nomeRefletido, setNomeRefletido] = useState(equipe.nome)
  if (equipe.nome !== nomeRefletido) {
    setNomeRefletido(equipe.nome)
    setNome(equipe.nome)
  }
  const editar = useEditarEquipe()

  // Base comum de todo PUT /equipes/{id} — cada handler só sobrescreve o(s) campo(s) que mudou,
  // preservando o resto intacto (mesmo padrão que alterarPrazo já usava).
  const requestBase = () => ({
    equipeId: equipe.id,
    nome: equipe.nome,
    prazoPreConferencia: equipe.prazoPreConferencia,
    prazoPosConferencia: equipe.prazoPosConferencia,
    cortePreConferenciaHorarioCorte: equipe.cortePreConferenciaHorarioCorte,
    cortePreConferenciaHorarioVencimento: equipe.cortePreConferenciaHorarioVencimento,
    cortePosConferenciaHorarioCorte: equipe.cortePosConferenciaHorarioCorte,
    cortePosConferenciaHorarioVencimento: equipe.cortePosConferenciaHorarioVencimento,
  })

  const commitNome = () => {
    const aparado = nome.trim()
    if (aparado && aparado !== equipe.nome) {
      editar.mutate({ ...requestBase(), nome: aparado })
    } else {
      setNome(equipe.nome)
    }
  }

  const alterarPrazo = (campo: 'prazoPreConferencia' | 'prazoPosConferencia', valor: TipoPrazo) => {
    editar.mutate({ ...requestBase(), [campo]: valor })
  }

  // Pedido do dono ("equipe X entra na etapa Y depois das 16h, vence às 10h do dia seguinte")
  // — acréscimo opcional ao TipoPrazo normal de cada etapa, genérico por Equipe+Etapa. Os dois
  // horários (corte e vencimento) sempre viajam juntos: liga com valores padrão editáveis,
  // desliga limpando os dois — nunca um preenchido e o outro nulo (o back rejeitaria com 400).
  const alterarCorte = (etapa: 'pre' | 'pos', campo: 'horarioCorte' | 'horarioVencimento', valor: string | null) => {
    const prefixo = etapa === 'pre' ? 'cortePreConferencia' : 'cortePosConferencia'
    editar.mutate({
      ...requestBase(),
      [`${prefixo}${campo === 'horarioCorte' ? 'HorarioCorte' : 'HorarioVencimento'}`]: valor,
    })
  }

  const toggleCorte = (etapa: 'pre' | 'pos', ligar: boolean) => {
    const prefixo = etapa === 'pre' ? 'cortePreConferencia' : 'cortePosConferencia'
    editar.mutate({
      ...requestBase(),
      [`${prefixo}HorarioCorte`]: ligar ? CORTE_PADRAO_HORARIO_CORTE : null,
      [`${prefixo}HorarioVencimento`]: ligar ? CORTE_PADRAO_HORARIO_VENCIMENTO : null,
    })
  }

  // Mostra "Mover para cá" se ao menos um dos selecionados ainda não está nesta equipe —
  // selecionar gente de equipes diferentes e mover todos pra uma só é um caso válido.
  const mostrarMover = selecionadosIds.length > 0 && selecionadosIds.some((id) => !escreventes.some((e) => e.id === id))

  return (
    <SurfaceCard className="p-3.5">
      <div className="flex items-start justify-between gap-2.5">
        <input
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          onBlur={commitNome}
          className="-ml-1.5 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-[14px] font-semibold text-foreground outline-none hover:border-border focus:border-foreground focus:bg-card"
        />
        <span className="flex-none rounded-full bg-secondary px-1.75 py-0.25 font-mono text-[11px] whitespace-nowrap text-text-3">
          {escreventes.length} {escreventes.length === 1 ? 'escrevente' : 'escreventes'}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="w-[74px] flex-none text-[11.5px] font-medium text-text-2">Pré-conf.</span>
        <div className="flex flex-wrap gap-1">
          {TIPOS_PRAZO.map((tipo) => (
            <PillToggle
              key={tipo}
              label={TIPO_PRAZO_LABEL[tipo]}
              selecionado={equipe.prazoPreConferencia === tipo}
              onClick={() => alterarPrazo('prazoPreConferencia', tipo)}
            />
          ))}
        </div>
      </div>
      <BlocoCorte
        horarioCorte={equipe.cortePreConferenciaHorarioCorte}
        horarioVencimento={equipe.cortePreConferenciaHorarioVencimento}
        onToggle={(ligar) => toggleCorte('pre', ligar)}
        onAlterarCorte={(valor) => alterarCorte('pre', 'horarioCorte', valor)}
        onAlterarVencimento={(valor) => alterarCorte('pre', 'horarioVencimento', valor)}
      />
      <div className="mt-1.5 flex items-center gap-2">
        <span className="w-[74px] flex-none text-[11.5px] font-medium text-text-2">Pós-conf.</span>
        <div className="flex flex-wrap gap-1">
          {TIPOS_PRAZO.map((tipo) => (
            <PillToggle
              key={tipo}
              label={TIPO_PRAZO_LABEL[tipo]}
              selecionado={equipe.prazoPosConferencia === tipo}
              onClick={() => alterarPrazo('prazoPosConferencia', tipo)}
            />
          ))}
        </div>
      </div>
      <BlocoCorte
        horarioCorte={equipe.cortePosConferenciaHorarioCorte}
        horarioVencimento={equipe.cortePosConferenciaHorarioVencimento}
        onToggle={(ligar) => toggleCorte('pos', ligar)}
        onAlterarCorte={(valor) => alterarCorte('pos', 'horarioCorte', valor)}
        onAlterarVencimento={(valor) => alterarCorte('pos', 'horarioVencimento', valor)}
      />

      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-secondary pt-3">
        {escreventes.length === 0 && (
          <span className="text-xs text-muted-foreground">nenhum escrevente nesta equipe</span>
        )}
        {escreventes.map((esc) => (
          <PillToggle
            key={esc.id}
            redondo
            label={esc.nome}
            selecionado={selecionadosIds.includes(esc.id)}
            onClick={() => onSelecionarEscrevente(esc.id)}
          />
        ))}
      </div>
      {mostrarMover && (
        <button
          onClick={onMoverParaCa}
          disabled={movendo}
          className="mt-2.5 w-full rounded-md border border-dashed border-foreground bg-card py-1.5 text-[12.5px] font-medium hover:bg-secondary disabled:opacity-60"
        >
          {movendo ? 'Movendo…' : 'Mover para cá'}
        </button>
      )}
    </SurfaceCard>
  )
}

type BlocoCorteProps = {
  horarioCorte: string | null
  horarioVencimento: string | null
  onToggle: (ligar: boolean) => void
  onAlterarCorte: (valor: string) => void
  onAlterarVencimento: (valor: string) => void
}

// Pedido do dono ("equipe X entra na etapa Y depois das 16h, vence às 10h do dia seguinte") —
// acréscimo opcional ao TipoPrazo normal de cada etapa (pills acima), não substituição: sem
// corte configurado, o comportamento continua exatamente o de sempre.
//
// Estado otimista local: sem isso, o switch/steppers só refletem a mudança depois do PUT
// completar + refetch (RF-38 recalcula vencimento de todo protocolo aberto da equipe — em
// produção, uma equipe com muitos protocolos abertos faz isso demorar visivelmente, e o Neon
// no plano free ainda pode ter cold start). Mostra a mudança na hora, sem esperar a rede; some
// sozinho assim que os dados reais (equipe.corte*) alcançam o que já foi mostrado — mesmo
// padrão de "nome"/"nomeRefletido" já usado neste arquivo.
const BlocoCorte = ({
  horarioCorte,
  horarioVencimento,
  onToggle,
  onAlterarCorte,
  onAlterarVencimento,
}: BlocoCorteProps) => {
  const [otimista, setOtimista] = useState<{ horarioCorte: string | null; horarioVencimento: string | null } | null>(
    null,
  )
  const [refletido, setRefletido] = useState({ horarioCorte, horarioVencimento })
  if (refletido.horarioCorte !== horarioCorte || refletido.horarioVencimento !== horarioVencimento) {
    setRefletido({ horarioCorte, horarioVencimento })
    setOtimista(null)
  }

  const exibido = otimista ?? { horarioCorte, horarioVencimento }
  const ativo = exibido.horarioCorte !== null && exibido.horarioVencimento !== null

  const handleToggle = (ligar: boolean) => {
    setOtimista(
      ligar
        ? { horarioCorte: CORTE_PADRAO_HORARIO_CORTE, horarioVencimento: CORTE_PADRAO_HORARIO_VENCIMENTO }
        : { horarioCorte: null, horarioVencimento: null },
    )
    onToggle(ligar)
  }

  const handleAlterarCorte = (valor: string) => {
    setOtimista({ ...exibido, horarioCorte: valor })
    onAlterarCorte(valor)
  }

  const handleAlterarVencimento = (valor: string) => {
    setOtimista({ ...exibido, horarioVencimento: valor })
    onAlterarVencimento(valor)
  }

  return (
    <div className="mt-1.5 ml-[82px] flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1.5 text-[11px] text-text-2">
        <Switch size="sm" checked={ativo} onCheckedChange={handleToggle} />
        corte de horário
      </label>
      {ativo && (
        <>
          <span className="text-[10.5px] text-muted-foreground">depois de</span>
          <CampoHorario value={exibido.horarioCorte!} onChange={handleAlterarCorte} />
          <span className="text-[10.5px] text-muted-foreground">vence às</span>
          <CampoHorario value={exibido.horarioVencimento!} onChange={handleAlterarVencimento} />
          <span className="text-[10.5px] text-muted-foreground">do dia seguinte</span>
        </>
      )}
    </div>
  )
}
