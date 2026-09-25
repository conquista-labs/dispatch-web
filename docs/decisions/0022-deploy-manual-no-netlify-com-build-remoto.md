---
name: adr-0022-deploy-manual-no-netlify-com-build-remoto
description: Deploy de produção é manual via `netlify deploy --prod --build` (build roda no Netlify com VITE_API_URL certa), nunca upload de um dist/ gerado na máquina, e ainda sem CI ligado a git push
metadata:
  type: decision
  status: accepted
---

# ADR-0022: Deploy manual no Netlify, com build remoto

> Produção é o site `lab-dispatch-web` no Netlify. Deploy é sempre `netlify deploy --prod --build`,
> disparado quando o dono decide subir — o build roda do lado do Netlify, onde `VITE_API_URL` está
> configurada. Nunca upload de um `dist/` local.

## Status

`Accepted` — 2026-08-28 (commit `f94c28c`; URL da API atualizada pro Render em 2026-08-31,
commit `4d5dc8d`). Registrado retroativamente em 2026-09-25.

## Contexto

`VITE_API_URL` é variável de **build** (Vite embute no bundle). `vite build` local roda em modo
`production` e **não lê `.env.development`** — um `npm run build` local sem a variável gera bundle
com `VITE_API_URL` `undefined`. Projeto sem CI.

## Decisão

- `VITE_API_URL` configurada via `netlify env:set` (não vai pro repo), apontando pra
  `https://lab-dispatch-api.onrender.com` (o back migrou do Fly.io pro Render quando o Fly saiu do
  free tier sem cartão).
- Deploy sempre com `netlify deploy --prod --build`.
- Sem CI/CD ligado a git push por enquanto.

Operação (URL, `netlify.toml`, redirect de SPA, CORS) em [deploy](../patterns/deploy.md).

## Alternativas consideradas

| Alternativa                     | Prós                        | Contras                                                               | Por que foi descartada      |
| ------------------------------- | --------------------------- | --------------------------------------------------------------------- | --------------------------- |
| Build local + upload do `dist/` | Não depende do build remoto | Bundle com `VITE_API_URL` undefined se a env local não estiver setada | Gotcha real, fácil de errar |
| CI/CD em git push               | Automático                  | Configuração a mais; o dono quer decidir quando sobe                  | Ainda não ligado            |

## Características impactadas

| Característica           | Impacto    | Justificativa                  |
| ------------------------ | ---------- | ------------------------------ |
| Confiabilidade do deploy | ✅ Melhora | Env de produção sempre a certa |
| Automação                | ⚠️ Piora   | Deploy manual                  |

## Consequências

Renomear o site muda a origem CORS: `Cors__AllowedOrigin` no Render precisa acompanhar (os dois
lados guardam o nome um do outro).

## Referências

- `netlify.toml`, `../dispatch-api/CLAUDE.md` ("Deploy — no ar")
