import { Link } from 'react-router-dom'

import { usePainelDeHoje } from '@/entities/dashboard'
import { useEquipes } from '@/entities/equipe'
import { ROUTES } from '@/shared/config/routes'
import { cn } from '@/shared/lib/utils'

import { itensDoPainel, textoDoGargalo, type ItemDoPainel, type TomDoItem } from '../lib/painel-de-hoje'

const COR_DO_TOM: Record<NonNullable<TomDoItem>, string> = {
  bad: 'text-bad-fg',
  crit: 'text-crit-fg',
  warn: 'text-warn-fg',
}

const horaCurta = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const ConteudoDoItem = ({ item }: { item: ItemDoPainel }) => (
  <>
    <span className="text-[11.5px] font-medium text-text-2">{item.label}</span>
    <span
      className={cn('text-[22px] leading-tight font-semibold tracking-[-0.02em]', item.tom && COR_DO_TOM[item.tom])}
    >
      {item.valor}
    </span>
    <span className="text-[11px] leading-[1.35] text-apoio">{item.sub}</span>
  </>
)

// RF-42a — "Hoje, agora" (gestão) / "Seu dia" (conferente): o retrato do momento, sem filtro de
// período, acima dos resultados. Na gestão cada célula leva à aba da Distribuição que explica o
// número. Se o endpoint falhar (ex.: API antiga), a faixa simplesmente não aparece — o resto do
// Dashboard não depende dela.
export const FaixaDeHoje = () => {
  const { data: painel } = usePainelDeHoje()
  const { data: equipes } = useEquipes({ enabled: painel?.visao === 'Gestao' && !!painel.gargalo })

  if (!painel) return null

  const gestao = painel.visao === 'Gestao'
  const itens = itensDoPainel(painel)
  const nomePorEquipeId = new Map((equipes ?? []).map((e) => [e.id, e.nome]))
  const gargalo = textoDoGargalo(painel, (id) => nomePorEquipeId.get(id))

  return (
    <section
      aria-label={gestao ? 'Hoje, agora' : 'Seu dia'}
      className="mt-5 overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-secondary px-4 py-2.75">
        <div className="flex items-center gap-2">
          <span className="block size-[7px] flex-none rounded-full bg-ok-fg" />
          <span className="text-[13px] font-semibold">{gestao ? 'Hoje, agora' : 'Seu dia'}</span>
          <span className="text-[12px] text-apoio">atualizado às {horaCurta(painel.atualizadoEm)}</span>
        </div>
        <Link
          to={gestao ? ROUTES.distribuicao : ROUTES.minhaFila}
          className="py-1 text-[12.5px] font-medium text-text-2 hover:text-foreground"
        >
          {gestao ? 'Abrir distribuição →' : 'Abrir minha fila →'}
        </Link>
      </div>

      <div className={cn('grid', gestao ? 'grid-cols-4 max-mobile:grid-cols-2' : 'grid-cols-3 max-mobile:grid-cols-1')}>
        {itens.map((item) =>
          item.destino ? (
            <Link
              key={item.label}
              to={item.destino}
              className="flex min-w-0 flex-col gap-1 border-r border-secondary px-4 py-3.5 text-left hover:bg-secondary max-mobile:border-b"
            >
              <ConteudoDoItem item={item} />
            </Link>
          ) : (
            <div
              key={item.label}
              className="flex min-w-0 flex-col gap-1 border-r border-b border-secondary px-4 py-3.5"
            >
              <ConteudoDoItem item={item} />
            </div>
          ),
        )}
      </div>

      {gargalo && (
        <div className="flex items-center gap-2 bg-warn-bg px-4 py-2.5">
          <span className="font-mono text-[10px] font-semibold tracking-[0.06em] text-warn-fg">GARGALO</span>
          <span className="text-[12.5px] text-pretty text-warn-fg-2">{gargalo}</span>
        </div>
      )}
    </section>
  )
}
