---
name: adr-0010-divergencias-deliberadas-do-prototipo
description: Registro consolidado das divergências deliberadas do app em relação ao protótipo aprovado (e dos poucos casos em que o protótipo venceu um requisito), cada uma com o motivo
metadata:
  type: decision
  status: accepted
---

# ADR-0010: Divergências deliberadas do protótipo

> O protótipo aprovado é a fonte de design ([ADR-0003](0003-prototipo-aprovado-como-fonte-de-design.md)),
> mas é uma ferramenta de design sem back real. Onde ele pressupõe algo que o domínio não tem,
> contraria um requisito formal, ou é inseguro, o app diverge **de propósito**. Cada divergência
> abaixo foi uma escolha (em geral confirmada com o dono), não um gap esquecido.

## Status

`Accepted` — consolidado em 2026-09-25 a partir do antigo `CLAUDE.md`; a data de cada item está na
tabela. Divergência nova entra como ADR próprio (se for grande) ou como ADR que substitui este
com a tabela atualizada — não editando este arquivo depois de aceito.

## Contexto

Regra de precedência usada em todas as linhas:

1. **Requisito formal > protótipo** quando os dois conflitam (ex.: RNF-07 "nenhum controle nativo").
2. **O domínio do back manda sobre comportamento**: um desenho que pressupõe uma regra que o
   servidor não tem vira adaptação explícita, não invenção no cliente ([ADR-0006](0006-back-manda-fato-cru-front-resolve-nomes.md)).
3. **Segurança e auditabilidade** vencem atalho de design.
4. Pedido explícito do dono sem correspondência no protótipo entra como divergência registrada.

## Decisão

| Data       | Onde                                               | O protótipo faz                                                                                      | O app faz                                                                                                                                       | Por quê                                                                                                                                                                                       |
| ---------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-27 | Distribuição → Exceções                            | Auto-atribui / navega                                                                                | Seletor manual + confirmar                                                                                                                      | Ver [ADR-0009](0009-manter-atribuicao-manual-de-excecao.md)                                                                                                                                   |
| 2026-08-28 | Importar → `DateTimePicker` (linha de corte)       | Só clique (calendário + stepper −/+)                                                                 | Data `dd/mm/aaaa` e hora/minuto digitáveis, mantendo clique e −/+                                                                               | RF-07 pede corte num minuto exato; só de clique a data errada passava despercebida e o corte nunca filtrava                                                                                   |
| 2026-08-28 | Conferentes → edição de nome/e-mail                | Edita tudo inline no card                                                                            | Modal `EditarConferenteDialog` (lápis ao lado do nome); nível/jornada seguem inline                                                             | Nome/e-mail são do agregado `Usuario`, separado do `Conferente`; passou por "sem edição" → inline → modal                                                                                     |
| 2026-08-28 | Conferentes → "Novo conferente"                    | Insere linha-rascunho local                                                                          | Modal com formulário completo                                                                                                                   | O back exige e-mail/senha reais pra criar o `Usuario` de login junto                                                                                                                          |
| 2026-08-28 | Central de Regras → construtor (RF-32)             | Uma regra com array de alvos                                                                         | Uma regra por alvo selecionado (`Promise.all` de `mutateAsync`)                                                                                 | O back aceita um alvo por regra (RF-31: `AlvoAlcada` é XOR); sem inventar "regra composta"                                                                                                    |
| 2026-08-28 | Central de Regras → Aprendizado                    | KPIs mockados, barra de confiança, chips de casos                                                    | KPIs derivados de dado real; barra de confiança só quando o back passou a calcular (RF-39, 2026-08-31); sem chips de casos                      | Não inventar dado ([ADR-0006](0006-back-manda-fato-cru-front-resolve-nomes.md))                                                                                                               |
| 2026-09-01 | Alçada → Matriz                                    | Clique num grupo cheio cria negação escondida                                                        | Clique só cria/remove a regra atômica que a própria matriz criou (`sujeitoConferenteId` + `Permite`)                                            | Um alvo por regra; alcance vindo de regra de nível compartilhada não tem uma regra óbvia pra remover; negar é escolha explícita no construtor                                                 |
| 2026-09-01 | Alçada → Testar                                    | Seção "SAÍDAS" (sugestões de ajuste)                                                                 | Sem essa seção                                                                                                                                  | O back não calcula                                                                                                                                                                            |
| 2026-09-01 | Alçada → construtor, "Quem"/alvo/Permissão         | Pills                                                                                                | Dropdowns com busca (`SeletorUnico`/`SeletorMultiplo`)                                                                                          | Consistência interna com `SeletorConferente` e `FiltroEixo` (não veio do `.dc.html` — o texto dos prints do dono não existe no arquivo); Permissão a pedido do dono                           |
| 2026-09-01 | Distribuição → linha "escrevente · equipe · etapa" | Trunca com reticências                                                                               | Também trunca, com `title`                                                                                                                      | **Aqui o protótipo venceu o RNF-10**: é dado auxiliar num card operacional, não lista cujo propósito é distinguir registros ([lists-and-long-content](../patterns/lists-and-long-content.md)) |
| 2026-09-01 | Filtros → dia do vencimento                        | `<input type="date">` nativo                                                                         | `shared/ui/date-picker.tsx`                                                                                                                     | RNF-07                                                                                                                                                                                        |
| 2026-09-01 | Pool/colunas → truncamento "+N protocolos"         | 3 (aba conferente) / 4 (aba status)                                                                  | 5 no desktop (`MAX_POOL_VISIVEL`, `ProtocoloColuna`), 8 no mobile (RF-24g)                                                                      | Pedido do dono (3→5); mobile é o número literal do requisito                                                                                                                                  |
| 2026-09-01 | Registrar autenticador (RF-01a)                    | Botão do login vai direto pro QR                                                                     | Pede login antes (`LoginForm` embutido como portão)                                                                                             | `POST /auth/totp/registrar` é autenticado de propósito — senão qualquer um registraria autenticador pra e-mail alheio                                                                         |
| 2026-09-01 | Modal "Novo protocolo" → tipo de ato               | Aceita nome livre ("entra como novo e cai em exceções")                                              | Só tipos já cadastrados, com texto de ajuda honesto                                                                                             | O back só aceita `tipoAtoId`; "tipo desconhecido" só nasce via `ImportarLote` — ver [gaps §16](../gaps-requisitos.md)                                                                         |
| 2026-09-14 | Alçada → Testar → Prioridade                       | Protótipo reexportado removeu o campo                                                                | Campo mantido                                                                                                                                   | Sem ele o destino não reflete urgência (o motor decide primeiro por `Protocolo.Urgente`); reabriria o bug do simulador                                                                        |
| 2026-09-14 | Modal "Novo protocolo" → hora de entrada           | Sem campo                                                                                            | `DateTimePicker` só no modo criação                                                                                                             | Pedido do dono: registrar ato que chegou antes de a distribuidora digitar                                                                                                                     |
| 2026-09-14 | Sidebar recolhível (rail de 68px)                  | Não existe                                                                                           | `useSidebarStore` (persist por navegador), só desktop                                                                                           | Pedido do dono                                                                                                                                                                                |
| 2026-09-15 | Loading                                            | Não tem estado de loading                                                                            | Spinner unificado                                                                                                                               | Ver [ADR-0018](0018-loading-com-spinner-unificado.md)                                                                                                                                         |
| 2026-09-16 | Minha fila → badge "Alta" no card                  | Só em Distribuição (`p.alta`); em Minha fila prioridade é só eixo de filtro                          | Badge também em `ProtocoloCard`/`EmConferenciaCard`                                                                                             | Pedido do dono, confirmado antes de implementar                                                                                                                                               |
| 2026-09-25 | Minha fila → aviso de prioridade alta (RF-24h/i/j) | Memória dos altos já anunciados só em estado React; faixa mobile `top:8px` (fica sob a barra sticky) | `sessionStorage` por usuário ([ADR-0023](0023-aviso-de-prioridade-alta-com-polling-e-sessionstorage.md)); faixa presa em 116px, abaixo da barra | F5 não repete toast nem perde o que chegou durante o reload; o `top` do protótipo esconde a faixa atrás da barra                                                                              |
| 2026-09-25 | Minha fila → coluna "Atribuídas a você"            | 5 cards por coluna (8 no celular) + "+ N protocolos" (RF-24j)                                        | Sem corte (só o pool corta); o "Ver" só abre lista completa no pool                                                                             | Atribuídas raramente passam de poucos itens; cortar criaria um segundo sheet sem uso real                                                                                                     |

Itens que **começaram** como divergência e foram fechados depois (não são mais divergência): 2
níveis de prioridade (3 níveis desde 2026-09-02), "Resumo Operação" com 3 itens (6 desde
2026-09-14), frase de alçada por conferente resumida (completa desde 2026-09-03). Ver
[gaps-requisitos](../gaps-requisitos.md).

## Alternativas consideradas

Pra cada linha, a alternativa descartada é "seguir o protótipo literalmente" — prós: fidelidade
imediata; contras: o motivo da coluna "Por quê". Onde houve uma alternativa diferente dessa, ela
está no ADR próprio linkado ([ADR-0009](0009-manter-atribuicao-manual-de-excecao.md),
[ADR-0018](0018-loading-com-spinner-unificado.md)).

| Alternativa                                       | Prós                        | Contras                                                                                 | Por que foi descartada                 |
| ------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------- |
| Fidelidade literal ao protótipo em todos os casos | Nenhuma decisão a registrar | Dado inventado, controle nativo contra RNF-07, fluxo inseguro, regra que o back não tem | Ver coluna "Por quê"                   |
| Divergir sem registrar                            | Menos documentação          | A próxima sessão "corrige" de volta pro protótipo                                       | É exatamente o que este registro evita |

## Características impactadas

| Característica                  | Impacto            | Justificativa                       |
| ------------------------------- | ------------------ | ----------------------------------- |
| Fidelidade visual               | ⚠️ Piora (pontual) | Divergências localizadas e listadas |
| Correção de domínio / segurança | ✅ Melhora         | Nada pressupõe regra inexistente    |

## Consequências

Antes de "corrigir" algo pra bater com o protótipo, confira esta tabela. Comentários no código
dos componentes também registram a divergência local.

## Referências

- [verificacao-com-prototipo](../patterns/verificacao-com-prototipo.md)
- [docs/historico.md](../historico.md)
