---
name: e2e-tests
description: Como escrever e rodar specs Playwright neste repo — categorias, globalSetup, contas fixas, locators robustos, relógio, screenshots e as armadilhas já pagas
metadata:
  type: pattern
  domains: [testing, e2e, playwright]
  status: stable
---

# Testes E2E (Playwright)

> Decisões em [ADR-0020](../decisions/0020-playwright-com-duas-categorias-de-spec.md),
> [ADR-0021](../decisions/0021-global-setup-garante-contas-de-login.md) e
> [ADR-0025](../decisions/0025-cenario-e2e-montado-pela-api-no-proprio-teste.md). Fluxo de verificação
> visual na skill `verify-visual`; cadeia completa na skill `web-gate`.

## Quando recorrer a isto

- Escrever ou consertar um `e2e/*.spec.ts`
- Um spec falhou e você precisa saber se é regressão ou dado
- Montar cenário temporário pra verificar uma tela

## Rodar

- Exige a API de pé em Development (`../dispatch-api`, ver skill `verify-visual`); o
  `playwright.config.ts` sobe/reaproveita o Vite em `:5173` sozinho.
- `globalSetup` (`e2e/global-setup.ts`) chama `POST /dev/seed-e2e` uma vez e garante as contas
  `distribuidora@cartorio.com` (**combo**: Distribuidora + Conferente), `administrador@cartorio.com`,
  `conferente-rf27@cartorio.com`
  e `conferente-visual@cartorio.com`. Falha cedo e claro se a API não responde.
- `npm run e2e` (tudo) ou `npx playwright test e2e/<arquivo>.spec.ts`. Screenshots em
  `e2e/.screenshots/` (gitignored) — **leia o PNG**.

## Cenário pela fixture `cenario` (ADR-0025)

**Toda spec passa em qualquer banco local e roda de novo sobre o próprio resíduo** — não existe
mais "falha esperada por falta de cenário". Falhou, é defeito (ou a API local está velha).

- Spec que precisa de dado importa `test`/`expect` de `./support/cenario` (não de
  `@playwright/test`) e declara `{ cenario }`: `importar`, `atribuir`, `iniciar`, `concluir`,
  `definirPrioridade`, `regra`, `alcadaPlena`, `reservaSemNinguem`, `esvaziarFila`,
  `garantirSugestaoPendente`, `apagarAoFinal` (protocolo que a própria tela cria). Tudo o que for
  criado é desfeito no fim, passando ou falhando.
- **Dado do teste** (protocolo com prefixo `E2E`, regra) é apagado; **dado fixo** (tipos "E2e
  Cenario"/"E2e Reservado", "E2e Equipe", escreventes "E2e …", conferente fora da escala, a sugestão
  pendente de escrevente órfão) é achado-ou-criado e reaproveitado — a API não apaga esses.
- Precisa de um tipo/equipe/conferente novo pra um cenário? Acrescente um nome fixo em `FIXOS`, não
  um nome por rodada.
- Busca na tela pelo `cenario.prefixo` pra isolar o que é deste teste.
- **A suíte roda com `workers: 1`** — os dados fixos são compartilhados e a varredura de sobras do
  começo de um cenário apagaria o dado de outro teste em paralelo. Não ligue paralelismo.
- `entrar(page, 'distribuidora')` faz o login pela tela; `usarTemaEscuro(page)` antes do próximo
  carregamento.

`auth`, `login`, `cursor`, `session-isolation`, `conferentes`, `contas`, `fila-conferentes`,
`correcao-reabertura`, `totp-recuperacao-senha` e `minha-fila` (só os títulos das colunas) não
precisam da fixture — criam o próprio dado à mão ou não dependem de dado.

Spec **temporário** (criado pra verificar uma mudança e apagado depois) é normal aqui — cria o
cenário via API, verifica, limpa.

## Dado

- **Qual conta usar**: `administrador@cartorio.com` pra tudo que é só do admin (cadastrar
  conferente, editar regras e catálogo, score no Dashboard, Contas); `distribuidora@cartorio.com`
  pro resto e pra afirmar o que a distribuidora **não** vê (dispatch-api ADR-0039). Conta ou
  conferente criado no teste entra com troca de senha pendente: o primeiro login cai em
  `/trocar-senha` (ver `contas.spec.ts`, `totp-recuperacao-senha.spec.ts`).

- **Todo dado de teste é criado e apagado pelo próprio teste** ("um bom teste não depende de dado
  local, a não ser que o dado seja criado pelo teste e depois apagado").
- **Limpe sobra de execução interrompida no início** — ex.: RF-21 (1 ato simultâneo) bloqueia
  "iniciar" se sobrou algo "em conferência" (`correcao-reabertura.spec.ts`).
- **Use cenário próprio pra não colidir com regras amplas** do banco local (ex.: "Nível Júnior não
  pode conferir atos de Notariais") — equipe + conferente + tipo de ato dedicados.
- Fluxos que trocam senha criam conta própria (`totp-recuperacao-senha.spec.ts`), nunca a seed.
- Nome de tipo de ato sai **normalizado** pelo back (Title Case por palavra: "E2E" → "E2e") —
  procure sem `exact`, não replique a normalização.
- Contra clone de produção, a conta combo tem atos concluídos de verdade e aparece em mais lugares.

## Locators (lições reais)

- **`data-testid` quando há vários cards com estrutura parecida**: `conferente-card-{id}`,
  `concluido-{protocolo.id}`, `pedido-reabertura-{pedido.pedidoId}`. `div.filter({ hasText })`
  com número em nó descendente de vários `div` pegava o nível errado com `.first()`/`.last()`.
- **Nunca reuse um locator posicional depois de um refetch que reordena a lista** (ex.:
  `page.locator('input').nth(i)` em Tipos de ato, ordenado por nome) — renomeou/removeu a linha
  errada duas vezes. Reache a linha do zero, pelo nome, imediatamente antes de cada ação, e espere
  `networkidle` entre mutação e próxima busca.
- **`getByText` sem `exact`/escopo quebra com dado acumulado** (mais de uma exceção "sem alçada";
  "Em conferência" também dentro do placeholder "nada em conferência — pegue um do pool"). Escope:
  `page.getByRole('complementary').getByText(...)` (a sidebar `<aside>`).
- **`getByLabel` também casa `aria-label`**: `aria-label="Mostrar senha"` colidiu com
  `getByLabel('Senha')` em quase todo spec. O botão virou "Mostrar/ocultar caracteres digitados" —
  evite a palavra de um label existente em `aria-label`.
- **Rótulo de nav mudou → specs quebram em silêncio**: com a conta combo, "Fila de conferentes"
  contém "Conferentes" e "Minha fila" mudou de destino. `exact: true` em "Conferentes"; rode a
  **suíte inteira** depois de mexer em `AppShell`/nav, não só os 4 de sempre.
- **Busca atrás de um diálogo aberto não dispara**: espere a resposta do POST e
  `expect(page.getByRole('dialog')).toHaveCount(0)` antes de mexer no campo de trás.
- **Lista paginada**: filtre pela busca logo depois de criar o item pra isolá-lo numa página só
  (sobrevive a rename se o nome original continua prefixo).

## Relógio, rede e tempo

- **`page.clock` é escopado ao `BrowserContext` inteiro.** Uma `page.context().newPage()` herda o
  relógio mockado/congelado (travou a navegação); pra relógio real use `browser.newContext()`.
- Contexto de browser separado por papel, pra sessão não vazar entre logins.
- `page.route` com atraso artificial pra capturar estado de pendência ("Redistribuindo…") ou
  provar UI otimista (texto em <300ms com `PUT` atrasado 2s) e spinner de loading.
- Confirme efeito **pela resposta de rede** (status 201/204/409, URL com `?pagina=2`), não só pelo
  DOM. Se a asserção é de filtro, afirme a **contagem antes/depois**, não "o filtro está marcado".
- TOTP de verdade sem lib: gere o código RFC 6238 em Node (`node:crypto`, HMAC-SHA1) a partir da
  chave Base32 lida da tela.

## Screenshots e medição

- **Depois de `page.goto` (reload completo), espere um heading/texto da tela** antes de
  `page.screenshot` — senão pega o fallback do chunk lazy ("Carregando…").
- Artefatos do Chromium headless **não são bugs**: botão desabilitado com `border-radius` +
  opacidade aparece com "degradê" (o CSS é cor sólida — confira com `getComputedStyle`);
  scrollbar customizada não é pintada. Confirme por estilo computado e registre a limitação.
- **Não use `fullPage: true`** — use `capturarPaginaInteira(page, path)` (`e2e/support/cenario.ts`).
  O `fullPage` desta versão do Playwright redimensiona a janela pra 1×1 por um instante, cruza os
  760px e o AppShell remonta: Sheet, diálogo e o modal do construtor de regra fecham, aba e busca se
  perdem. Com um diálogo aberto, a resposta de rede seguinte também pode não ser vista pelo
  `waitForResponse` (caso de `contas.spec.ts`). Specs antigas que ainda usam `fullPage` sem nada
  aberto funcionam, mas não copie.
- `Sheet` com rolagem própria: `fullPage` não captura o conteúdo abaixo da dobra — use
  `innerText` do conteúdo. Página muito longa com `fullPage` pode renderizar estranho — escope o
  screenshot ao elemento.
- Meça em vez de estimar: `getBoundingClientRect`/`boundingBox()` (popover 266px, alvo de toque
  44px), `document.documentElement.scrollWidth <= clientWidth` (overflow no mobile), inspeção de
  classe CSS quando pills próximos são difíceis de julgar em baixa resolução.

## Papel e privilégio

**Teste logado como o papel de menor privilégio que usa a tela.** Um 403 silencioso numa query
auxiliar não quebra o layout, só o resultado (caso do filtro de 2026-09-01,
[ADR-0006](../decisions/0006-back-manda-fato-cru-front-resolve-nomes.md)). Pra telas só-leitura,
afirme também o que **não** aparece (nenhum botão de escrita; "Bônus"/faixa ausentes na visão do
conferente) e que trocar de seleção dispara leitura nova no back, não filtro local.

## Referências

- `playwright.config.ts`, `e2e/global-setup.ts`
- [verificacao-com-prototipo](verificacao-com-prototipo.md), [testing-strategy](testing-strategy.md)
