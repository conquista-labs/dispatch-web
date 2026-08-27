---
name: add-shadcn-component
description: Instala um componente shadcn/ui neste projeto (alias já configurado pra cair em src/shared/ui, sem precisar de ponte de tokens). Use ao adicionar qualquer primitivo shadcn (dialog, select, tabs, table, badge, etc.).
---

# add-shadcn-component

A fundação já está pronta (`components.json`, `src/shared/lib/utils.ts` com `cn()`,
`src/app/styles/index.css` com os tokens) — diferente de outros projetos do dono, **aqui não
existe ponte de tokens pra manter**: os nomes de token deste projeto já SÃO os nomes padrão do
shadcn (`background`, `card`, `primary`, `border`, `muted-foreground`...), só com os valores
trocados pelos do protótipo aprovado. Um componente gerado cru já lê a cor certa.

## Instalação

```bash
npx shadcn@latest add <componente> [<componente> ...]
```

`npm`, não `yarn`/`pnpm` — este projeto usa `package-lock.json` (`nossa-grana/financas-front`
usa yarn 4, é outro projeto, não misture o hábito). O `shadcn` CLI detecta o gerenciador pelo
lockfile presente; confirme que não criou `yarn.lock`/`pnpm-lock.yaml` sem querer depois de
rodar.

O componente cai direto em `src/shared/ui/<nome>.tsx` (alias `"ui"`/`"components"` em
`components.json` já apontam pra lá) — se cair em outro lugar (ex.: uma pasta `@/` literal na
raiz do projeto), o `tsconfig.json`/`tsconfig.app.json` perdeu o `baseUrl`/`paths`; ver
`CLAUDE.md`, seção "Duas armadilhas do shadcn add", antes de mover na mão.

## Depois de instalar

1. **Nunca renomeie só a caixa de um arquivo com `mv` direto** (`Button.tsx` → `button.tsx`) —
   macOS tem filesystem case-insensitive e isso confunde o git/pode apagar o arquivo. Use
   `git mv` com nome intermediário (ver `CLAUDE.md`).
2. `npm run build` — confirma que compila.
3. Se o componente participa de uma tela com faixa de prazo/status (semáforo), confira que as
   variantes de cor certas (`ok`/`warn`/`crit`/`bad` — não fazem parte do padrão do shadcn) são
   usadas onde o protótipo pede, não as cores genéricas (`primary`/`destructive`) do componente
   cru.
4. **`verify-visual`** — renderize o componente nos dois temas antes de dar como pronto.
