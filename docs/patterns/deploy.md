---
name: deploy
description: Como o dispatch-web vai pro ar — site Netlify, netlify.toml, redirect de SPA, VITE_API_URL, CORS com a API no Render
metadata:
  type: pattern
  domains: [deploy, netlify, infra]
  status: stable
---

# Deploy

> Decisão em [ADR-0022](../decisions/0022-deploy-manual-no-netlify-com-build-remoto.md).

## Quando recorrer a isto

- Subir uma versão pra produção
- Produção chamando a API errada (ou `undefined`)
- Renomear o site ou trocar o host da API

## Onde

- Site **`lab-dispatch-web`** no Netlify → `https://lab-dispatch-web.netlify.app`. Prefixo `lab-`
  pelo mesmo motivo do back (ver `../dispatch-api/CLAUDE.md`, "Deploy — no ar").
- API: `https://lab-dispatch-api.onrender.com` (migrou do Fly.io pro Render quando o Fly saiu do
  free tier sem cartão). Plano free do Render/Neon tem **cold start** — ação que depende de
  feedback imediato precisa de UI otimista ([dados-e-mutations](dados-e-mutations.md)).

## Como

```bash
netlify deploy --prod --build
```

Sempre assim — o build roda do lado do Netlify, com a env certa. Manual, quando o dono decide
subir; sem CI ligado a git push.

- `netlify.toml`: `npm run build` publicando `dist/` + `[[redirects]] /* → /index.html` (status 200) — obrigatório com `BrowserRouter`; sem ele, recarregar em `/distribuicao` dá 404.
- **`VITE_API_URL` é variável de build** (`netlify env:set`, fora do repo). `vite build` local roda
  em `production` e **não lê `.env.development`** → bundle com `VITE_API_URL` `undefined`. Nunca
  suba um `dist/` gerado localmente.

## CORS

- Local: a API aceita `http://localhost:5173` (`AddCors`/`UseCors` só em Development). Nenhum teste
  anterior esbarrou nisso porque `curl`/Postman não fazem preflight — só o browser.
- Produção: `Cors__AllowedOrigin` no dashboard do Render = URL do Netlify. **Renomear o site muda a
  origem** — atualize os dois lados (não há descoberta automática).

## Deploy com mudança de formato persistido

Mudou o formato de algo no localStorage (sessão, stores com `persist`)? Incremente `version` e
escreva o `migrate` antes de subir — sessões antigas quebraram produção uma vez
([ADR-0017](../decisions/0017-sessao-persistida-versionada.md)).

## Referências

- `netlify.toml`, `.env.development`
