---
name: web-commit
description: Leva uma mudança terminada do dispatch-web da árvore de trabalho pra commits no main — confere que o gate rodou nesta árvore, separa um commit por assunto, escreve a mensagem na voz do repositório e só faz push quando o usuário pedir. Use quando o usuário pedir "commita", "fecha o commit", "sobe isso", ou ao terminar uma tarefa que ele pediu pra commitar.
---

# web-commit

Adaptado da metade "commits" da skill `/mr` do swap-benefits-web. Aqui não há branch nem PR: o
dispatch-web commita direto no `main` (GitHub `conquista-labs/dispatch-web`). O deploy do front é
manual (`netlify deploy --prod --build`), então **push não publica**, mas também não se faz sem o
usuário pedir.

## Pré-condições — confira, não suponha

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

## Push

Só quando o usuário pedir. `git push origin main`. Force push é bloqueado pelo `guard-git.py` — se
o remoto divergiu, `git pull --rebase` e rode o gate de novo.

## Relatório

Uma linha por commit (`hash assunto`), o que ficou de fora da árvore e por quê, e se houve push.
