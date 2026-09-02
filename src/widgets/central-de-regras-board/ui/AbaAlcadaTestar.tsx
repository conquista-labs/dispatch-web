import { useState } from 'react'

import { NIVEL_LABEL, type Conferente } from '@/entities/conferente'
import type { Equipe } from '@/entities/equipe'
import { ETAPA_LABEL, PRIORIDADE_LABEL, type Etapa, type Prioridade } from '@/entities/protocolo'
import { fraseDaRegra, MOTIVO_ALCADA_LABEL, useRegrasAlcada, useTestarAlcada, type AvaliacaoAlcada } from '@/entities/regraAlcada'
import type { TipoAto } from '@/entities/tipoAto'
import { cn } from '@/shared/lib/utils'

import { criarNomesDaCentralDeRegras } from '../lib/nomes'
import { SEM_EQUIPE } from '../lib/sem-equipe'
import { Carregando } from '@/shared/ui/carregando'
import { PillToggle } from '@/shared/ui/pill-toggle'

const PRIORIDADES: Prioridade[] = ['Alta', 'Normal', 'Baixa']

type AbaAlcadaTestarProps = {
  conferentes: Conferente[]
  tiposAto: TipoAto[]
  equipes: Equipe[]
}

// Simulador "Testar" da aba Alçada — RF-34, monta um caso hipotético (etapa/equipe/tipo) e
// mostra quem pode/não pode conferir e por quê, camada por camada (Motor v3). Mesmo layout do
// protótipo, sem a seção "SAÍDAS" (sugestões automáticas de ajuste) — o back não calcula isso,
// e inventar aqui contrariaria a regra do projeto de não inventar dado que o servidor não manda.
export const AbaAlcadaTestar = ({ conferentes, tiposAto, equipes }: AbaAlcadaTestarProps) => {
  const { data: regras } = useRegrasAlcada()
  const [etapa, setEtapa] = useState<Etapa>('PosConferencia')
  const [equipeSelecionada, setEquipeSelecionada] = useState<string>(SEM_EQUIPE)
  const [tipoAtoId, setTipoAtoId] = useState<string | null>(tiposAto[0]?.id ?? null)
  const [prioridade, setPrioridade] = useState<Prioridade>('Normal')

  const caso = tipoAtoId ? { etapa, tipoAtoId, equipeId: equipeSelecionada === SEM_EQUIPE ? null : equipeSelecionada, prioridade } : null
  const { data: resultado } = useTestarAlcada(caso)

  if (!regras) {
    return <Carregando />
  }

  const { nomePorConferenteId, nomePorTipoAtoId, nomePorEquipeId } = criarNomesDaCentralDeRegras(conferentes, tiposAto, equipes)
  const regraPorId = new Map(regras.map((r) => [r.id, r]))
  const nivelPorConferenteId = new Map(conferentes.map((c) => [c.id, c.nivel]))

  const fraseDaTrilha = (avaliacao: AvaliacaoAlcada) =>
    avaliacao.trilha.map((passo, indice) => {
      const regra = passo.regraId ? regraPorId.get(passo.regraId) : undefined
      return (
        <div key={indice} className="mt-1 flex items-start gap-1.5">
          <span className={cn('mt-1.5 block size-[5px] flex-none rounded-full', passo.efeito === 'Negado' ? 'bg-bad-fg' : 'bg-ok-fg')} />
          <span className="min-w-0">
            <span className="block font-mono text-[9.5px] tracking-[0.04em] text-muted-foreground">{passo.camada}</span>
            <span className="block text-[11.5px] text-pretty text-text-3">
              {regra
                ? fraseDaRegra(regra, { nomeConferente: (id) => nomePorConferenteId.get(id) ?? '—', nomeTipoAto: (id) => nomePorTipoAtoId.get(id) ?? '—', nomeEquipe: (id) => nomePorEquipeId.get(id) ?? '—' })
                : '—'}
            </span>
          </span>
        </div>
      )
    })

  const habilitados = resultado?.avaliacoes.filter((a) => a.elegivel) ?? []
  const barrados = resultado?.avaliacoes.filter((a) => !a.elegivel) ?? []

  return (
    <div>
      <div className="rounded-[10px] border border-border bg-card p-3.5 shadow-sm">
        <div className="flex flex-wrap items-start gap-2">
          <span className="w-16 flex-none pt-1 text-[11.5px] font-medium text-text-2">Etapa</span>
          <div className="flex flex-wrap gap-1.5">
            {(['PreConferencia', 'PosConferencia'] as const).map((e) => (
              <PillToggle key={e} label={ETAPA_LABEL[e]} selecionado={etapa === e} onClick={() => setEtapa(e)} />
            ))}
          </div>
        </div>
        <div className="mt-2.5 flex flex-wrap items-start gap-2">
          <span className="w-16 flex-none pt-1 text-[11.5px] font-medium text-text-2">Equipe</span>
          <div className="flex flex-wrap gap-1.5">
            <PillToggle redondo label="sem equipe" selecionado={equipeSelecionada === SEM_EQUIPE} onClick={() => setEquipeSelecionada(SEM_EQUIPE)} />
            {equipes.map((e) => (
              <PillToggle key={e.id} redondo label={e.nome} selecionado={equipeSelecionada === e.id} onClick={() => setEquipeSelecionada(e.id)} />
            ))}
          </div>
        </div>
        <div className="mt-2.5 flex flex-wrap items-start gap-2">
          <span className="w-16 flex-none pt-1 text-[11.5px] font-medium text-text-2">Tipo</span>
          <div className="flex max-h-[92px] flex-1 flex-wrap gap-1.5 overflow-y-auto">
            {tiposAto.map((t) => (
              <PillToggle key={t.id} redondo label={t.nome} selecionado={tipoAtoId === t.id} onClick={() => setTipoAtoId(t.id)} />
            ))}
          </div>
        </div>
        {/* RF-34: o destino (pool/atribuído/exceção) depende de urgência, não só de quem tem
            alçada — sem esse campo o simulador não tinha como bater com o motor de verdade. */}
        <div className="mt-2.5 flex flex-wrap items-start gap-2">
          <span className="w-16 flex-none pt-1 text-[11.5px] font-medium text-text-2">Prioridade</span>
          <div className="flex flex-wrap gap-1.5">
            {PRIORIDADES.map((p) => (
              <PillToggle key={p} redondo label={PRIORIDADE_LABEL[p]} selecionado={prioridade === p} onClick={() => setPrioridade(p)} />
            ))}
          </div>
        </div>
      </div>

      {resultado && (
        <>
          <div className={cn('mt-2.5 rounded-[10px] border p-3.5', habilitados.length > 0 ? 'border-ok-border bg-ok-bg' : 'border-bad-border-2 bg-bad-bg')}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className={cn('text-[15px] font-semibold tracking-[-0.01em]', habilitados.length > 0 ? 'text-ok-fg' : 'text-bad-fg')}>
                {habilitados.length > 0 ? `${habilitados.length} pessoa(s) podem conferir` : 'Ninguém pode conferir'}
              </span>
              <span className="text-[12px] text-text-2">
                {resultado.destino === 'Excecao'
                  ? 'iria para a fila de exceções'
                  : resultado.destino === 'EnviadoParaPool'
                    ? 'pool aberto'
                    : `atribuído a ${nomePorConferenteId.get(resultado.conferenteId ?? '')?.split(' ')[0] ?? '—'}`}
              </span>
            </div>
            <div className="mt-1 font-mono text-[11.5px] text-text-2">
              {tipoAtoId ? nomePorTipoAtoId.get(tipoAtoId) : ''} · {equipeSelecionada === SEM_EQUIPE ? 'sem equipe' : nomePorEquipeId.get(equipeSelecionada)} ·{' '}
              {ETAPA_LABEL[etapa].toLowerCase()}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
            <div className="rounded-[10px] border border-border bg-card p-3.5">
              <div className="mb-2 text-[13px] font-semibold">Podem conferir</div>
              {habilitados.map((a) => (
                <div key={a.conferenteId} className="border-t border-secondary py-2 first:border-t-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[13px] font-medium">{nomePorConferenteId.get(a.conferenteId) ?? '—'}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {nivelPorConferenteId.get(a.conferenteId) ? `Analista ${NIVEL_LABEL[nivelPorConferenteId.get(a.conferenteId)!]}` : ''}
                    </span>
                  </div>
                  {a.trilha.length > 0 ? fraseDaTrilha(a) : <div className="mt-1 text-[11.5px] text-muted-foreground">nenhuma regra o alcança — liberado por padrão</div>}
                </div>
              ))}
              {habilitados.length === 0 && <div className="rounded-[8px] border border-dashed border-border p-4 text-center text-[12px] text-muted-foreground">ninguém</div>}
            </div>
            <div className="rounded-[10px] border border-border bg-card p-3.5">
              <div className="mb-2 text-[13px] font-semibold">Barrados e por quê</div>
              {barrados.map((a) => (
                <div key={a.conferenteId} className="border-t border-secondary py-2 first:border-t-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[13px] font-medium text-text-3">{nomePorConferenteId.get(a.conferenteId) ?? '—'}</span>
                    <span className="text-[11px] text-bad-fg">{a.motivo ? MOTIVO_ALCADA_LABEL[a.motivo] : 'barrado'}</span>
                  </div>
                  {fraseDaTrilha(a)}
                </div>
              ))}
              {barrados.length === 0 && <div className="rounded-[8px] border border-dashed border-border p-4 text-center text-[12px] text-muted-foreground">ninguém barrado</div>}
            </div>
          </div>
        </>
      )}

      {tiposAto.length === 0 && <p className="mt-2.5 text-[12.5px] text-muted-foreground">Cadastre um tipo de ato pra poder simular.</p>}
    </div>
  )
}
