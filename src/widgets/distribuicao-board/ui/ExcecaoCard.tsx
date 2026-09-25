import { useState } from 'react'

import { NIVEL_LABEL, type Conferente } from '@/entities/conferente'
import { ETAPA_LABEL, type InfoProtocolo, type ProtocoloResumo } from '@/entities/protocolo'
import { useEhAdministrador } from '@/entities/usuario'
import { useAtribuirManualmente } from '@/features/protocolo/atribuir-manualmente'
import { useDescartarExcecao } from '@/features/protocolo/descartar-excecao'
import { Button } from '@/shared/ui/button'
import { Chip } from '@/shared/ui/chip'
import { SeletorUnico } from '@/shared/ui/seletor-unico'
import { SurfaceCard } from '@/shared/ui/surface-card'

import { apresentacaoDaExcecao } from '../lib/motivo-excecao'

type ExcecaoCardProps = {
  protocolo: ProtocoloResumo
  conferentes: Conferente[]
  info: InfoProtocolo
  onAbrirDetalhe: (protocoloId: string) => void
}

// RF-17 — cada exceção traz o motivo e duas ações: descartar, ou resolver atribuindo na mão a
// um conferente (o motor já disse que não sabe decidir sozinho). "Resolver" abre um seletor
// inline em vez de navegar pra outro lugar — a decisão é rápida, não precisa de tela própria.
export const ExcecaoCard = ({ protocolo, conferentes, info, onAbrirDetalhe }: ExcecaoCardProps) => {
  const ehAdministrador = useEhAdministrador()
  // Protótipo aprovado (Dispatch v2): tipo novo pede alçada definida, e só a administração define
  // alçada (RF-30a). Pra distribuidora a ação vira orientação — sem back-end, decisão do dono.
  const apresentacao = apresentacaoDaExcecao(protocolo.motivoExcecao)
  const pedeAdministracao = !ehAdministrador && apresentacao.tipoNovo
  const [resolvendo, setResolvendo] = useState(false)
  const [conferenteId, setConferenteId] = useState('')
  const atribuir = useAtribuirManualmente()
  const descartar = useDescartarExcecao()
  // Achado numa auditoria de qualidade: as duas mutations disparavam sem tratamento de erro
  // nenhum — se "Resolver"/"Descartar" falhasse, o clique não fazia nada visível. Mesmo padrão
  // de agregação de erro já usado em MinhaFilaBoard.tsx.
  const erro = atribuir.error ?? descartar.error

  const handleConfirmar = () => {
    if (!conferenteId) return
    atribuir.mutate({ protocoloId: protocolo.id, conferenteId }, { onSuccess: () => setResolvendo(false) })
  }

  // RNF-11: mesmo seletor com busca já usado em todo canto que escolhe um conferente/tipo/
  // equipe (ex.: ProtocoloManualDialog) — o Select puro do shadcn (sem busca) destoava do
  // resto do app (achado pelo dono comparando os dois lado a lado).
  const conferenteOpcoes = conferentes.map((c) => ({
    valor: c.id,
    label: c.nome,
    sub: c.nivel ? NIVEL_LABEL[c.nivel] : undefined,
  }))

  return (
    <SurfaceCard className="mb-2 cursor-pointer" onClick={() => onAbrirDetalhe(protocolo.id)}>
      <div className="flex items-start justify-between gap-3.5 max-mobile:flex-col max-mobile:gap-3">
        <div className="min-w-0">
          {/* Protótipo aprovado (Dispatch v2): número + tipo + tag na 1ª linha, a frase do motivo
              embaixo. Tipo desconhecido não tem nome no catálogo — mostra o nome como veio no
              relatório, que é justamente o que a distribuidora precisa ver. */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[12.5px] font-medium">{protocolo.numero}</span>
            <span className="text-[13px] text-pretty text-text-5">
              {info.tipoAtoNome ??
                (protocolo.tipoAtoNomeOriginal ? `“${protocolo.tipoAtoNomeOriginal}”` : 'tipo de ato não informado')}
            </span>
            <Chip tom="atencao">{apresentacao.tag}</Chip>
          </div>
          <div className="mt-1.25 text-[12.5px] leading-snug text-pretty text-text-2">{apresentacao.frase}</div>
          {/* RF-14: escrevente/equipe/etapa — o protótipo não mostra aqui, mas sem equipe o prazo é
              o padrão, e é isso que costuma explicar a exceção; fica numa linha de apoio. */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted-foreground">
            <span className="text-pretty">{info.escreventeNome ?? '—'}</span>
            <span>·</span>
            <span className={info.equipeNome ? undefined : 'text-bad-fg'}>{info.equipeNome ?? 'sem equipe'}</span>
            <span>·</span>
            <span>{ETAPA_LABEL[protocolo.etapa]}</span>
          </div>
          {erro && (
            <div className="mt-1.5 text-[12.5px] text-bad-fg">Não foi possível concluir a ação. Tente de novo.</div>
          )}
          {pedeAdministracao && (
            <div className="mt-1.5 text-[12px] text-muted-foreground">
              Só a administração define alçada — avise o administrador.
            </div>
          )}
        </div>

        {!resolvendo && (
          <div
            className="flex flex-none gap-1.5 max-mobile:w-full max-mobile:*:flex-1"
            onClick={(evento) => evento.stopPropagation()}
          >
            <Button variant="outline" onClick={() => descartar.mutate(protocolo.id)} disabled={descartar.isPending}>
              Descartar
            </Button>
            {pedeAdministracao ? (
              <Button disabled>Pedir à administração</Button>
            ) : (
              <Button onClick={() => setResolvendo(true)}>Resolver</Button>
            )}
          </div>
        )}
      </div>

      {resolvendo && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5" onClick={(evento) => evento.stopPropagation()}>
          <SeletorUnico
            valor={conferenteId}
            opcoes={conferenteOpcoes}
            onSelecionar={setConferenteId}
            placeholder="buscar conferente…"
          />
          <Button variant="outline" onClick={() => setResolvendo(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={!conferenteId || atribuir.isPending}>
            Confirmar
          </Button>
        </div>
      )}
    </SurfaceCard>
  )
}
