---
name: web-testing-strategy
description: Decide que teste uma mudança do dispatch-web precisa (unidade, componente, Playwright ou nenhum), onde o arquivo vive na estrutura FSD, e o que fazer quando o ratchet de cobertura muda. Use ao terminar uma mudança em src/, ao revisar código sem teste, ou quando o usuário perguntar "isso precisa de teste?".
---

# testing-strategy

Decide o que testar seguindo a política real deste repositório — não conselho genérico de teste.

Leia antes: `docs/patterns/testing-strategy.md` (critério, setup e gotchas) e as decisões por trás
dele — `docs/decisions/0011-adotar-vitest.md`, `0012-cobertura-com-ratchet-e-rtl.md` e, pra E2E,
`0020-playwright-com-duas-categorias-de-spec.md` + `docs/patterns/e2e-tests.md`. Releia agora, não
confie num resumo de antes nesta conversa — eles mudam conforme o projeto anda. Se a política
mudar, isso é um ADR novo (skill `/adr`), não uma edição silenciosa daqui.

## Entrada

O arquivo/feature/diff em questão. Se vier vazio, rode `git diff` (ou `git diff --staged`) e
trabalhe em cima do que de fato mudou, em vez de perguntar.

## Passo 1 — a regra decide dinheiro, alçada ou prazo?

**Se sim, o teste é no back, não aqui.** Este front não tem regra de negócio: motor de
distribuição, alçada, prazo e score vivem no `dispatch-api` (`Dispatch.Domain`/
`Dispatch.Application`), e é lá que essa lógica ganha teste. O erro clássico deste projeto foi
recriar regra no front e testá-la aqui — o simulador "Testar" da aba Alçada chegou a inferir o
destino do protocolo por contagem de elegíveis, enquanto o motor real decide por urgência;
a correção foi o back expor o resultado de verdade, não o front ganhar teste da regra errada.

Se a tela está mostrando algo que o back não calcula, o problema não é falta de teste.

## Passo 2 — classificar o que sobra

Nesta ordem:

1. **Lógica pura** (sem React, sem I/O: formatação, predicado de filtro, frase de regra,
   parsing) → teste de unidade, colado no arquivo. É o mais barato e o que mais pega regressão
   silenciosa.
2. **Bug que já aconteceu** → teste de regressão no mesmo commit do fix, sem exceção. Metade do
   valor da suíte de componente aqui é isso (ver `shared/ui/progress.test.tsx`: o `value` que o
   shadcn não repassava e deixava a barra invisível).
3. **Estado/fiação de hook** (`model/`) → `renderHook`. Cobre o que a função pura embaixo não
   cobre: alternar liga e desliga, `limpar` volta ao início, contagem é contra o conjunto certo.
4. **Componente com lógica condicional** (`ui/`) → RTL + `renderWithProviders`
   (`shared/lib/test/render-with-providers.tsx` — QueryClient próprio por teste + MemoryRouter).

**O que não merece teste automatizado**: componente puramente apresentacional sem condicional
(`Chip` é só `cva` + span), arquivo vendorizado do shadcn que ninguém editou, e `pages/` que só
compõem widgets já testados.

**Fidelidade visual não é teste de unidade** — bater com o protótipo aprovado é trabalho da
skill `verify-visual` (Playwright + screenshot lido). Teste de componente prova comportamento,
não aparência.

## Passo 3 — onde o arquivo vive

Colado ao arquivo testado, dentro da mesma slice (`*.test.ts`/`*.test.tsx`) — nunca uma pasta
`__tests__` central. Por segmento FSD:

| Segmento | O que testar ali |
| --- | --- |
| `lib/` (qualquer camada) | Função pura — maior valor pelo menor custo |
| `model/` | Estado derivado, hook de estado, mutation/query (mockando a função de `api/`) |
| `api/` | Só se houver moldagem de request/resposta além do `httpClient.post` cru |
| `ui/` | Render + interação de verdade (`userEvent`, não `fireEvent`) |

## Passo 4 — o ratchet mexeu?

`vitest.config.ts` tem `coverage.thresholds.autoUpdate: true`: os números **só sobem**. Se a run
cobriu mais, o Vitest reescreve o arquivo — **commite esse diff junto com os testes que o
ganharam**, não descarte como ruído.

**Nunca abaixe um número na mão pra fazer run vermelha passar.** Se uma mudança reduz cobertura
de propósito (apagou código morto junto com o teste dele), isso é decisão explícita, anotada no
commit — não edição silenciosa de config.

## Passo 5 — reporte

Diga qual categoria se aplicou, se algo caiu pro back em vez de ficar aqui, onde o arquivo foi
colocado, e — se o threshold mudou — lembre de commitar esse diff.
