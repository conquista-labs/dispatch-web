---
name: verificacao-com-prototipo
description: Como conferir fidelidade ao protótipo aprovado — abrir o .dc.html via file:// no Playwright lado a lado com o app, reler antes de cada trabalho, confirmar por markup e medição, verificar comportamento e não só aparência
metadata:
  type: pattern
  domains: [fidelidade, prototipo, playwright]
  status: stable
---

# Verificação de fidelidade com o protótipo

> O protótipo manda no design ([ADR-0003](../decisions/0003-prototipo-aprovado-como-fonte-de-design.md)),
> com as exceções de [ADR-0010](../decisions/0010-divergencias-deliberadas-do-prototipo.md).

## Quando recorrer a isto

- Construir ou revisar uma tela ("está fiel ao protótipo 100%?", "continua diferente")
- O dono diz que algo "está diferente" do que a ferramenta de design mostra
- Antes de afirmar que um detalhe veio do protótipo

## Método padrão: abrir o protótipo de verdade

**O `.dc.html` roda sozinho num navegador** (um `<x-dc>` com `support.js`, interativo, com
login/nav/estado). Abra com Playwright via `file://<caminho absoluto>` e navegue como um app
(clicar no atalho "Distribuidora" pra entrar, abas, dropdowns). Printe os **mesmos estados** no
protótipo e no app local, lado a lado, e compare. Interpretar só o markup/CSS-in-JS é o último
recurso — as vezes em que só li o markup (tela de Configuração, trigger do `DateTimePicker`), o
resultado divergiu bastante do real.

Arquivo atual: `../dispatch-prototype/Dispatch v2.dc.html` (comentários de código e o histórico
citam `Dispatch.dc.html`, o nome até 2026-09-25). Componente de seletor: `Combo.dc.html`. Os
wireframes de exploração (`Fila de Protocolos - Wireframes.dc.html`, variantes `1a`/`1b`/`1c` por
tela) e os documentos de "opções" não estão mais na pasta; quando existiam, não havia decisão de
qual variante seguir — decidir era parte do trabalho de cada tela, e o protótipo aprovado vence.

## O `.dc.html` pode estar desatualizado

O arquivo em disco é um **export** da ferramenta de design e pode não ter mudanças ainda não
exportadas — o dono já flagrou isso comparando um print da ferramenta com o que eu tinha lido.

- **Releia o arquivo antes de qualquer trabalho de fidelidade**; não confie numa leitura anterior
  da mesma sessão nem na memória de sessão passada.
- Se o dono disser "está diferente", desconfie primeiro do export (peça pra reexportar) e depois
  da sua leitura. Ele já reexportou várias vezes com fluxos novos (painel de Filtros, aba
  Configuração, `Combo`).

## Confirmar, não aproximar

- Ache o bloco pela variável de estado que ativa a tela (`isFila`, `isPainel`, `isTotp`,
  `isRec`, `abasRegras`, `novoAberto`, `feitosCards`, `passaFiltro`…) e **leia o CSS inline**
  (tamanho, cor, `overflow`/`ellipsis`, `white-space`). Eyeballing de screenshot já errou
  (`p.meta` era `nowrap` + ellipsis, não `text-wrap:pretty`; `p.tipo` era `12.5px` `--text-5`).
- Cite linha/variável do protótipo no comentário do componente quando a decisão depender dela.
- **Antes de afirmar que algo veio do protótipo, procure o texto exato no arquivo.** Os prints de
  "buscar conferente ou nível…" não existiam no `.dc.html` — o dropdown do construtor foi
  consistência interna, e isso ficou registrado como tal.
- Meça quando o detalhe é de px (`getBoundingClientRect`: popover 266px, calendário 261px, folga
  2,5px por lado).
- Leia a lógica do protótipo pra comportamento (`passaFiltro` mostrou que "Prazo" é um alternador
  — [ADR-0008](../decisions/0008-eixo-prazo-como-alternador-urgente.md); `padAcao`/`fonteAcao`
  mostraram quais 4 botões ganham 44px).

## Comportamento, não só aparência

O dono cobrou explicitamente: print bonito não garante que a interação bate. Teste o fluxo nos dois
lados (adicionar observação, "Resolver" exceção, clicar num dia do calendário). Foi assim que
apareceram a atribuição automática de exceção ([ADR-0009](../decisions/0009-manter-atribuicao-manual-de-excecao.md))
e o "clicar no dia não fecha o popover — quem fecha é 'Pronto'" (não é regressão).

Também o menu: a varredura inicial olhou telas isoladas e perdeu que o `nav` do protótipo libera
**todos** os itens pra gestão ("Minha fila" da Distribuidora, RF-19) — confira a lógica de
navegação, não só a tela.

## O protótipo também erra

Em 390px, "O que cada um alcança hoje" não tem rolagem própria e arrasta a página inteira pro
lado. Não replique bug do protótipo — implemente o padrão certo e registre.

## Referências

- `.claude/skills/verify-visual`, `.claude/skills/new-page` (passo 0)
- [e2e-tests](e2e-tests.md)
