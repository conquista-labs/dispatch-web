---
name: design-system
description: Tokens de cor, tipografia, logo, tema claro/escuro, primitivos de shared/ui e convenções visuais globais (scrollbar, cursor, loading, badges) do dispatch-web
metadata:
  type: pattern
  domains: [design-system, ui, tema]
  status: stable
---

# Design system

> A fonte é o protótipo aprovado ([ADR-0003](../decisions/0003-prototipo-aprovado-como-fonte-de-design.md)).
> Este documento é a referência de **como** os valores dele vivem no código.

## Quando recorrer a isto

- Escolher cor, fonte, tamanho ou token pra um elemento novo
- Mexer em tema claro/escuro, logo, ou num primitivo de `shared/ui`
- Decidir entre reaproveitar o `Chip`/`SurfaceCard` ou criar algo próprio
- Estranhar uma cor "genérica" num screenshot

## Arquivo protótipo

O protótipo aprovado hoje está em `../dispatch-prototype/Dispatch v2.dc.html` (reexportado em
2026-09-25; todo o histórico e os comentários de código citam o nome antigo `Dispatch.dc.html`).
Os documentos de "opções" (`Logo - opções`, `Tipografia - opções`) não existem mais na pasta —
quando existiam, **não** eram a fonte. `Combo.dc.html` é o componente de seletor com busca
(RNF-11). Como comparar: [verificacao-com-prototipo](verificacao-com-prototipo.md).

## Cores e tokens

- Tudo em `src/app/styles/index.css`. A paleta neutra do protótipo = escala `zinc` do Tailwind
  (`--text:#09090b` = zinc-950, `--ink:#18181b` = zinc-900, `--muted:#a1a1aa` = zinc-400…).
- **Nomes padrão do shadcn** pros tokens semânticos (`--background`, `--card`, `--border`,
  `--primary`, `--muted-foreground`, `--destructive`…) — componente shadcn cru já sai certo, sem
  ponte. `--destructive` = `--bad-fg` do protótipo, então `variant="destructive"` já tem a cor
  certa.
- **Tokens extras** registrados em `@theme inline` (geram classe Tailwind):
  - `--text-2` a `--text-5` → `text-text-2`…`text-text-5` (tons de cinza que o shadcn não prevê).
  - As 4 faixas do semáforo (RF-14, seção 5): ok/atenção/crítico/vencido →
    `--ok-*`/`--warn-*`/`--crit-*`/`--bad-*` com sufixos `-bg`, `-border`, `-fg`, `-bar`
    (`bg-ok-bg`, `text-warn-fg`, `bg-bad-bar`…). O "bar" é a cor mais saturada dos swatches/barras.
  - `--breakpoint-mobile: 760px` ([ADR-0015](../decisions/0015-breakpoint-mobile-760.md)).
- Limiares de cor de percentual (ex.: "cumprimento de prazo" no Dashboard): `>=90%` ok, `>=70%`
  atenção, abaixo vencido — os mesmos do protótipo (`slaEquipes`), com os tokens acima.
- Sintoma de classe errada: algo preto puro ou cinza genérico onde devia haver um tom específico.

## Tema claro/escuro (RF-04)

- `.dark` no `<html>` (convenção shadcn/Tailwind v4), no lugar do `html[data-tema="dark"]` do
  protótipo — valores idênticos.
- `shared/lib/theme-store.ts` (Zustand + `persist`, chave `dispatch-tema`) aplica a classe direto
  no `<html>`. Um **script inline em `index.html`** aplica o tema salvo antes do primeiro paint
  (sem piscar o tema errado enquanto React/Zustand montam).
- A store chama `matchMedia('(prefers-color-scheme: dark)')` **no import** — testes precisam do
  polyfill de `matchMedia` ([testing-strategy](testing-strategy.md)).
- Persistência é **por navegador**, não sincronizada entre dispositivos (o back não tem campo de
  preferência no `Usuario`) — interpretação de "por usuário"; ver [gaps §19–20](../gaps-requisitos.md).
- O toggle só existe na sidebar autenticada; `/login`, TOTP e recuperação de senha seguem o tema
  persistido (ou `prefers-color-scheme`), sem toggle próprio.
- O toast (`shared/ui/sonner.tsx`) usa `useThemeStore`, não `next-themes` ([shadcn-gotchas](shadcn-gotchas.md)).

## Tipografia

- **Instrument Sans** (texto) + **JetBrains Mono** (`font-mono`: número de protocolo, prazo,
  score, qualquer dado tabular/numérico — inclusive os dias do calendário e a letra do dia da
  semana; só o rótulo do mês fica na fonte de texto). Pacotes `@fontsource-variable/*`,
  self-hosted.
- Se um número aparece na fonte de texto comum, falta `font-mono`.
- Px "quebrados" do protótipo (`13.5px`, `11.5px`, `12.5px`, `10.5px`) ficam como valor
  arbitrário (`text-[13.5px]`) — custo aceito de fidelidade ([ADR-0004](../decisions/0004-cva-e-primitivos-contra-parede-de-classes.md)).

## Logo

`src/shared/ui/logo.tsx` — a ampulheta (opção "1d" das explorações, a construída no protótipo:
dois triângulos empilhados, o de cima mais forte, o de baixo mais apagado — a linguagem do
semáforo).

- `variant="on-light"`: crachá escuro, cores via token (segue o tema) — sidebar.
- `variant="on-dark-fixed"`: crachá claro, cores fixas em hex — painel de login, sempre escuro,
  não pode depender de `var(--background)`.
- Tamanhos: 44px (login), 30px (`size="md"`, telas de TOTP/recuperação — card único centralizado),
  26px (resto do app).

## Primitivos de `shared/ui` (quando usar)

| Primitivo                          | Uso                                                                                                                                | Observação                                                                                                                                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Chip`                             | Pílula de prazo/status/faixa (`tom`)                                                                                               | `font-mono text-[11px]`; variante `fonte: 'padrao'` (`10.5px`, sem mono) pras pills de equipe/etapa ([ADR-0016](../decisions/0016-badges-proprios-e-variante-fonte-no-chip.md)) |
| `SurfaceCard`                      | O "card" do protótipo (radius 10px, borda, sombra leve)                                                                            | Variante `tom` tinge o card inteiro pela faixa (atenção/crítico/vencido); `destaque` sempre vence `tom` (`compoundVariants`)                                                    |
| `PillToggle`                       | Seleção preenchida/borda (`bg:var(--ink)` vs `var(--surface)`)                                                                     | Só pra conjuntos pequenos e fixos (etapa, prioridade); lista que cresce usa `SeletorUnico` (RNF-11)                                                                             |
| `SeletorUnico` / `SeletorMultiplo` | Popover + busca (sem acento) + seleção                                                                                             | `sub?` mostra 2ª linha; `permiteValorLivre` aceita nome novo ("usar «busca»", RF-09). `SeletorMultiplo` hoje mora em `widgets/central-de-regras-board/ui/`                      |
| `Carregando`                       | Todo carregamento de tela/dado                                                                                                     | Spinner `Loader2Icon` + texto, `py-14` ([ADR-0018](../decisions/0018-loading-com-spinner-unificado.md))                                                                         |
| `DateTimePicker` / `DatePicker`    | Data+hora (data e hora digitáveis + calendário + steppers + atalhos "Início do dia"/"Agora"/"Pronto") / data nullable com "Limpar" | JetBrains Mono nos dias, letra maiúscula do dia da semana (`formatters.formatWeekdayName`), `locale={ptBR}`; nunca `<input type="date                                           | time">` (RNF-07). Clicar num dia **não** fecha o popover — quem fecha é "Pronto", igual o protótipo |
| `Stepper` / `CampoHorario`         | −/valor/+ e par hora:minuto `"HH:mm"`                                                                                              | `CampoHorario` reaproveita `Stepper` sem calendário                                                                                                                             |
| `Sheet`                            | Drawers (painel de detalhe 432px, filtros, listas completas)                                                                       | `showCloseButton={false}` quando o protótipo tem botão "Fechar" de texto                                                                                                        |
| `Tooltip`                          | Explicação de dado no hover                                                                                                        | `TooltipProvider` único em `app-providers.tsx`, `delayDuration={300}` (não o `0` do shadcn — é explicação, não menu). Antes dele, só `title` nativo                             |
| `Collapsible`                      | Agrupar seções de auditoria                                                                                                        | Ex.: bloco "HISTÓRICO · N" do painel de detalhe, fechado por padrão                                                                                                             |

Badges que **não** usam o `Chip`: `NavBadge` (menu, `var(--text-3)`) e as etiquetas de texto do
`Tag` (`shared/ui/tag.tsx`, `10.5px`, fonte comum, `rounded-full`, `flex-none`), sempre na linha da
meta — nunca na linha do número:

- `tom="critico"` → `PrioridadeAltaTag` ("Alta", `font-semibold`, `bad-*`). Só `Alta` ganha
  destaque visual; `Média`/`Baixa` são informativas/filtráveis.
- `tom="neutro"` → `NumeroConferenciaTag` (RF-24k, "↻ 2ª conferência"): borda **tracejada**
  `text-2`, texto `text-3`, fundo `card`, `font-medium` — copiado do protótipo, pra não parecer
  urgência ao lado do "Alta" e do semáforo. Nada na 1ª conferência. Variantes: `completa` (cards e
  cabeçalho do detalhe), `curta` ("↻ 2ª", coluna estreita de Distribuição → Por conferente; não
  aparece em Por status) e `media` ("↻ 2ª conf.", lista completa da coluna); o texto completo vai
  sempre no `title`.

## Faixa de aviso e destaque de card

- **Faixa de prioridade alta** (`AvisoPrioridadeAlta`, RF-24h): `bg-foreground text-background`
  (o "ink" invertido do protótipo — segue o tema) com a pílula `PrioridadeAltaTag`, `role="status"` +
  `aria-live="polite"`, `sticky top-2.5` no desktop e `max-mobile:top-[116px]` (abaixo do header +
  tira de navegação sticky do `AppShell`, medido a 390px — mudou a altura da barra mobile, confira).
  No celular o texto ocupa a linha e os botões descem, com `min-h-11` (44px).
- **Destaque de card** (RF-24j): `ring-2 ring-foreground motion-safe:animate-anel-destaque` (keyframes
  `anel-destaque` em `app/styles/index.css`), aplicado por ~4,2s via prop `destacado` em
  `ProtocoloCard`/`EmConferenciaCard`; com movimento reduzido fica só o anel. O card expõe
  `data-protocolo-id` pra ser achado e rolado (`scrollIntoView`).

## Rótulos de domínio

`PRIORIDADE_LABEL = { Alta: 'Alta (urgente)', Normal: 'Média', Baixa: 'Baixa' }` — o valor gravado
continua `Normal`. Rótulos ficam em `entities/*/lib/rotulos.ts`
([ADR-0006](../decisions/0006-back-manda-fato-cru-front-resolve-nomes.md)).

## Regras globais em `@layer base`

- **`cursor: pointer`** em `button`/`[role=button]` — regra global, não classe por componente
  (o `shadcn init --no-pointer` tinha desligado; ver [shadcn-gotchas](shadcn-gotchas.md)).
  Regressão em `e2e/cursor.spec.ts`.
- **Scrollbar customizada** (`*`): `scrollbar-width: thin` + `scrollbar-color` (Firefox) e
  `::-webkit-scrollbar*` (Chrome/Safari); 10px, cantos arredondados, respiro via
  `border: 2px solid transparent` + `background-clip: padding-box`; cores `--border` (parado) e
  `--muted-foreground` (hover), que já trocam com o tema. **Não verificada visualmente em
  navegador real** — screenshot headless não pinta a barra ([gaps §24](../gaps-requisitos.md)).

## Estados e textos

- Linha "O QUE O SISTEMA VAI FAZER", "OBSERVAÇÃO", "MARCOU ERRADO? · " são rótulos _eyebrow_
  (maiúsculo, mono) — texto de estado em fonte mono **sem** o eyebrow lê estranho.
- Sem singular/plural em "N atos" onde o protótipo também não trata (`x.total + ' atos'`) — não é
  bug.
- "nenhum" por extenso quando zero no resumo da Distribuição — confirmado no código do protótipo.

## Referências

- [tailwind](tailwind.md), [shadcn-gotchas](shadcn-gotchas.md), [responsive](responsive.md)
