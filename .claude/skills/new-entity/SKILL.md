---
name: new-entity
description: Cria uma slice de entidade em src/entities (o substantivo do domínio — Protocolo, Conferente, Equipe, RegraAlcada, TipoAto, Sugestao...) com tipo, leitura (GET) via TanStack Query, e barrel público. Use ao consumir pela primeira vez um recurso de leitura da API que ainda não tem slice de entidade, ou quando o usuário pedir "criar entidade", "adicionar leitura de X", "preciso do tipo de Y".
---

# new-entity

Gera a slice de uma entidade em `src/entities/<nome>/` seguindo o Feature-Sliced Design deste
projeto (ver `CLAUDE.md`). `entities/usuario` (`src/entities/usuario/`) é a implementação de
referência — leia-a inteira antes de gerar uma nova, este arquivo é só o checklist.

## Regra de ouro: o tipo espelha a API, nunca inventa campo

Antes de escrever `model/types.ts`, confirme o formato exato do response no
`../dispatch-api` — leia o endpoint em `src/Dispatch.Api/Endpoints/*.cs` (o `record` de
resposta) ou rode a chamada real (`curl` contra `:5245`, com token). **Não adivinhe nome de
campo nem invente propriedade que "provavelmente" existe.** Se o campo do C# é
`DateTimeOffset?`, o tipo TS é `string | null` (JSON não tem `Date`, e o `axios` não faz
parse automático) — nunca `Date`.

## Arquivos a criar — `src/entities/<nome>/`

- **`model/types.ts`** — os tipos TS que espelham o(s) response(s) da API pra essa entidade.
  Nome de campo em `camelCase` (o back já serializa assim — `JsonStringEnumConverter` +
  convenção padrão do `System.Text.Json`). Enums do C# viram union type de string literal
  (`type Papel = 'Distribuidora' | 'Conferente'`), nunca `enum` do TypeScript.
- **`api/get-<algo>.ts`** — função `async` fina chamando `httpClient` de
  `@/shared/api/http-client` (`GET`), devolvendo o tipo de `model/types.ts`. Uma função por
  endpoint de leitura (`getProtocolo`, `getProtocolosDaDistribuicao`...).
- **`model/use-<algo>.ts`** — hook `useQuery` do TanStack Query envolvendo a função acima.
  `queryKey` descritiva e única (`['protocolo', id]`, `['protocolos-distribuicao', loteId]`) —
  é o que invalida certo depois de uma mutation em `features/`. Sem `staleTime` alto por
  padrão (dado de fila muda o tempo todo); só adicione se o dado for genuinely estável (ex.:
  catálogo de tipos de ato).
- **`index.ts`** — barrel público: exporta os tipos e os hooks. Nenhum outro lugar do app
  importa de dentro de `entities/<nome>/model` ou `api` direto — sempre pelo barrel.

## O que NÃO entra aqui

- Ações (pegar, aprovar, criar, mover...) são `features/`, não `entities/` — ver a skill
  `new-feature`. Entidade só lê.
- Composição visual de card/lista/board é `widgets/` ou `pages/`, não `entities/` — a entidade
  não sabe como é desenhada, só o que é.

## Depois de gerar

1. `npx tsc --noEmit` — confirma que os tipos resolvem.
2. Se a entidade tem dado real pra puxar (protocolo, conferente...), teste a leitura com a
   skill `verify-visual` contra a API local, não só contra tipo — confirma que o shape bate de
   verdade, não só que compila.
