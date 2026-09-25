import { NIVEL_LABEL, type Conferente, type Nivel } from '@/entities/conferente'
import { PERMISSAO_LABEL, type PermissaoRegra } from '@/entities/regraAlcada'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog'
import { PillToggle } from '@/shared/ui/pill-toggle'
import { SeletorUnico } from '@/shared/ui/seletor-unico'

import type { useAlcadaBuilder } from '../model/use-alcada-builder'
import { SeletorMultiplo } from './SeletorMultiplo'

const NIVEIS: Nivel[] = ['Junior', 'Pleno', 'Senior']

// Texto de apoio de cada permissão, do protótipo v2 (lá são 3 cartões; aqui a escolha continua
// num seletor — pedido do dono, ADR-0010 — e a frase explica o efeito da opção escolhida).
const EXPLICA_PERMISSAO: Record<PermissaoRegra, string> = {
  Permite: 'Passa a conferir só o que estiver na lista, dentro dessa dimensão.',
  Nega: 'Fica de fora disso, mesmo que outra regra libere.',
  Reserva: 'Reserva: os demais deixam de conferir isso.',
}

const ROTULO_ALVO = {
  grupo: 'conferir atos de…',
  tipo: 'conferir os atos…',
  etapa: 'fazer a etapa…',
  equipe: 'conferir atos da equipe…',
  equipeEtapa: 'equipe não faz etapa…',
  todos: 'conferir todos os atos',
} as const

type AlcadaBuilderDialogProps = {
  builder: ReturnType<typeof useAlcadaBuilder>
  conferentes: Conferente[]
}

const Passo = ({ numero, titulo, children }: { numero: number; titulo: string; children: React.ReactNode }) => (
  <section>
    <div className="mb-2.5 flex items-baseline gap-2.5">
      <span className="w-3.5 flex-none font-mono text-[11px] font-semibold text-muted-foreground">{numero}</span>
      <span className="text-[13.5px] font-semibold">{titulo}</span>
    </div>
    <div className="pl-6 max-mobile:pl-0">{children}</div>
  </section>
)

// Construtor guiado (RF-32) na moldura do protótipo v2: modal de 760px com a frase da regra ao vivo
// no título, passos 1 Quem / 2 Pode ou não pode / 3 O quê, e um rodapé que diz o que falta antes de
// liberar "Criar regra". Antes era um card inline no topo da aba, que empurrava o conteúdo e só
// mostrava "Criar regra" quando tudo estava escolhido, sem dizer o que faltava. Lógica em
// `useAlcadaBuilder`. Ficam de fora a prévia "Efeito" e o "Por quê" do protótipo: os dois precisam
// do back (simulação e um campo de nota na regra).
export const AlcadaBuilderDialog = ({ builder: b, conferentes }: AlcadaBuilderDialogProps) => {
  const equipeEtapa = b.builder.alvoTipo === 'equipeEtapa'
  const alternarAlvo = (valor: string) =>
    b.setBuilder((atual) => ({
      ...atual,
      alvoSelecionados: atual.alvoSelecionados.includes(valor)
        ? atual.alvoSelecionados.filter((v) => v !== valor)
        : [...atual.alvoSelecionados, valor],
    }))

  return (
    <Dialog open={b.aberto} onOpenChange={(aberto) => !aberto && b.fechar()}>
      <DialogContent className="flex max-h-[calc(100vh-32px)] w-[min(760px,100%)] flex-col gap-0 overflow-hidden rounded-[14px] p-0 sm:max-w-[760px]">
        <div className="flex-none border-b border-border bg-card px-5 pt-4.5 pb-4">
          <span className="font-mono text-[10.5px] font-medium tracking-[0.07em] text-muted-foreground">
            NOVA REGRA DE ALÇADA
          </span>
          <DialogTitle className="mt-1 pr-8 text-[19px] leading-[1.35] font-semibold tracking-[-0.015em] text-pretty">
            {equipeEtapa
              ? // Frase própria, já completa (não "Quem + Permissão + Alvo") — esse alvo é sempre
                // "ninguém, independente de nível", então "Quem" não participa da composição.
                b.alvoTexto
              : `${b.quemTexto} ${PERMISSAO_LABEL[b.builder.permissao]} ${b.alvoTexto}`}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Escolha quem, se pode ou não pode, e o quê. A frase acima mostra a regra que será criada.
          </DialogDescription>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5.5 overflow-y-auto p-5">
          <Passo numero={1} titulo="Quem">
            {equipeEtapa ? (
              // Motor v4 — esse alvo cria a negação pros 3 níveis de uma vez (ver
              // useAlcadaBuilder.handleCriarRegra); escolher um nível aqui não faria sentido.
              <p className="max-w-[60ch] text-[12.5px] text-pretty text-text-2">
                Essa regra vale pra qualquer nível — cria a negação pros 3 juntos (Júnior, Pleno, Sênior), sem precisar
                escolher quem.
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
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
                {b.builder.sujeitoTipo === 'nivel' ? (
                  <SeletorUnico
                    valor={b.builder.sujeitoNivel}
                    opcoes={NIVEIS.map((nivel) => ({ valor: nivel, label: NIVEL_LABEL[nivel] }))}
                    onSelecionar={(nivel) => b.setBuilder((atual) => ({ ...atual, sujeitoNivel: nivel }))}
                    placeholder="buscar nível…"
                  />
                ) : (
                  <SeletorUnico
                    valor={b.builder.sujeitoConferenteId}
                    opcoes={conferentes.map((c) => ({ valor: c.id, label: c.nome }))}
                    onSelecionar={(id) => b.setBuilder((atual) => ({ ...atual, sujeitoConferenteId: id }))}
                    placeholder="buscar conferente…"
                  />
                )}
              </div>
            )}
          </Passo>

          <Passo numero={2} titulo="Pode ou não pode">
            {equipeEtapa ? (
              // Motor v4 — este alvo só aceita Nega (ver useAlcadaBuilder.setAlvoTipo).
              <span className="text-[13px] text-text-2">{PERMISSAO_LABEL.Nega} (fixo pra este alvo)</span>
            ) : (
              <>
                <SeletorUnico
                  valor={b.builder.permissao}
                  opcoes={(['Permite', 'Nega', 'Reserva'] as const).map((permissao) => ({
                    valor: permissao,
                    label: PERMISSAO_LABEL[permissao],
                  }))}
                  onSelecionar={(permissao) => b.setBuilder((atual) => ({ ...atual, permissao }))}
                  placeholder="buscar permissão…"
                />
                <p className="mt-1.5 text-[11.5px] text-pretty text-text-2">{EXPLICA_PERMISSAO[b.builder.permissao]}</p>
              </>
            )}
          </Passo>

          <Passo numero={3} titulo="O quê">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(ROTULO_ALVO) as (keyof typeof ROTULO_ALVO)[]).map((tipo) => (
                <PillToggle
                  key={tipo}
                  label={ROTULO_ALVO[tipo]}
                  selecionado={b.builder.alvoTipo === tipo}
                  onClick={() => b.setAlvoTipo(tipo)}
                />
              ))}
            </div>
            {equipeEtapa ? (
              // Motor v4 — dois seletores (equipe, depois etapa) em vez de um valor composto: o dono
              // achou o select único longo demais e sem dizer qual dimensão cada opção era.
              <div className="mt-2.5 flex flex-wrap items-start gap-3">
                <div>
                  <span className="mb-1 block text-[11px] text-text-2">Equipe</span>
                  <SeletorMultiplo
                    selecionados={b.builder.alvoSelecionados}
                    opcoes={b.alvoOpcoes}
                    onAlternar={alternarAlvo}
                    placeholder="buscar equipe…"
                  />
                </div>
                <div>
                  <span className="mb-1 block text-[11px] text-text-2">Etapa</span>
                  <SeletorMultiplo
                    selecionados={b.builder.equipeEEtapaEtapas}
                    opcoes={b.etapaOpcoes}
                    onAlternar={b.alternarEtapaEquipeEEtapa}
                    placeholder="buscar etapa…"
                  />
                </div>
              </div>
            ) : (
              b.builder.alvoTipo !== 'todos' && (
                <div className="mt-2.5">
                  <SeletorMultiplo
                    selecionados={b.builder.alvoSelecionados}
                    opcoes={b.alvoOpcoes}
                    onAlternar={alternarAlvo}
                    placeholder="buscar tipo de ato, equipe, grupo…"
                  />
                </div>
              )
            )}
          </Passo>
        </div>

        <div className="flex flex-none flex-wrap items-center justify-end gap-2 border-t border-border bg-card px-5 py-3.5">
          <span className="min-w-40 flex-1 text-[12px] text-muted-foreground max-mobile:basis-full">
            {b.falta ?? 'Pronto — confira a frase lá em cima.'}
          </span>
          <Button variant="outline" onClick={b.fechar} className="max-mobile:flex-1">
            Cancelar
          </Button>
          <Button onClick={b.handleCriarRegra} disabled={!b.podeCriar || b.criando} className="max-mobile:flex-1">
            {b.criando ? 'Criando…' : 'Criar regra'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
