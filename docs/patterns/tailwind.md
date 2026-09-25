---
name: tailwind
description: Como escrever classes Tailwind v4 neste repo sem parede de className — cva, regra da terceira repetição, valores arbitrários, armadilhas de twMerge e do dev server
metadata:
  type: pattern
  domains: [tailwind, ui, estilo]
  status: stable
---

# Tailwind

> Decisão em [ADR-0004](../decisions/0004-cva-e-primitivos-contra-parede-de-classes.md); ordenação
> automática em [ADR-0014](../decisions/0014-prettier-com-plugin-tailwind.md).

## Quando recorrer a isto

- Um componente está virando uma parede de classes
- Uma classe "não faz efeito" ou some no merge
- Precisa sobrescrever uma classe de um componente shadcn só num caso

## Regras

1. **Componente com variante → `cva`** (`chip.tsx`, `surface-card.tsx`, `button-variants.ts`).
   Nunca objeto de classe + template literal na mão.
2. **Terceira repetição de uma combinação de classe → primitivo em `shared/ui`.** Vale também pra
   função utilitária e constante (ex.: `formatDataHora`, `NIVEL_LABEL`, `MAX_POOL_VISIVEL`).
3. **`Button` do shadcn antes de `<button>` cru**, quando uma variante bate.
4. **Px do protótipo que não corresponde a degrau do Tailwind** → valor arbitrário
   (`text-[13.5px]`, `w-[206px]`). Não crie token por valor.
5. A ordem das classes é do `prettier-plugin-tailwindcss` — não ordene à mão.
6. Responsivo: `mobile:`/`max-mobile:` (760px), não `md:` ([responsive](responsive.md)).

## Armadilhas

- **`twMerge` só reconhece conflito dentro do mesmo grupo e do mesmo modificador.** Pra derrubar o
  `h-8` que o `SelectTrigger` aplica como `data-[size=default]:h-8`, a sobrescrita tem que ser
  `data-[size=default]:h-auto` — um `h-auto` puro fica junto na `className` final e quem vence no
  CSS gerado é imprevisível (caso real: `ExcecaoCard.tsx`, RNF-10).
- **Sobrescrever só num lugar, não no componente compartilhado.** Mexer em `shared/ui/select.tsx`
  afetaria selects que não são "nome de registro"; a correção foi `className` local.
- **`classNames` do `Calendar` (react-day-picker) substitui a classe da chave inteira, não faz
  merge** — `weekday: 'font-mono'` perderia o `flex`/tamanho padrão. Use `className` no `Calendar`
  com seletor de descendente nas classes reais que `getDefaultClassNames()` expõe:
  `[&_.rdp-weekday]:font-mono [&_.rdp-day_button]:font-mono` (não são hash de CSS module).
  `--cell-size` também se ajusta por `className` (`[--cell-size:35px]`).
- **Classe nova "sem efeito" num dev server de sessão longa**: o Vite pode não ter recompilado o CSS
  pras classes novas (principalmente largura/grid arbitrária — caso real: `w-11`, `w-[220px]` na
  Matriz, colunas coladas). Confira `document.styleSheets` no browser; **reinicie `npm run dev`
  antes de desconfiar do código**.
- **Flex e quebra de texto**: dentro de um `flex`, texto encolhe/quebra antes de estourar — tira de
  pills/abas ficam espremidas sem overflow real. Pra rolar de verdade: `overflow-x-auto` no
  container + `flex-none whitespace-nowrap` nos itens.
- **Filho `flex-shrink:0` nunca quebra linha** mesmo com o pai `flex-wrap` — dê
  `max-mobile:w-full` (ou `basis-full`) ao grupo que precisa descer.
- **Variável do Radix pra altura disponível**: `max-h-[var(--radix-popover-content-available-height)]`
  limita um popover à viewport (usado no `DateTimePicker`).

## Referências

- [design-system](design-system.md), [shadcn-gotchas](shadcn-gotchas.md)
