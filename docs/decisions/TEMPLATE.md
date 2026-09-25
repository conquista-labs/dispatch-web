---
name: adr-NNNN-titulo-curto
description: Uma frase objetiva descrevendo a decisão registrada
metadata:
  type: decision
  status: proposed
---

<!-- Tudo em docs/ deste repositório é escrito em português (o dono e o código são pt-BR).
Identificadores de código ficam como estão. Use a skill /adr pra criar um ADR novo — ela cuida
da numeração e das regras abaixo. -->

# ADR-NNNN: Título em frase nominal curta

> Resuma a decisão em 1-2 frases. Quem ler só o índice deve entender o que foi decidido sem abrir
> o arquivo.

## Status

`Proposed` | `Accepted` | `Superseded by ADR-00XX` | `Deprecated` | `Rejected` — data (AAAA-MM-DD).

Um ADR aceito **não é editado para mudar de ideia depois**. Se a decisão for revertida ou
substituída, crie um ADR novo e volte aqui só para atualizar este campo (e o `metadata.status`).
Substituição parcial vale: diga qual parte foi substituída e por qual ADR.

## Contexto

Que força técnica, de domínio ou de produto pressiona essa decisão? Que restrições existem (o
protótipo aprovado, o documento de requisitos, o contrato da `dispatch-api`, prazo, débito já
assumido)? Descreva o problema antes da solução — quem ler daqui a um ano precisa entender por
que isso virou uma decisão e não só "a forma que sempre fizemos".

## Decisão

Frase declarativa, em voz ativa: "Vamos usar X para resolver Y porque Z."

## Alternativas consideradas

Toda decisão de arquitetura é um trade-off. Liste o que foi descartado e por quê — é essa parte
que impede o mesmo debate de voltar meses depois sem registro. **Só alternativas que de fato
foram consideradas**; se não houve alternativa real, não é ADR (é padrão — `docs/patterns/` — ou
histórico — `docs/historico.md`).

| Alternativa | Prós | Contras | Por que foi descartada |
| ----------- | ---- | ------- | ---------------------- |
| A           | ...  | ...     | ...                    |
| B           | ...  | ...     | ...                    |

## Características impactadas

| Característica       | Impacto                           | Justificativa |
| -------------------- | --------------------------------- | ------------- |
| ex: Testabilidade    | ✅ Melhora / ⚠️ Piora / ➖ Neutro | ...           |
| ex: Fidelidade       | ...                               | ...           |
| ex: Manutenibilidade | ...                               | ...           |

## Consequências

**Positivas** — o que fica mais fácil a partir de agora.

**Negativas** — o que fica mais difícil, ou débito assumido conscientemente.

**Riscos** — o que pode dar errado e como seria percebido (teste, verificação, revisão futura).

## Referências

Commits, seções de `docs/historico.md`, `docs/patterns/...`, itens de `docs/gaps-requisitos.md`,
RFs/RNFs do documento de requisitos, seções do `../dispatch-api/CLAUDE.md`.
