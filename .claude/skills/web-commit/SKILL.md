---
name: web-commit
description: Leva uma mudança terminada do dispatch-web da árvore de trabalho até um pull request aberto — branch, gate rodado nesta árvore, um commit por assunto na voz do repositório, push e `gh pr create`; o merge e o deploy só quando o usuário pedir. Use quando o usuário pedir "commita", "abre o PR", "sobe isso", ou ao terminar uma tarefa que ele pediu pra entregar.
---

# web-commit

Adaptado da skill `/mr` do swap-benefits-web. **Toda mudança sai por branch + pull request** no
GitHub (`conquista-labs/dispatch-web`) — decisão do dono de 25/09/2026. Commit e push no `main` são
bloqueados pelo hook `guard-git.py`. O deploy do front é manual (`netlify deploy --prod --build`),
então nem o merge publica.

## Pré-condições — confira, não suponha

0. **Está numa branch, não no `main`.** Senão: `git switch -c <tipo>/<assunto-em-kebab-case>`
   (`feat/`, `fix/`, `chore/`, `docs/`, `test/`), em português (`feat/aviso-prioridade-alta`).
1. **O `web-gate` rodou nesta árvore exata** (tier 1 no mínimo: `npm run check`). Se algo mudou
   depois, rode de novo. Nunca escreva no commit uma verificação que não rodou.
2. `git status --short` mostra só o que você quis mudar. Pode haver outra sessão no mesmo checkout:
   **nunca `git add -A` nem `git add .`** — adicione caminho por caminho. `package-lock.json` que
   você não mexeu fica fora. Arquivo de verificação temporária (`e2e/*-verify.spec.ts`,
   screenshots) não entra.
3. Mudança que também mexeu no `dispatch-api` é commitada lá, com a skill `api-commit`.

## Um commit por assunto

Uma correção de bug e uma feature nova são dois commits, mesmo na mesma sessão. O diff do
`vitest.config.ts` que o ratchet de cobertura reescreveu vai **junto** com os testes que o
subiram. Quando um arquivo cobre dois assuntos, ponha no commit a que ele mais pertence e diga
isso no corpo (staging interativo não funciona aqui).

## Voz

- **Assunto**: `tipo(escopo): o que mudou`, em português, sem ponto final, até ~72 caracteres.
  `tipo` ∈ `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `style`. `escopo` é a
  slice ou a tela (`minha-fila`, `distribuicao`, `central-de-regras`, `shared-ui`...).
- **Corpo**: o **porquê**, e o que se aprendeu. Nomeie o mecanismo do bug, não só o sintoma ("o
  Sheet fechava a si mesmo no mesmo clique que abria o detalhe"). Cite arquivo/função quando eles
  carregam o argumento. Se veio de um relato do dono ou de uma divergência com o protótipo, diga.
  Decisão nova que merece registro vira ADR (skill `web-adr`), não um parágrafo gigante aqui.
- **Rodapé**: a linha `Co-Authored-By` que a sessão fornece no lembrete de atribuição — copie
  como veio, não digite nome de modelo de memória.

## Mecânica

- Mensagem de mais de uma linha: escreva num arquivo no scratchpad e use `git commit -F <arquivo>`.
- `git add <caminhos>` e `git commit` em chamadas **separadas** — encadeado com `&&`, um bloqueio
  deixa você sem saber o que rodou.
- O pre-commit do husky roda `lint-staged` (prettier + oxlint). Se falhar, corrija e faça um
  commit **novo** — nunca `--no-verify` (o hook `guard-git.py` bloqueia) e nunca `--amend` num
  commit que já foi pro remoto.

## Push e PR

Depois dos commits, sem perguntar de novo (o usuário já pediu a entrega):

1. `git push -u origin <branch>`.
2. `gh pr create --base main --head <branch> --title "<tipo(escopo): resumo>" --body-file <arquivo>`
   (o `gh` está autenticado como `juniorconquista`). Corpo com as seções: **O que entra**,
   **Decisões que valem leitura**, **Armadilhas**, **Verificação** (números exatos; nunca afirme
   verificação que não rodou) e **Fora de escopo**; termina com a linha de atribuição de PR que a
   sessão fornece.
3. Mudança que depende de PR do `dispatch-api`: diga no corpo ("Depende de conquista-labs/dispatch-api#N")
   e a ordem de merge (API primeiro).

**Merge e deploy só quando o usuário pedir** ("pode mergear", "vamos subir"): `gh pr merge <n> --merge`,
depois `git switch main && git pull --ff-only` e `git branch -d <branch>`; o deploy é
`netlify deploy --prod --build` a partir do `main` limpo, **depois** que a API da mesma entrega
estiver no ar (ver skill `prod-ops` do api). Force push é bloqueado — se o remoto divergiu,
`git pull --rebase` na branch e rode o gate de novo.

## Relatório

Uma linha por commit (`hash assunto`), o link do PR, o que ficou de fora da árvore e por quê.
