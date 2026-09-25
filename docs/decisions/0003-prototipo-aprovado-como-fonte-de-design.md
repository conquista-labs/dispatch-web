---
name: adr-0003-prototipo-aprovado-como-fonte-de-design
description: O protótipo aprovado (.dc.html principal) decide cor, tipografia, logo e espaçamento — não os documentos de "opções" nem o default do shadcn — e seus tokens entram com os nomes padrão do shadcn, sem ponte
metadata:
  type: decision
  status: accepted
---

# ADR-0003: Protótipo aprovado como fonte da verdade de design, com tokens nos nomes do shadcn

> Cor, tipografia, logo e espaçamento vêm do protótipo que a seção 6 do documento de requisitos
> chama de "aprovado" (hoje `../dispatch-prototype/Dispatch v2.dc.html`; até 2026-09-25 o arquivo
> se chamava `Dispatch.dc.html`). Os valores dele entram nos **nomes de token padrão do shadcn**,
> então componente gerado cru já lê a cor certa — sem camada de tradução.

## Status

`Accepted` — 2026-08-27 (commit `31346db`). Registrado retroativamente em 2026-09-25.

## Contexto

O `dispatch-prototype/` tinha, além do protótipo, documentos de "opções" (`Logo - opções.dc.html`,
`Tipografia - opções.dc.html`) — explorações que terminam com uma aposta do designer ("diga o
número e eu troco no sistema"). O protótipo aprovado já tem a decisão embutida no CSS/markup e às
vezes **contraria** a aposta (a Tipografia apostava em IBM Plex; o aprovado ficou com Instrument
Sans). A stack de componentes é shadcn/ui, que espera tokens com nomes próprios (`--background`,
`--card`, `--primary`...).

## Decisão

1. **O protótipo aprovado vale mais que qualquer documento de "opções"** sempre que divergirem.
   Tela que não está no protótipo → perguntar ao dono antes de inventar layout.
2. **Paleta neutra = escala `zinc` do Tailwind** (descoberto comparando hex: `--text:#09090b` =
   zinc-950, `--ink:#18181b` = zinc-900, `--muted:#a1a1aa` = zinc-400…). Tokens semânticos do
   protótipo (`--bg`, `--surface`, `--border`, `--primary`…) viram **os nomes padrão do shadcn** em
   `src/app/styles/index.css`. O que o shadcn não prevê entra como token extra em `@theme inline`:
   `--text-2`…`--text-5` e as 4 faixas do semáforo (RF-14: `--ok-*`/`--warn-*`/`--crit-*`/`--bad-*`).
3. **Modo escuro** = classe `.dark` no `<html>` (convenção shadcn/Tailwind v4), no lugar do
   `html[data-tema="dark"]` do protótipo — muda só a mecânica, os valores são os mesmos.
4. **Fontes self-hosted** (`@fontsource-variable/instrument-sans` e `/jetbrains-mono`), sem Google
   Fonts em runtime.

Detalhes de uso (tokens, logo, tema, escala de px) em
[design-system](../patterns/design-system.md); como verificar fidelidade em
[verificacao-com-prototipo](../patterns/verificacao-com-prototipo.md).

## Alternativas consideradas

| Alternativa                                                                                          | Prós                                     | Contras                                                    | Por que foi descartada                                              |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------- |
| Seguir a aposta dos documentos de "opções" (ex.: IBM Plex)                                           | Era a recomendação explícita do designer | Contradiz o protótipo que os requisitos chamam de aprovado | O aprovado já tem a decisão tomada                                  |
| Manter os nomes de token do protótipo + ponte pros nomes do shadcn (como em outros projetos do dono) | Nomes 1:1 com o protótipo                | Ponte pra manter a cada componente novo                    | Renomear uma vez elimina a ponte; `shadcn add` sai certo sem edição |
| Default do shadcn (`neutral`/`slate`)                                                                | Zero trabalho                            | Não bate com o protótipo                                   | Fidelidade é requisito do dono                                      |

## Características impactadas

| Característica                | Impacto    | Justificativa                                                        |
| ----------------------------- | ---------- | -------------------------------------------------------------------- |
| Fidelidade visual             | ✅ Melhora | Valores 1:1 com o protótipo                                          |
| Custo de adicionar componente | ✅ Melhora | Componente shadcn cru já usa as cores certas                         |
| Legibilidade das classes      | ⚠️ Piora   | Px "quebrados" do protótipo viram valor arbitrário (`text-[13.5px]`) |

## Consequências

**Positivas** — `variant="destructive"` do `Button` já sai com `--bad-fg`; skill
`add-shadcn-component` não precisa de passo de tokens.

**Negativas** — o protótipo é um arquivo exportado de uma ferramenta de design e **pode estar
desatualizado** em relação à ferramenta ao vivo; e ele mesmo às vezes erra (ex.: rolagem da tabela
"O que cada um alcança hoje" em 390px). Divergências deliberadas ficam no
[ADR-0010](0010-divergencias-deliberadas-do-prototipo.md).

**Riscos** — ler o markup e errar a interpretação. Mitigação: abrir o `.dc.html` via `file://` no
Playwright e comparar lado a lado ([verificacao-com-prototipo](../patterns/verificacao-com-prototipo.md)).

## Referências

- `src/app/styles/index.css`, `src/shared/ui/logo.tsx`, `shared/lib/theme-store.ts`
- [ADR-0004](0004-cva-e-primitivos-contra-parede-de-classes.md)
