---
name: shadcn-gotchas
description: Todas as armadilhas já pagas ao instalar e usar componentes shadcn/ui neste projeto (Vite + alias customizado) — config, imports quebrados, dependências fantasmas, bugs nos componentes gerados, Radix
metadata:
  type: pattern
  domains: [shadcn, radix, ui, tooling]
  status: stable
---

# Armadilhas do shadcn/ui

> Leia antes de `npx shadcn@latest add <x>` (a skill `add-shadcn-component` executa o fluxo) e
> sempre que um componente gerado parecer "sem efeito".

## Quando recorrer a isto

- Instalar um componente shadcn novo
- Um componente gerado compila mas não funciona/não aparece
- Popover/Select/Calendar se comportando estranho

## Princípio

**Veja se o shadcn tem antes de construir do zero** (cobrança explícita do dono, "nada de fazer
as coisas do 0"). O `Sheet` do painel de detalhe deu de graça animação, overlay com blur e fechar
por Esc/clique fora. Ao mesmo tempo, o CLI **gera código que às vezes precisa de ajuste** — trate
todo arquivo gerado como código seu (por isso eles ficam no denominador de cobertura,
[ADR-0012](../decisions/0012-cobertura-com-ratchet-e-rtl.md)).

## Configuração (pagas no init)

1. **A CLI não resolve `@/*` sem `baseUrl` no `tsconfig.json` da raiz.** Só `tsconfig.app.json`
   (com `paths`, sem `baseUrl`, que o TS 6+ deprecia) fazia a CLI criar uma pasta `@` literal.
   `baseUrl`/`paths` duplicados no `tsconfig.json` raiz, com `ignoreDeprecations: "6.0"` — só pra
   ferramentas que não seguem `references`. Sintoma: componente caindo numa pasta `@/` na raiz.
2. **`components.json` aponta por padrão pra `@/components/ui` e `@/lib`, fora da FSD.** No init,
   `"components"`/`"ui"` → `@/shared/ui` e `"utils"`/`"lib"` → `@/shared/lib`. **Desde 2026-09-25
   `"components"`/`"ui"` apontam pra `@/shared/ui/generated` (quarentena)** — ver abaixo; não
   "corrija" esse alias de volta.
3. **Campo `"pointer": true` no `components.json` quebra todo `shadcn add`** ("Invalid
   configuration found in components.json"). Foi herdado por engano de um flag de _init_ tratado
   como campo persistível. Removido — não recoloque.
4. **`shadcn init --no-pointer` desligou `cursor: pointer` nos botões.** Correção: regra global em
   `@layer base` cobrindo `button`/`[role=button]` (não classe por componente), com
   `e2e/cursor.spec.ts`.
5. **`npm`, não `yarn`/`pnpm`** — o projeto usa `package-lock.json`; a CLI detecta pelo lockfile.
   Confira que não surgiu `yarn.lock`/`pnpm-lock.yaml`.

## Quarentena: `shadcn add` reescreve as dependências de registro

`shadcn add <x>` escreve também toda **dependência de registro** de `<x>`, sem `--overwrite` e sem
avisar (`add dialog` reescreve `button.tsx`). Vários primitivos daqui têm correção local deliberada
(`progress.tsx`, `popover.tsx`, `calendar.tsx`, `sonner.tsx`, `datetime-picker.tsx`) — um `add`
direto em `src/shared/ui` desfaria essas correções em silêncio. Por isso o CLI gera em
`src/shared/ui/generated/` (ignorada pelo git, fora de `tsc`/oxlint/prettier/cobertura, guardada
por `tooling/shadcn-quarantine.test.ts`) e só o que interessa é copiado e ajustado à mão. O passo a
passo é a skill `add-shadcn-component`.

## Depois de cada `add` — confira o arquivo gerado

6. **`import { cn } from "cn"` + pacote npm fantasma `cn`.** Aconteceu em `pagination.tsx`,
   `tooltip.tsx` e `switch.tsx`: o import veio de `"cn"` (não do alias real
   `@/shared/lib/utils`) e a CLI **instalou um pacote npm chamado `cn`** (`^0.3.0`) só pra esse
   import resolver. Corrija o import e rode `npm uninstall cn`. (`collapsible.tsx` e
   `alert-dialog.tsx` vieram limpos.)
7. **`next-themes` no `sonner.tsx`.** O gerador assume Next.js; sem trocar, o toast fica sempre no
   tema "system". Trocado por `useThemeStore` (a store do toggle) e `next-themes` removido do
   `package.json`. `<Toaster />` montado uma vez em `app/providers/app-providers.tsx`.
8. **Import de `radix-ui` (pacote unificado) não é gotcha** — é o padrão de todos os componentes
   Radix daqui (`dialog`, `popover`, `select`, `sheet`, `alert-dialog`, `progress`, `label`,
   `button`, `tooltip`). Não "corrija" pra `@radix-ui/react-*`.

## Bugs em componentes gerados

9. **`Progress` não repassava `value` pro `ProgressPrimitive.Root`.** O componente desestruturava
   `value` só pra calcular o `transform` do indicador; a Root ficava sempre
   `data-state="indeterminate"` e a barra renderizava com `width: 0` — invisível, sem erro no
   console, `tsc` feliz. Só apareceu com `getBoundingClientRect` via Playwright. Fix: `value={value}`
   explícito na Root (`shared/ui/progress.tsx`), travado por `progress.test.tsx`. **Se outro
   componente parecer "sem efeito", procure prop controlada desestruturada e não repassada.**
10. **`calendar.tsx`** foi reestruturado pro lint: `Root`/`Chevron`/`WeekNumber` subiram pra escopo
    de módulo (não recriados a cada render); só `DayButton` ficou dentro (depende de `locale`), com
    `oxlint-disable-next-line` comentado. `classNames` do `Calendar` **substitui** a classe da
    chave — use seletor de descendente ([tailwind](tailwind.md)). `autoFocus` no `Calendar` pousa
    o foco de teclado em "hoje" e cria duas marcações ao mesmo tempo — removido.

## Comportamento de Radix/shadcn que pede ajuste

11. **`Popover` dentro de `Dialog` não rola com a roda do mouse.** O `Dialog` trava o scroll da
    página (`<body data-scroll-locked>`) e o conteúdo do Popover é portalizado pra `<body>`, fora
    da árvore do Dialog — o `wheel` é interceptado mesmo com `overflow-y-auto` certo (`scrollTop`
    via JS funciona, o wheel não). Fix **no componente compartilhado** (`shared/ui/popover.tsx`,
    `PopoverContent.onWheel`): só intervém quando `document.body.hasAttribute('data-scroll-locked')`,
    sobe do alvo do wheel até o primeiro ancestral com `scrollHeight > clientHeight`, aplica
    `scrollTop += deltaY` e suprime o nativo. Fora de Dialog, o guard nunca dispara. Regressão em
    `popover.test.tsx` (fora de Dialog, rolando o content, rolando um filho).
12. **Popover mais alto que a viewport** (ex.: `DateTimePicker`): `max-h-[var(--radix-popover-content-available-height)]`
    - `overflow-hidden` no content, área do meio com `overflow-y-auto flex-1 min-h-0`, rodapé de
      botões fora da área rolável. Somado ao flip automático do Radix, sempre cabe.
13. **`SelectTrigger`/`SelectValue` têm `line-clamp-1` + `whitespace-nowrap` + `h-8` fixos** — pra
    não truncar num caso só, sobrescreva localmente com o mesmo modificador
    (`data-[size=default]:h-auto`). `SeletorUnico` também trunca por padrão.
14. **`DialogFooter` é `justify-end`** — o protótipo às vezes quer `justify-between` (Cancelar/
    Excluir à esquerda, ação principal à direita).
15. **`DialogContent` é `sm:max-w-sm` (~384px)** — o modal de protocolo manual precisou de
    `sm:max-w-[520px]`.
16. **`Sheet` com botão "Fechar" de texto** → `showCloseButton={false}`.
17. **`Tooltip`**: o shadcn usa `delayDuration={0}`; aqui `300` no `TooltipProvider` global.
18. **`Switch`**: `size="sm"` (14×24px) em contexto compacto; o padrão (18.4×32px) fica grande ao
    lado de texto 11px.
19. **`Table` já envolve num `overflow-x-auto`** — não precisa de wrapper pra rolar no mobile.

## Lição à parte (macOS)

**Filesystem case-insensitive**: renomear só a caixa (`Button.tsx` → `button.tsx`) com `mv` confunde
o índice do git e pode apagar o arquivo se um `rm` dos dois nomes rodar em sequência. Passe por
um nome intermediário: `git mv x.tsx x-tmp.tsx && git mv x-tmp.tsx X.tsx`.

## Referências

- `.claude/skills/add-shadcn-component`, `components.json`, `tsconfig.json`
- [design-system](design-system.md)
