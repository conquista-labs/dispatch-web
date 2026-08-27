---
name: new-feature
description: Cria uma slice de feature em src/features (o verbo — PegarProtocolo, IniciarConferencia, AplicarSugestao, CriarRegraAlcada...) com a chamada de escrita à API via TanStack Query mutation e a UI mínima pra disparar a ação. Use ao ligar um botão/formulário a um endpoint de escrita (POST/PUT/DELETE) que ainda não tem slice de feature, ou quando o usuário pedir "criar feature", "ligar essa ação", "fazer o botão de X chamar a API".
---

# new-feature

Gera a slice de uma feature em `src/features/<area>/<verbo>/` seguindo o Feature-Sliced Design
deste projeto (ver `CLAUDE.md`). `features/auth/login` (`src/features/auth/login/`) é a
implementação de referência — leia-a inteira antes de gerar uma nova.

## Nomeie pelo verbo de negócio, igual ao caso de uso do back

Uma feature mapeia 1:1 num caso de uso do `Dispatch.Application` — mesmo nome dos dois lados
de propósito (`PegarProtocolo`, `IniciarConferencia`, `ConcluirConferencia`, `AplicarSugestao`,
`CriarRegraAlcada`...). Se você não sabe qual endpoint/verbo do back essa ação chama, procure
em `../dispatch-api/src/Dispatch.Api/Endpoints/*.cs` antes de nomear — não invente um nome
genérico tipo "salvar" ou "processar".

## Arquivos a criar — `src/features/<area>/<verbo>/`

- **`api/<verbo>.ts`** — função `async` fina chamando `httpClient` (`POST`/`PUT`/`DELETE`),
  tipada com o request/response reais do endpoint (confirme no C#, não invente campo — mesma
  regra da skill `new-entity`). Para endpoint que só devolve `204 No Content`, a função pode
  devolver `void`.
- **`model/use-<verbo>.ts`** — hook `useMutation` do TanStack Query envolvendo a função acima.
  `onSuccess` invalida (`queryClient.invalidateQueries`) as `queryKey`s de `entities/` afetadas
  por essa ação — é assim que a UI re-busca sem F5. Se a ação muda estado local só (ex.: login
  grava na sessão), o `onSuccess` mexe no store da entidade em vez de invalidar query.
- **`ui/<Componente>.tsx`** — só se a feature precisa de UI própria (botão com estado de
  loading, formulário, confirmação). Ações triviais (um botão "Pegar este" que só chama a
  mutation) podem virar um componente pequeno aqui; ações que só fecham um fluxo dentro de um
  card maior podem expor só o hook e deixar o widget/página montar o botão — decida pelo
  tamanho real, sem forçar um arquivo de UI vazio.
- **`index.ts`** — barrel público.

## O que NÃO entra aqui

- Tipo de entidade e leitura (GET) são `entities/`, não `features/` — uma feature usa tipos de
  `entities/`, não redeclara.
- Nenhuma regra de negócio real (quando pode pegar, limite de simultâneos, precedência de
  alçada...) é reimplementada aqui — isso já foi validado no back (`Dispatch.Application`/
  `Dispatch.Domain`) e a API já responde 409/404/403 quando a ação não é permitida. A feature
  só chama e trata o erro que a API já devolve; não duplica a regra em JS.

## Depois de gerar

1. `npx tsc --noEmit`.
2. `verify-visual` — dispare a ação de verdade contra a API local (login real, não mock) e
   confirme o efeito (a UI atualiza, o erro aparece quando a API rejeita).
