---
name: adr-0001-adotar-feature-sliced-design
description: Feature-Sliced Design como arquitetura do dispatch-web, em vez da Clean Architecture portada pro front do financas-front
metadata:
  type: decision
  status: accepted
---

# ADR-0001: Adotar Feature-Sliced Design

> O front é organizado em camadas FSD (`app → pages → widgets → features → entities → shared`),
> cada uma importando só das de baixo. Escolhido no lugar da Clean Architecture de front do
> `financas-front` porque dá a mesma disciplina de dependência sem a cerimônia de 4 arquivos por
> endpoint — que não se paga num front sem regra de negócio.

## Status

`Accepted` — 2026-08-27 (scaffold inicial, commit `13c6645`). Registrado retroativamente em
2026-09-25 a partir do antigo `CLAUDE.md`.

## Contexto

Decisão tomada com o dono comparando duas referências:

- **`financas-front`** (`../../nossa-grana/financas-front`), projeto irmão que porta Clean
  Architecture de back pra front — `domain/data/infra/presentation/main`, com interface +
  implementação + factory + hook **por endpoint**.
- **[Feature-Sliced Design](https://feature-sliced.design/)**.

A restrição que decide: neste sistema **a regra de negócio inteira mora no back**
(`dispatch-api`: motor de distribuição, alçada, prazo, score). O front só chama endpoint e
renderiza. O back já tem dependência unidirecional (`Domain` nunca conhece `Application`), e o
dono queria a mesma disciplina aqui.

## Decisão

Vamos usar Feature-Sliced Design, com as camadas:

```
app/       composition root: providers, roteamento, guarda de papel, wiring do http client
pages/     uma pasta por rota — compõem widgets, quase sem lógica própria
widgets/   blocos de UI grandes, compostos de features + entities (ex.: o board de Minha fila)
features/  um verbo por slice — mapeia direto nos casos de uso do back (PegarProtocolo,
           AplicarSugestao, CriarRegraAlcada...). Mesmo nome dos dois lados de propósito.
entities/  os substantivos do domínio (Protocolo, Conferente, Equipe...) — leitura (GET) e tipo,
           não ações
shared/    infraestrutura sem regra de negócio: cliente HTTP, query client, config de rota, kit de UI
```

Uma camada só importa das que estão abaixo dela — nunca do lado, nunca de cima. Exceção aceita
do próprio FSD: widgets do mesmo nível podem se importar **pela API pública (barrel)**, nunca por
caminho direto pro `ui/` interno (precedente: `fila-do-conferente-board` e `filtro-protocolos`
reaproveitando `minha-fila-board`). `import type` cruzado entre duas entities (ex.:
`entities/protocolo` ↔ `entities/regraAlcada`) é aceito — tipo é apagado no build, sem ciclo real.

TanStack Query **é** a camada de acesso a dados: não existe "usecase" próprio por cima dos hooks
de query/mutation.

## Alternativas consideradas

| Alternativa                                           | Prós                                                                                             | Contras                                                                          | Por que foi descartada                                                                 |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Clean Architecture de front (padrão `financas-front`) | Disciplina forte, já conhecida pelo dono; troca de implementação por interface                   | 4 arquivos (interface, implementação, factory, hook) por endpoint                | A cerimônia existe pra isolar regra de negócio — aqui não há regra no front pra isolar |
| Feature-Sliced Design (escolhido)                     | Dependência unidirecional nativa de front; `features/` com o mesmo nome dos casos de uso do back | Regras de import não são checadas por ferramenta (sem Steiger/lint de fronteira) | —                                                                                      |

## Características impactadas

| Característica             | Impacto    | Justificativa                                                                            |
| -------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| Manutenibilidade           | ✅ Melhora | Lugar óbvio pra cada coisa; skills `new-entity`/`new-feature`/`new-page` operacionalizam |
| Rastreabilidade front↔back | ✅ Melhora | `features/<verbo>` = caso de uso do `Dispatch.Application`                               |
| Verbosidade                | ✅ Melhora | Sem factory/interface por endpoint                                                       |
| Enforcement                | ⚠️ Piora   | Fronteira de camada depende de revisão, não de lint                                      |

## Consequências

**Positivas** — o kit de UI tem um lugar só (`shared/ui`; os aliases do `components.json` foram
ajustados pra FSD no init e hoje passam por uma quarentena, ver
[shadcn-gotchas](../patterns/shadcn-gotchas.md)); cada slice tem barrel público.

**Negativas** — `shared` não pode importar de `entities`, então o cliente HTTP não enxerga a
sessão: resolvido por inversão de dependência, ver [ADR-0002](0002-sessao-sem-decodificar-jwt.md).

**Riscos** — import proibido passar em revisão. Mitigação hoje: skills de scaffold e revisão.

## Referências

- `.claude/skills/new-entity`, `new-feature`, `new-page`
- [docs/historico.md](../historico.md) — "Scaffold, autenticação e design system"
