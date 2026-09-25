---
name: adr-0004-cva-e-primitivos-contra-parede-de-classes
description: Contra a "parede de className" do Tailwind — cva pra variantes, primitivos pequenos em shared/ui na terceira repetição, e reaproveitar o Button do shadcn
metadata:
  type: decision
  status: accepted
---

# ADR-0004: `cva` + primitivos em `shared/ui` contra a parede de `className`

> Componente com variante usa `class-variance-authority`; combinação de classe que aparece pela
> terceira vez vira primitivo em `shared/ui`; `<button>` cru com classe na mão só quando nenhuma
> variante do `Button` do shadcn serve.

## Status

`Accepted` — 2026-08-27 (a partir da tela Minha fila, commit `16c5307`). Registrado
retroativamente em 2026-09-25.

## Contexto

Preocupação real do dono, já vivida no `financas-front`: Tailwind puro em componente grande vira
uma parede de classe ilegível. Na primeira tela (Minha fila), a mesma pilha de classes apareceu em
3 componentes diferentes, e variantes eram objeto de classe + template literal na mão
(`ACAO_CLASSES[variante]`).

## Decisão

1. **`cva` pra qualquer componente com variante** — a tabela variante→classe fica declarada num
   lugar só, com nome (`shared/ui/chip.tsx`, `shared/ui/surface-card.tsx`). Mesmo padrão que o
   `Button` do shadcn já usa; não é convenção nova.
2. **Regra da terceira repetição**: se uma combinação de classe (ou uma função utilitária — ex.:
   `formatDataHora`, `NIVEL_LABEL`) aparece pela terceira vez, vira componente/helper
   compartilhado, não mais uma cópia colada. Tamanho de arquivo/função **não** é o sinal usado
   (por isso `max-lines` está desligado no oxlint, [ADR-0013](0013-oxlint-por-categorias-e-pre-commit.md)).
3. **Reaproveitar o `Button` do shadcn** sempre que o visual bater com uma variante existente
   (`default`/`outline`/`destructive`/`ghost`).
4. **`SurfaceCard` em vez do `Card` do shadcn** pro "card" do protótipo (radius 10px, borda,
   sombra leve) — o `Card` é mais pesado/opinativo e brigaria com o visual.

## Alternativas consideradas

| Alternativa                                                         | Prós                | Contras                                              | Por que foi descartada                             |
| ------------------------------------------------------------------- | ------------------- | ---------------------------------------------------- | -------------------------------------------------- |
| Objeto de classes + template literal na mão                         | Sem dependência     | Espalha a tabela de variantes; sem merge de conflito | Ilegível já na primeira tela                       |
| `Card` do shadcn pro card do protótipo                              | Pronto              | Visual diferente do protótipo, opinativo             | Brigaria com o protótipo em vez de simplificar     |
| Token novo pra cada px "quebrado" do protótipo (`13.5px`, `11.5px`) | Classe sem colchete | Dezenas de tokens de uso único                       | Aceito o valor arbitrário como custo de fidelidade |

## Características impactadas

| Característica           | Impacto    | Justificativa                                       |
| ------------------------ | ---------- | --------------------------------------------------- |
| Legibilidade             | ✅ Melhora | Variantes nomeadas, JSX curto                       |
| Consistência visual      | ✅ Melhora | Primitivos compartilhados entre telas               |
| Fidelidade pixel-perfect | ➖ Neutro  | Valores arbitrários continuam onde o protótipo pede |

## Consequências

**Positivas** — `Chip`, `SurfaceCard`, `PillToggle`, `SeletorUnico`, `Carregando`, `Stepper`,
`CampoHorario` etc. nasceram dessa regra.

**Negativas** — mudar um primitivo compartilhado afeta dezenas de usos já verificados; por isso
pedidos pontuais ganham variante ou componente próprio em vez de mexer no default
([ADR-0016](0016-badges-proprios-e-variante-fonte-no-chip.md)). Ordenação de classe ficou a cargo
do `prettier-plugin-tailwindcss` ([ADR-0014](0014-prettier-com-plugin-tailwind.md)) — ordena, não
reduz a lista.

## Referências

- [tailwind](../patterns/tailwind.md), [design-system](../patterns/design-system.md)
