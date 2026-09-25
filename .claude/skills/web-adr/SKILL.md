---
name: web-adr
description: Registra uma decisão de arquitetura/ferramental/produto do dispatch-web como ADR em docs/decisions/, com a numeração, o template e as regras de imutabilidade e substituição deste repo. Use quando uma mudança escolher uma abordagem entre alternativas reais (biblioteca, padrão, divergência deliberada do protótipo, política de teste/lint/deploy), ou quando o usuário pedir "registra essa decisão", "cria um ADR".
---

# adr

Cria um ADR em `docs/decisions/` seguindo exatamente a convenção que já existe — não invente outro
formato.

Leia antes: `docs/decisions/TEMPLATE.md` (a estrutura) e pelo menos um ADR existente como exemplo
do nível de detalhe — `0001-adotar-feature-sliced-design.md` (decisão simples) e
`0007-filtros-de-protocolo-no-cliente.md` + `0008-eixo-prazo-como-alternador-urgente.md` (par com
substituição parcial).

## Quando isto se aplica — e quando não

ADR é pra uma decisão que **escolhe uma abordagem entre alternativas reais** com custos diferentes:
biblioteca, padrão de código, mudança de ferramental (lint, teste, deploy), divergência deliberada
do protótipo ou do requisito, uma política (ex.: ratchet de cobertura).

**Não é ADR**:

- Adição pequena e isolada sem alternativa que valha pesar → nada, ou uma linha em
  `docs/historico.md`.
- Lição aprendida / armadilha / como-fazer ("o `shadcn add` gera `from "cn"`") → pattern doc em
  `docs/patterns/` (ou a skill que executa o fluxo).
- Gap em relação a um RF/RNF → `docs/gaps-requisitos.md`, novo `§N` no fim.

Não crie ADR só porque esta skill foi invocada — se a situação não pede um, diga isso e diga pra
onde a informação vai.

## Entrada

`$ARGUMENTS` é uma descrição curta da decisão. Se vier vazio, pergunte: o que foi decidido, **quais
alternativas foram consideradas e descartadas (e por quê)**, o que continua em aberto/arriscado.
**Não fabrique alternativas** que não foram discutidas. Se houve menos de duas opções reais,
pergunte o que mais foi considerado antes de escrever uma tabela de uma linha só — e se de fato
não houve alternativa, não é ADR (ver acima).

## Passo 1 — o número

```bash
ls docs/decisions/ | grep -E '^[0-9]{4}-' | sort | tail -1
```

Use o próximo número sequencial, com 4 dígitos (`0023`). Nunca reuse nem renumere um ADR existente,
mesmo substituído. Nome do arquivo: `NNNN-titulo-curto-em-kebab-case.md`, em português.

## Passo 2 — preencher o template

Copie a estrutura de `docs/decisions/TEMPLATE.md` inteira (Status, Contexto, Decisão, Alternativas
consideradas, Características impactadas, Consequências, Referências). **Em português** (todo o
`docs/` deste repo é pt-BR; identificadores de código ficam como estão). Frontmatter:
`name: adr-NNNN-titulo-curto`, `description` (uma frase objetiva), `metadata.type: decision`,
`metadata.status`.

- `status: proposed` — ainda não implementado/validado.
- `status: accepted` — só quando está no lugar e confirmado funcionando (código commitado, `web-gate`
  verde, verificação visual feita — o que "funcionando" significar pra essa decisão). Escrever o
  documento não é aceitar a decisão.
- Status com data (`Accepted — AAAA-MM-DD`) e o commit, quando houver.

A tabela de alternativas precisa de trade-offs reais em cada linha, não só o vencedor com células
vazias. No Contexto, cite a fonte da restrição: RF/RNF do documento de requisitos
(`../dispatch-prototype/Dispatch - Requisitos.dc.html`), variável/trecho do protótipo aprovado,
contrato da `dispatch-api`, pedido do dono.

## Passo 3 — imutabilidade e substituição

Um ADR `accepted` **nunca é editado pra mudar o resultado**. Se a decisão for revertida ou revista:

1. Crie um ADR novo que explica o que mudou e por quê, dizendo no Status "Substitui o ADR-00XX" (ou
   "substitui a parte X do ADR-00XX" — substituição parcial vale, ver 0007/0008).
2. No ADR antigo, altere **só** o campo Status (e `metadata.status`): `Superseded by ADR-00YY` — ou,
   se parcial, mantenha `accepted` e acrescente "a parte X foi substituída pelo ADR-00YY".

Diga essa regra explicitamente a quem pediu.

## Passo 4 — ligar as pontas

- Adicione referência de/para ADRs relacionados, `docs/patterns/*.md` e itens de
  `docs/gaps-requisitos.md` que a decisão toca — nos dois sentidos.
- Se a decisão é uma divergência pequena do protótipo, avalie se ela cabe como linha nova num ADR
  que substitua o `0010-divergencias-deliberadas-do-prototipo.md` (não edite o 0010 aceito).
- Se a decisão muda algo que o `CLAUDE.md` cita (stack, comandos, armadilhas), atualize a linha do
  índice — o `CLAUDE.md` aponta pro ADR, não repete o conteúdo.

## Passo 5 — reporte

Número/arquivo, status, a decisão em uma frase, e quais docs foram ligados. Lembre de conferir se
algum pattern doc ou skill que fala do assunto ficou desatualizado agora que existe uma decisão
formal.
