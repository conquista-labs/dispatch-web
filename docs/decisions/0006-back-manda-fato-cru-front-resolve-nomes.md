---
name: adr-0006-back-manda-fato-cru-front-resolve-nomes
description: A API devolve ids e enums crus; o front resolve nomes e rótulos com as leituras que já tem, e nunca inventa dado que o back não calcula
metadata:
  type: decision
  status: accepted
---

# ADR-0006: O back manda o fato cru; o front resolve nomes e não inventa dado

> DTOs de leitura trazem ids (`escreventeId`, `tipoAtoId`, `equipeId`) e enums crus (`Etapa`,
> `TipoPrazo`, `FaixaSemaforo`, `MotivoAlcada`). O front monta o texto ("5º andar ·
> pós-conferência") com rótulos locais (`ETAPA_LABEL`…) e lookups das leituras que já busca. E o
> que o back não calcula não aparece — nem como mock copiado do protótipo.

## Status

`Accepted` — prática desde 2026-08-27 (Importar: `ETAPA_LABEL`/`TIPO_PRAZO_LABEL`), formalizada
em 2026-09-01 (RF-14 no card de Distribuição, `resolverInfoProtocolo`). Registrado
retroativamente em 2026-09-25.

## Contexto

O card de Distribuição precisava de tipo de ato, escrevente e equipe (RF-14). O protótipo mostra
nomes e textos prontos — mas é uma ferramenta de design sem back real, com números mockados
("5.724 linhas lidas", "96% classificadas sem você", índice de confiança fictício). O back tem as
entidades e leituras separadas (`GET /escreventes`, `/equipes`, `/tipos-ato`).

## Decisão

1. **Sem DTO novo com nome embutido**: o back manda o fato cru e o front resolve —
   `criarResolverInfoProtocolo()` (`entities/protocolo/lib/resolver-info-protocolo.ts`, não é hook)
   devolve `InfoProtocolo` (os campos juntos) em vez de N props separadas; o mesmo vale pra
   `fraseDaRegra` (`entities/regraAlcada/lib/frase.ts`), `criarNomesDaCentralDeRegras()`,
   `nomePorTipoAtoId` etc.
2. **Rótulos centralizados na entidade** (`entities/*/lib/rotulos.ts`: `ETAPA_LABEL`,
   `TIPO_PRAZO_LABEL`, `NIVEL_LABEL`, `PRIORIDADE_LABEL`, `GRUPO_LABEL`, `MOTIVO_ALCADA_LABEL`).
3. **Não inventar dado que o back não calcula**: KPIs mockados do protótipo viram métricas
   derivadas de dado real; "N feitos hoje" não aparece enquanto não existe `ConcluidoEm` (mostrar
   um total histórico com rótulo "hoje" seria pior que não mostrar); a seção "SAÍDAS" do simulador
   Testar não existe; regra de negócio não é recriada no front (o simulador que inferia destino
   por contagem foi corrigido pelo back rodando o motor de verdade — `SimularAlcada`).
4. **Exceção registrada**: `AjusteDeDuracao.ajustadoPorNome` vem resolvido do back — quem ajusta é
   sempre uma Distribuidora, que não está necessariamente na lista de Conferentes que o front
   carrega, e não existe `GET /usuarios` geral.

## Alternativas consideradas

| Alternativa                                       | Prós                       | Contras                                 | Por que foi descartada                                                   |
| ------------------------------------------------- | -------------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| DTO enriquecido com nomes (join no back) por tela | Front mais simples         | Um DTO por tela; o back vira formatador | As leituras de catálogo já existem e são reaproveitadas por várias telas |
| Reproduzir os textos/números do protótipo         | Fidelidade visual imediata | Mostra dado falso ao usuário            | Contraria o princípio de o servidor ser a fonte                          |

## Características impactadas

| Característica          | Impacto    | Justificativa                                                                |
| ----------------------- | ---------- | ---------------------------------------------------------------------------- |
| Honestidade do dado     | ✅ Melhora | Nada na tela é mock                                                          |
| Acoplamento de contrato | ✅ Melhora | DTOs pequenos, estáveis                                                      |
| Autorização             | ⚠️ Atenção | As leituras auxiliares precisam ser permitidas pra todo papel que usa a tela |

## Consequências

**Negativas / riscos** — bug real de 2026-09-01: `useEquipes`/`useEscreventes`/`useTiposAto`
voltavam 403 pra Conferente (endpoints eram só Distribuidora); o filtro "funcionava" (marcava "1
filtro ativo") mas não reduzia nada, porque todo lookup caía em `?? null`. Corrigido no back.
**Lição**: toda tela com lookup cruzado deve ser testada logada como o papel de menor privilégio
que a usa ([e2e-tests](../patterns/e2e-tests.md)). Lacunas deixadas por essa regra estão em
[gaps-requisitos](../gaps-requisitos.md) (ex.: chips de "casos concretos" da sugestão).

## Referências

- [ADR-0010](0010-divergencias-deliberadas-do-prototipo.md)
- `.claude/skills/web-testing-strategy` (passo 1: regra de negócio testa no back)
