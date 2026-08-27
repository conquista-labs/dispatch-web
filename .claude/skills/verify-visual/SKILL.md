---
name: verify-visual
description: Verifica no navegador (Playwright) uma tela do Dispatch — layout fiel ao protótipo aprovado, nos dois temas (claro/escuro), e fluxos com dados reais fazendo login de verdade contra a API (sem bypass, sem injetar token). Use depois de construir ou alterar uma tela, depois de adicionar um componente shadcn, ao validar um fluxo contra a API real, ou quando o usuário pedir "conferir visual", "testar no navegador", "bate com o protótipo?".
---

# verify-visual

Confirma que uma tela está fiel ao protótipo aprovado (`../dispatch-prototype/Dispatch.dc.html`)
antes de dar como pronta. É checagem visual/comportamental — complementa (não substitui)
`npm run build` e `tsc --noEmit`.

## Por que Playwright aqui, especificamente

Nenhuma sessão de Claude Code que construiu este projeto até agora teve uma ferramenta de
browser interativa disponível (MCP de browser) — todo o design system foi traduzido do HTML do
protótipo por leitura, nunca visto rodando. `@playwright/test` roda via `npx playwright test`
(headless, por Bash, sem precisar de MCP) e tira screenshot — depois **leia o PNG com a
ferramenta de leitura de arquivo/imagem** pra realmente ver o resultado. Esse par
(`playwright test` + ler o PNG gerado) é o jeito de fechar o loop de verificação visual nesta
sessão. Sempre prefira isso a description sem checar.

## Rodar

1. **Suba a API** (precisa dela pra qualquer teste que faça login de verdade —
   `e2e/auth.spec.ts`): a partir de `../dispatch-api`,
   `ASPNETCORE_ENVIRONMENT=Development dotnet run --project src/Dispatch.Api --no-launch-profile --urls http://localhost:5245`
   (ou a porta que `VITE_API_URL` do `.env.development` apontar). Confirme com
   `curl -s http://localhost:5245/health`.
2. **Rode os testes**: `npm run e2e` (roda tudo) ou `npx playwright test e2e/<arquivo>.spec.ts`
   (um arquivo só). O `playwright.config.ts` já sobe o Vite dev server sozinho
   (`webServer`, reaproveita se já tiver um rodando em `:5173`) — não precisa subir na mão.
3. **Leia os screenshots** em `e2e/.screenshots/*.png` com a ferramenta de leitura de imagem.
   Esse diretório é gitignored (artefato de verificação, não fixture).

## Login de verdade, sem OAuth e sem bypass

Diferente de outros projetos do dono (`nossa-grana/financas-front` usa Google OAuth + um
`VITE_SKIP_AUTH` só pra layout, porque o Playwright não consegue fazer o fluxo OAuth), o
Dispatch loga por e-mail/senha simples — **o teste preenche o formulário e clica "Entrar" de
verdade**, sem truque nenhum:

```ts
await page.goto('/login')
await page.getByLabel('E-mail').fill(EMAIL)
await page.getByLabel('Senha').fill(SENHA)
await page.getByRole('button', { name: 'Entrar' }).click()
```

Credenciais de teste (usuário Distribuidora já seedado no Postgres local, usado a sessão
inteira que construiu este projeto): `distribuidora@cartorio.com` / `Senha123!`. Se algum dia
não existir mais (banco resetado), cadastre um via `POST /conferentes` com um usuário
Distribuidora primeiro rodando a skill equivalente do `dispatch-api`, ou pergunte ao dono —
não invente credencial nem hardcode senha nova sem confirmar.

Pra checar só **layout/tema** sem precisar de API (não depende de dado real), navegue direto
pras páginas públicas (`/login`) ou use `page.addInitScript` pra pré-popular o `localStorage`
do Zustand `persist` — formato `{"state":{...},"version":0}`. Exemplo pro tema:
```ts
await page.addInitScript(() => {
  localStorage.setItem('dispatch-tema', JSON.stringify({ state: { tema: 'dark' }, version: 0 }))
})
```
Chave da sessão é `dispatch-session` (`entities/usuario/model/session-store.ts`) — só use isso
pra montar cenário de UI que não precisa bater na API de verdade; qualquer coisa que dependa de
dado (lista de protocolos, conferentes...) precisa do login real, senão a API rejeita o token
inventado.

## Checklist (nos dois temas — claro é o padrão, escuro via `dispatch-tema` no localStorage)

- **Cores batem com o protótipo aprovado**, não com o default do shadcn: fundo `bg-background`,
  cartões `bg-card`, texto `text-foreground`/`text-muted-foreground`/`text-text-2..5`, bordas
  `border-border`. Se algo está preto puro ou cinza genérico onde devia ter um tom específico
  (ex.: as 4 faixas do semáforo — `bg-ok-bg`, `bg-warn-bg`, `bg-crit-bg`, `bg-bad-bg`), é sinal
  de classe errada ou token faltando — ver `src/app/styles/index.css`.
- **Fontes**: texto em Instrument Sans; qualquer número de protocolo, prazo, score ou dado
  tabular em JetBrains Mono (`font-mono`). Se um número parece estar na fonte de texto comum,
  falta a classe.
- **Logo**: a ampulheta (`shared/ui/logo.tsx`) — crachá escuro na sidebar (`variant="on-light"`,
  acompanha o tema), crachá claro no painel de login (`variant="on-dark-fixed"`, sempre claro,
  não muda com o tema do app).
- **RF-04** (tema): o toggle na sessão da sidebar troca `Claro`/`Escuro` e persiste — recarregue
  a página depois de trocar e confirme que o tema se manteve (não voltou pro padrão).
- **Guarda de papel** (RNF-04 no front): logue como Distribuidora e confirme que só os itens de
  nav dela aparecem; tentar acessar uma rota de outro papel redireciona pra home do seu papel,
  não mostra a tela.
- **Responsivo**: não é requisito formal ainda (RNF-08 marca "pendente no protótipo" só pra
  Minha fila) — não é bloqueante hoje, mas anote se algo quebra feio em tela estreita.

## Reporte

Diga quais rotas/telas passaram, cite os arquivos de screenshot que você leu, e reporte com
honestidade — se o login falhou (API fora do ar, credencial mudou) ou algo não bateu com o
protótipo, diga isso em vez de presumir que está certo. Ao terminar, não é preciso apagar
`e2e/.screenshots/` na mão (gitignored), mas evite deixar screenshots de um estado quebrado
como se fossem o resultado final — rode de novo depois de corrigir.
