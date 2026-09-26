---
name: adr-0025-cenario-e2e-montado-pela-api-no-proprio-teste
description: As specs Playwright que dependiam de cenário semeado à mão passam a montar e desfazer o próprio cenário pela API, com a fixture `cenario` (e2e/support/cenario.ts), e a suíte roda com um worker só
metadata:
  type: decision
  status: accepted
---

# ADR-0025: Cenário de e2e montado pela API dentro do próprio teste

> A fixture `cenario` (`e2e/support/cenario.ts`, via `test.extend`) cria pela API o que cada spec
> precisa e desfaz no fim, passando ou falhando. Isso acaba com a "verificação visual pontual" do
> ADR-0020: a suíte inteira passa em qualquer banco local e roda de novo sobre o próprio resíduo. A
> suíte roda com `workers: 1`.

## Status

`Accepted` — 2026-09-25 (suíte e2e 24/24 duas rodadas seguidas, `workers: 1`).

Substitui **a parte do [ADR-0020](0020-playwright-com-duas-categorias-de-spec.md)** que cria a
"categoria 2 — verificação visual pontual" e decide "não virar fixture automática de cenário por
ora". O resto do ADR-0020 continua valendo: Playwright headless lendo o PNG, login real sem token
injetado, sem bypass.

## Contexto

O ADR-0020 dividiu as specs em duas categorias. As da categoria 2 (`distribuicao`,
`distribuicao-v2`, `importar`, `central-de-regras`, `painel-detalhe-protocolo`, `alcada-v3`,
`dashboard` na visão do conferente, `minha-fila`) dependiam de dado semeado à mão e
falhavam em qualquer banco que não fosse o de quem as escreveu. Falhar "era esperado", e o
pattern `e2e-tests.md` registrava rodadas com 7 ou 8 falhas pré-existentes. Na prática, a suíte
não servia de regressão: cada falha exigia investigar se era defeito ou dado, e o
`web-gate` não tinha como afirmar "e2e verde".

O próprio ADR-0020 já deixava a porta aberta: "se mudar, a fixture cria e limpa via API dentro do
próprio teste, nunca dado deixado por sessão anterior". Continua sem CI, mas o custo que pesou lá
(montar status, exceção e tipo desconhecido à mão) caiu: a API já tem tudo o que um cenário
precisa (`/protocolos/importar/confirmar`, regras de alçada, atribuir/iniciar/concluir,
`/sugestoes/gerar`, `DELETE` de protocolo e de regra). E as contas fixas de login já estavam
garantidas pelo `globalSetup` ([ADR-0021](0021-global-setup-garante-contas-de-login.md)).

A API não apaga tudo. Tipo de ato com protocolo não sai, escrevente e equipe não têm `DELETE`,
conferente só desativa, e sugestão descartada fica com memória de descarte
(`DiasDeMemoriaDescarte`, dispatch-api). Um cenário não consegue deixar o banco exatamente como
encontrou.

## Decisão

Vamos montar o cenário de cada spec pela API, dentro do próprio teste, com uma fixture do
Playwright, e rodar a suíte em série:

- **Fixture `cenario`** (`test.extend`). A spec declara `{ cenario }` e ganha um objeto que cria
  dado pela API. A parte da fixture depois do `use()` desfaz tudo em ordem inversa, mesmo se o
  teste falhar no meio. Falhas de limpeza saem juntas no fim, sem esconder o erro do teste.
- **Duas classes de dado**:
  - _Do teste_: protocolo com número de prefixo `E2E` único por rodada, e regra de alçada. São
    apagados no fim (protocolo por soft delete, regra por `DELETE`).
  - _Fixo_: tipos "E2e Cenario" e "E2e Reservado", equipe "E2e Equipe", os dois escreventes "E2e",
    o conferente fora da escala, e a sugestão pendente de escrevente órfão. São achados ou criados
    com nome fixo, corrigidos pro estado esperado (ativo, grupo, prazo D+1, equipe) e
    reaproveitados. O banco cresce uma vez e para.
- **Varredura de sobras no começo de todo cenário**: apaga protocolos com o prefixo `E2E` e regras
  que apontam pros dados fixos. Cobre a rodada interrompida por Ctrl+C.
- **A sugestão pendente fica pendente.** Descartar ligaria a memória de descarte sobre a chave do
  escrevente fixo, e a rodada seguinte não conseguiria gerar outra.
- **`workers: 1`** no `playwright.config.ts`. Todas as specs dividem o mesmo banco e os mesmos dados
  fixos. Em paralelo, uma spec via a Reserva de outra na tela ("resolved to 3 elements"), e a
  varredura do começo de um cenário podia apagar o protocolo ou a regra de outro teste no meio.
- **`capturarPaginaInteira` em vez de `fullPage: true`.** O `fullPage` desta versão do Playwright
  redimensiona a janela pra 1×1 por um instante, cruza os 760px (RNF-13) e o AppShell remonta,
  fechando Sheet, diálogo e o modal do construtor de regra. O helper só estica a altura.

## Alternativas consideradas

| Alternativa                                                               | Prós                                           | Contras                                                                                                              | Por que foi descartada                                                 |
| ------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Manter a categoria 2 com cenário semeado à mão (ADR-0020)                 | Nenhum código de apoio; a spec fica curta      | Falha em qualquer banco que não seja o de quem escreveu; cada falha pede investigação; o gate não afirma "e2e verde" | Foi o que motivou esta decisão                                         |
| `try/finally` com criação e limpeza em cada spec                          | Explícito, sem abstração                       | Repete login, criação e limpeza em cada arquivo; a limpeza depende de cada autor lembrar                             | A fixture dá o mesmo `finally` de graça pra quem declara `{ cenario }` |
| Criar tudo com nome único por rodada, inclusive tipo, equipe e escrevente | Isolamento total entre rodadas e entre workers | A API não apaga esses dados: sobra um de cada por rodada, e as listas (Tipos, Prazos, Alçada) crescem sem fim        | Dado fixo reaproveitado cresce uma vez e para                          |
| Rodar em paralelo e isolar cada spec com dados fixos próprios             | Suíte mais rápida                              | Multiplica os dados fixos, e a varredura de sobras (por prefixo, global) ainda apagaria o dado de outro worker       | A suíte inteira leva cerca de 40 s em série; não compensa              |

## Características impactadas

| Característica          | Impacto    | Justificativa                                                                                      |
| ----------------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| Confiabilidade da suíte | ✅ Melhora | 24/24 em banco local qualquer, duas rodadas seguidas                                               |
| Valor como regressão    | ✅ Melhora | Falha passa a significar defeito, não dado                                                         |
| Tempo da suíte          | ⚠️ Piora   | Em série: cerca de 40 s, antes em paralelo                                                         |
| Banco local             | ⚠️ Piora   | Dados fixos "E2e …" e uma sugestão pendente ficam no banco de desenvolvimento                      |
| Manutenção              | ➖ Neutro  | Um arquivo de apoio a mais (`cenario.ts`); em troca, as specs deixam de documentar semeadura à mão |

## Consequências

**Positivas**: `npm run e2e` vira um sinal confiável pro `web-gate`. Spec nova que precisa de
dado declara `{ cenario }` e pede o que quer (`importar`, `atribuir`, `regra`, `alcadaPlena`,
`reservaSemNinguem`, `garantirSugestaoPendente`…). A tela criada pela própria spec (Importar)
registra a limpeza antes da ação com `apagarAoFinal`.

**Negativas**: a fixture conhece contrato da API (rotas, corpo das regras). Mudança de contrato
quebra o `cenario.ts` antes da spec, o que ao menos falha cedo e com mensagem clara
(`exigirOk`). Os dados fixos ficam no banco local.

**Riscos**: aplicar ou descartar à mão, pela tela, a sugestão de escrevente órfão do escrevente
fixo faz `garantirSugestaoPendente` falhar até a memória de descarte vencer; a mensagem de erro
diz isso. Uma regra ampla criada à mão no banco local (ex.: "Nega" por nível) pode ainda competir
com o cenário; `alcadaPlena` usa a camada da pessoa, a de baixo da cascata, pra sobrescrever.

## Referências

- `e2e/support/cenario.ts`, `playwright.config.ts`, [e2e-tests](../patterns/e2e-tests.md)
- [ADR-0020](0020-playwright-com-duas-categorias-de-spec.md) (parte substituída),
  [ADR-0021](0021-global-setup-garante-contas-de-login.md)
- dispatch-api: `GeradorDeSugestoes.EscreventeOrfao`, `DescartarSugestao` (`DiasDeMemoriaDescarte`)
