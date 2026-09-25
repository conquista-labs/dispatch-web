---
name: adr-0008-eixo-prazo-como-alternador-urgente
description: O eixo "Prazo" do filtro vira um alternador único "só urgentes e vencendo em 4h" (prioridade Alta ou vence em <4h), no painel de Filtros com Combo — substitui a multisseleção por faixa do ADR-0007
metadata:
  type: decision
  status: accepted
---

# ADR-0008: Eixo "Prazo" como alternador "urgente", em painel de Filtros

> O eixo Prazo deixa de ser multisseleção das 4 faixas do semáforo e vira um alternador:
> prioridade Alta **ou** vence em menos de 4h a partir de agora — o texto literal do RF-18d/RF-18e.
> Os eixos saem da barra fixa e vão pra um painel deslizante ("Filtros", com badge), cada um um
> `Combo`; busca livre e dia do vencimento ficam no toolbar.

## Status

`Accepted` — 2026-09-01 (commit `727ac0e`). Substitui o eixo Prazo do
[ADR-0007](0007-filtros-de-protocolo-no-cliente.md). Registrado retroativamente em 2026-09-25.

## Contexto

O dono reexportou o protótipo com um fluxo novo e um componente novo, `Combo.dc.html` (seletor
com busca que ignora acento, lista rolável, contagem, "Limpar" — o RNF-11 como componente). Lendo
`passaFiltro`/`grupoFiltros`/`painelGrupos` do protótipo (não só o markup — navegando via
`file://`), ficou claro que ele trata "Prazo" como **um único alternador** (`f.urgentes`), e que a
leitura anterior ("o exemplo do requisito é uma combinação, não um eixo", registrada em
`filtros.ts`) estava errada.

## Decisão

- `FiltroProtocolo.faixasSemaforo: FaixaSemaforo[]` → `urgente: boolean`;
  `protocoloPassaNoFiltro` ganha o parâmetro `now` só pra esse cálculo (depende do relógio local
  entre um refetch e outro — não é o semáforo, que já vem calculado do back).
- `FiltroProtocolo` ganha `texto` (busca livre: protocolo, tipo, escrevente, equipe, observação) e
  `data` (chave `"yyyy-mm-dd"` do dia local do vencimento).
- `contagemFiltrosAtivos` (badge) conta só os 4 eixos (equipe/tipo/prioridade/urgente) — `texto`
  e `data` não contam, igual o protótipo (`contaGestao`/`contaFila`).
- `PainelFiltros` (Sheet) com os 4 grupos; **"Prazo" também é um `FiltroEixo`** de uma opção só —
  o protótipo trata os 4 grupos de forma uniforme.
- Data do vencimento usa `shared/ui/date-picker.tsx` próprio, não `<input type="date">` como o
  protótipo (RNF-07; ver [ADR-0010](0010-divergencias-deliberadas-do-prototipo.md)).

## Alternativas consideradas

| Alternativa                                  | Prós           | Contras                                     | Por que foi descartada                             |
| -------------------------------------------- | -------------- | ------------------------------------------- | -------------------------------------------------- |
| Manter multisseleção das 4 faixas (ADR-0007) | Mais granular  | Não é o que o requisito e o protótipo dizem | Leitura do `passaFiltro` real mostrou o alternador |
| Barra de filtros fixa inline                 | Sempre visível | Não bate com o protótipo reexportado        | Protótipo passou a usar painel                     |

## Características impactadas

| Característica          | Impacto    | Justificativa                                  |
| ----------------------- | ---------- | ---------------------------------------------- |
| Fidelidade ao requisito | ✅ Melhora | Texto literal do RF-18d                        |
| Testabilidade           | ➖ Neutro  | Predicado segue puro, agora com `now` injetado |

## Consequências

O limiar de 4h do filtro (`entities/protocolo/lib/filtros.ts`) foi revisado na auditoria de
qualidade (2026-09-02) e mantido: é conceito diferente do semáforo, não reinvenção de regra do back.

## Referências

- `widgets/filtro-protocolos/ui/{FiltroEixo,PainelFiltros,BarraDeFiltros}.tsx`
- [docs/historico.md](../historico.md) — "Painel de Filtros redesenhado"
