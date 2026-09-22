---
name: gate
description: Roda a cadeia de verificação completa do dispatch-web uma vez, no fim de uma tarefa — typecheck, lint, cobertura, build e Playwright — e persegue o que ela apontar. Use quando terminar uma mudança, antes de commitar, ou quando o usuário pedir "roda tudo", "está tudo verde?".
---

# gate

Roda a cadeia inteira **uma vez, quando a tarefa está pronta** — não entre uma edição e outra.
Se você está prestes a rodar a suíte pra *descobrir* o que quebrou, leia o arquivo: nome de
helper errado ou fixture velha aparece na fonte, e sai mais rápido.

## Tiers

Nesta ordem — cada um é mais lento que o anterior e não faz sentido rodar com o anterior vermelho.

1. **`npm run check`** — `tsc -b`, `oxlint` e `vitest run --coverage` de uma vez. Falha mais
   rápido, no problema mais barato.
2. **`npm run build`** — build de produção. Pega o que o `tsc` não pega (ex.: dependência de
   teste vazando pro bundle).
3. **`npm run e2e`** — Playwright contra o app + a API local. Exige a API de pé
   (`dispatch-api`, `dotnet run`) — o `globalSetup` chama `POST /dev/seed-e2e` e falha cedo,
   com mensagem clara, se ela não responder. Ver a skill `verify-visual` pro fluxo de conferir
   tela nos dois temas.

Mudança só de documentação: tier 1 basta. Qualquer coisa em `src/`: os três.

## Lendo a saída sem inundar o transcript

A tabela de cobertura é longa e quase toda irrelevante. Filtre:

```bash
npm run test:coverage 2>&1 | grep -E "Tests |Test Files |ERROR|Statements|Branches|Functions|Lines|Updating"
```

E2E: filtre por `passed|failed|flaky|✓|✘`, e **nunca deixe credencial passar** — `grep -viE
"senha|password|token"` por hábito.

## O ratchet de cobertura

`vitest.config.ts` tem `thresholds.autoUpdate: true` — os números só sobem, e run que cobre
menos que o commitado **falha de verdade** (exit 1, confirmado, não é só aviso na tela). Quando
isso acontecer depois de adicionar código:

1. Ache as linhas descobertas na coluna "Uncovered Line #s".
2. Pra cada uma, decida: **é alcançável?**
   - Alcançável → escreva o teste (ver skill `testing-strategy` pra decidir qual tipo).
   - Inalcançável → **não teste, remova.** Aperte o tipo pra o ramo deixar de ser
     representável, ou mova a guarda pra onde o estreitamento já acontece.
3. **Mock esconde default**: se um valor padrão vive dentro da função que o teste mockou, o
   teste do componente nunca o vê. Teste o default onde ele mora (a função de `api/`) e afirme
   a contribuição do chamador à parte.

Nunca abaixe um threshold na mão (ver `testing-strategy`).

## Armadilhas que este repositório já pagou

- **`tsc` passa e a tela continua errada.** O `Progress` do shadcn tipava certinho e renderizava
  uma barra invisível (não repassava `value` pro Root do Radix) — só teste de componente ou
  inspeção de DOM pega isso.
- **Um teste pode verificar o código e não a experiência.** Se o teste precisa *desfazer* uma
  ação do usuário pra observar um estado, pergunte se um usuário real chegaria a ver esse estado.
- **Rodar só os 4 specs "de sempre" não detecta regressão de navegação.** Mudança de rótulo no
  `AppShell` já quebrou silenciosamente 3 specs que nem tocam esse arquivo — depois de mexer em
  nav/rota, rode a suíte e2e inteira.
- **`sleep` longo é bloqueado no harness.** Pra esperar servidor, use laço `until`, não sleeps
  encadeados.
- **Classe Tailwind nova parecendo "sem efeito"** num dev server de sessão longa: reinicie o
  Vite antes de desconfiar do código.

## Reporte

Números crus: testes passados, as 4 métricas de cobertura, se o ratchet subiu, status do build,
contagem do e2e. Se algo está vermelho, cite a asserção que falhou — não resuma.
