import { NIVEL_LABEL, type Conferente, type Nivel } from '@/entities/conferente'
import { PERMISSAO_LABEL } from '@/entities/regraAlcada'
import { Button } from '@/shared/ui/button'
import { PillToggle } from '@/shared/ui/pill-toggle'
import { SeletorUnico } from '@/shared/ui/seletor-unico'
import { SurfaceCard } from '@/shared/ui/surface-card'

import type { useAlcadaBuilder } from '../model/use-alcada-builder'
import { SeletorMultiplo } from './SeletorMultiplo'

const NIVEIS: Nivel[] = ['Junior', 'Pleno', 'Senior']

type AlcadaBuilderCardProps = {
  builder: ReturnType<typeof useAlcadaBuilder>
  conferentes: Conferente[]
}

// Extraído de AbaAlcada.tsx (achado numa auditoria de qualidade) — o card do construtor
// guiado (RF-32), lógica em `useAlcadaBuilder`. Renderiza null se o construtor não estiver
// aberto (chamador não precisa de um `{builder.aberto && ...}` do lado de fora).
export const AlcadaBuilderCard = ({ builder: b, conferentes }: AlcadaBuilderCardProps) => {
  if (!b.aberto) return null

  return (
    <SurfaceCard className="mb-3.5 border-foreground p-4">
      <div className="text-[14.5px] font-semibold tracking-[-0.01em]">
        {b.quemTexto} {PERMISSAO_LABEL[b.builder.permissao]} {b.alvoTexto}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="w-[60px] flex-none text-[11.5px] font-medium text-text-2">Quem</span>
        {(['nivel', 'pessoa'] as const).map((tipo) => (
          <PillToggle
            key={tipo}
            label={tipo === 'nivel' ? 'Por nível' : 'Por pessoa'}
            selecionado={b.builder.sujeitoTipo === tipo}
            onClick={() =>
              b.setBuilder((atual) => ({
                ...atual,
                sujeitoTipo: tipo,
                sujeitoConferenteId: tipo === 'pessoa' ? (conferentes[0]?.id ?? '') : atual.sujeitoConferenteId,
              }))
            }
          />
        ))}
      </div>
      <div className="mt-1.5 pl-[68px]">
        {b.builder.sujeitoTipo === 'nivel' ? (
          <SeletorUnico
            valor={b.builder.sujeitoNivel}
            opcoes={NIVEIS.map((nivel) => ({ valor: nivel, label: NIVEL_LABEL[nivel] }))}
            onSelecionar={(nivel) => b.setBuilder((atual) => ({ ...atual, sujeitoNivel: nivel }))}
            placeholder="buscar conferente ou nível…"
          />
        ) : (
          <SeletorUnico
            valor={b.builder.sujeitoConferenteId}
            opcoes={conferentes.map((c) => ({ valor: c.id, label: c.nome }))}
            onSelecionar={(id) => b.setBuilder((atual) => ({ ...atual, sujeitoConferenteId: id }))}
            placeholder="buscar conferente ou nível…"
          />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="w-[60px] flex-none text-[11.5px] font-medium text-text-2">Permissão</span>
        <SeletorUnico
          valor={b.builder.permissao}
          opcoes={(['Permite', 'Nega', 'Reserva'] as const).map((permissao) => ({ valor: permissao, label: PERMISSAO_LABEL[permissao] }))}
          onSelecionar={(permissao) => b.setBuilder((atual) => ({ ...atual, permissao }))}
          placeholder="buscar permissão…"
        />
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
            selecionado={b.builder.alvoTipo === tipo}
            onClick={() => b.setBuilder((atual) => ({ ...atual, alvoTipo: tipo, alvoSelecionados: [] }))}
          />
        ))}
      </div>
      {b.builder.alvoTipo !== 'todos' && (
        <div className="mt-1.5 pl-[68px]">
          <SeletorMultiplo
            selecionados={b.builder.alvoSelecionados}
            opcoes={b.alvoOpcoes}
            onAlternar={(valor) =>
              b.setBuilder((atual) => ({
                ...atual,
                alvoSelecionados: atual.alvoSelecionados.includes(valor)
                  ? atual.alvoSelecionados.filter((v) => v !== valor)
                  : [...atual.alvoSelecionados, valor],
              }))
            }
            placeholder="buscar tipo de ato, equipe, grupo…"
          />
        </div>
      )}

      <div className="mt-3.5 flex gap-1.5">
        {b.podeCriar && (
          <Button size="sm" onClick={b.handleCriarRegra} disabled={b.criando}>
            Criar regra
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={b.fechar}>
          Cancelar
        </Button>
      </div>
    </SurfaceCard>
  )
}
