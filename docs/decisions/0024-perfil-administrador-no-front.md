---
name: adr-0024-perfil-administrador-no-front
description: O front mostra ou esconde o que é só do Administrador com useEhAdministrador, trata como ausente (null) o que o back corta, antecipa as travas de desativar conta pela lista e prende a sessão com troca de senha pendente numa guarda em volta do AppShell
metadata:
  type: decision
  status: accepted
---

# ADR-0024: Perfil Administrador no front

> Quem decide o que a distribuidora vê é o back (dispatch-api ADR-0039). O front só (1) esconde o
> controle que devolveria 403, via `useEhAdministrador`; (2) trata como ausente o que chega `null`
> (nível, score, faixa), sem inventar valor; (3) antecipa as travas de "desativar conta" lendo a
> lista, com o 409 do back como rede; (4) prende a conta com senha inicial numa guarda em volta do
> AppShell.

## Status

`Accepted — 2026-09-25`

## Contexto

Requisitos v2, §3: três papéis. "Para a distribuidora a API não devolve nível, score nem faixa, e
rejeita escrita em regras, conferentes e contas." Telas afetadas: Conferentes vira só presença
(RF-29a), Central só leitura (RF-30a), Dashboard vira "Produção por conferente" (RF-43a), Contas
nova (6.8, RF-44 a 48), troca de senha no primeiro acesso (RF-45). O back soma as claims: o admin
chega com `papeis: ['Administrador', 'Distribuidora']`.

## Decisão

- **`useEhAdministrador()`** (`entities/usuario`) em vez de um papel novo nas listas de rota e de
  menu: o admin herda tudo que já checava `'Distribuidora'`, e só o que é dele ganha condição (rota
  `/contas` com `RequireRole(['Administrador'])`, item "Contas", selo "ADMIN", botões e abas de
  edição).
- **Campo cortado é `null` no tipo** (`Conferente.nivel`, `DesempenhoConferente.score`) e cada tela
  trata a ausência: `rotuloAnalista(nivel)` devolve `null`, e quem chama omite a linha. Acabou o
  `?? 'Pleno'` que inventava cargo na prévia da importação. Cuidado registrado no código: com nível
  `null` dos dois lados, `regra.sujeitoNivel === conferente.nivel` casaria todo mundo.
- **Regras em vigor pra quem não é admin** (`lib/alcada-em-vigor.ts`): as regras base (`regraBase`,
  do back) viram uma linha, e cada trio "equipe não faz etapa" sem nível vira uma linha. É só
  agrupamento de apresentação sobre o que o back já mascarou.
- **Travas de desativar conta** (`entities/conta/lib/trava-de-desativacao.ts`): o diálogo abre
  direto no aviso "Entendi" (como no protótipo), lendo `ehVoce` e os admins ativos da lista. Os
  códigos são os mesmos do 409 do back, e um 409 (lista velha) cai no mesmo texto. A regra continua
  sendo do back; o front só evita pedir uma confirmação que vai ser recusada.
- **Troca de senha**: `RequireSessaoLiberada` envolve o AppShell inteiro. Com `trocarSenha`, vai pra
  `/trocar-senha` antes de o shell montar e disparar queries que o back recusaria. A página troca e
  atualiza a sessão **e** o cache de `['usuario-atual']`, porque o `SessionBoot` regrava a sessão
  com esse cache a cada troca de token.

## Alternativas consideradas

| Alternativa                                           | Prós                  | Contras                                                                                | Por que foi descartada               |
| ----------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------- | ------------------------------------ |
| `'Administrador'` nas listas de `RequireRole`/menu    | Explícito por rota    | Toda rota de gestão passaria a listar dois papéis; esquecer um tiraria acesso do admin | O back já soma as claims             |
| Tipos separados pra visão de admin e de distribuidora | Tipo "sabe" o que tem | Duplicaria DTOs e componentes pra uma diferença de 3 campos                            | `null` + tratamento local basta      |
| Travas só pelo 409                                    | Zero regra no front   | A pessoa confirmaria "Desativar a conta de X?" e só depois veria que não pode          | UX do protótipo, com o 409 como rede |
| Checar `trocarSenha` em cada `RequireRole`            | Menos um componente   | O AppShell monta antes e dispara as queries do menu                                    | Guarda única antes do shell          |

## Características impactadas

| Característica          | Impacto   | Justificativa                                                            |
| ----------------------- | --------- | ------------------------------------------------------------------------ |
| Segurança               | ➖ Neutro | A garantia é do back; o front só esconde                                 |
| Fidelidade ao protótipo | ✅        | Textos e fluxos do Dispatch v2, com as correções registradas no ADR-0010 |
| Manutenção              | ⚠️        | As travas existem nos dois lados, com os mesmos códigos                  |

## Consequências

Tela nova com parte "só do admin" usa `useEhAdministrador` e mostra `SeloSoAdministracao` onde o
protótipo mostra. Rota nova que precise funcionar com a troca pendente precisa ficar fora do AppShell
(como `/trocar-senha`) **e** na lista do back.

## Referências

- dispatch-api ADR-0039 e ADR-0040; `docs/gaps-requisitos.md` §41; ADR-0010 (divergências).
