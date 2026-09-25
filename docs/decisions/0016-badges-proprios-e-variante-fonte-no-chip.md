---
name: adr-0016-badges-proprios-e-variante-fonte-no-chip
description: Pedidos visuais pontuais não mudam o default do Chip compartilhado — ganham componente próprio (NavBadge, badge "Alta") ou uma variante nova com default preservado (fonte)
metadata:
  type: decision
  status: accepted
---

# ADR-0016: Badges próprios e variante `fonte` no `Chip`, em vez de mudar o default

> O `Chip` compartilhado (`shared/ui/chip.tsx`, `font-mono text-[11px]`) é usado em dezenas de
> lugares já verificados (prazo, status, faixa). Quando o protótipo pede outro visual num caso
> específico, o caso ganha componente próprio ou uma variante nova cujo default preserva todos os
> usos existentes.

## Status

`Accepted` — `NavBadge` em 2026-08-28 (commit `0b44e03`), badge "Alta" em 2026-09-01, variante
`fonte` em 2026-09-03 (commit `3ec059c`). Registrado retroativamente em 2026-09-25.

## Contexto

Três casos do protótipo destoam do `Chip`:

- Badge de pílula do menu lateral usa `var(--text-3)`, mais escuro que o `text-muted-foreground` do
  `Chip`.
- Badge de prioridade "Alta" usa `10.5px`, `font-weight:600`, sem mono.
- Pills de equipe/etapa usam `10.5px` sem mono (peso 500 na de equipe).

## Decisão

- **`NavBadge`** local ao `AppShell` (não reaproveita o `Chip`).
- **Badge "Alta"** próprio: `10.5px`, `font-semibold`, `border-bad-border`/`bg-bad-bg`/`text-bad-fg`,
  `rounded-full`. Rótulo "Alta" (não "urgente") e na **linha da meta**, não na linha do número —
  confirmado no protótipo depois que o card quebrou.
- **`Chip` ganha uma segunda dimensão de variante no `cva`**, `fonte?: 'mono' | 'padrao'`, default
  `'mono'` (preserva os usos existentes); `'padrao'` → `font-normal text-[10.5px]`; a pill de
  equipe ainda passa `className="font-medium"`. O `twMerge` via `cn` resolve o conflito dentro de
  `chipVariants()`.

## Alternativas consideradas

| Alternativa                                 | Prós             | Contras                                                   | Por que foi descartada                                                  |
| ------------------------------------------- | ---------------- | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| Mudar o default do `Chip` pro visual pedido | Um componente só | Afeta dezenas de usos já verificados (prazo em toda tela) | Risco desproporcional a um pedido pontual                               |
| Reusar o `Chip` como está nos três casos    | Zero código      | Diverge do protótipo (tamanho, fonte, tom)                | Gap de fidelidade visível (e o card quebrou com "Alta" na linha errada) |

## Características impactadas

| Característica     | Impacto         | Justificativa                          |
| ------------------ | --------------- | -------------------------------------- |
| Fidelidade visual  | ✅ Melhora      | Cada caso bate com o protótipo         |
| Risco de regressão | ✅ Melhora      | Default do `Chip` intocado             |
| Duplicação         | ⚠️ Piora (leve) | Badge "Alta" existe em mais de um card |

## Consequências

O gap "pills de equipe/etapa com fonte errada" foi fechado pela variante. O badge "Alta" também
aparece em Minha fila desde 2026-09-16 (divergência pedida pelo dono, [ADR-0010](0010-divergencias-deliberadas-do-prototipo.md)).

## Referências

- `shared/ui/chip.tsx`, `widgets/app-shell/ui/AppShell.tsx`,
  `widgets/distribuicao-board/ui/DistribuicaoProtocoloCard.tsx`
- [design-system](../patterns/design-system.md)
