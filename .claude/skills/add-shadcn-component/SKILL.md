---
name: add-shadcn-component
description: Instala ou atualiza um primitivo shadcn/ui neste projeto pelo fluxo de quarentena (gera em src/shared/ui/generated, compara, copia o que interessa pra src/shared/ui). Use ao adicionar qualquer primitivo shadcn (dialog, select, tabs, table, badge...), ao trazer uma versão nova de um que já existe, ou quando alguém for rodar `shadcn add`. Tem precedência sobre a skill genérica `shadcn` no passo de instalação.
---

# add-shadcn-component

A fundação já está pronta (`components.json`, `src/shared/lib/utils.ts` com `cn()`,
`src/app/styles/index.css` com os tokens). **Não existe ponte de tokens pra manter**: os nomes de
token deste projeto já SÃO os nomes padrão do shadcn (`background`, `card`, `primary`, `border`,
`muted-foreground`...), só com os valores do protótipo aprovado. Um componente gerado cru já lê a
cor certa.

A skill `shadcn` (oficial, copiada do repositório shadcn/ui em `.agents/skills/shadcn`, travada
por hash em `skills-lock.json`) serve pra consulta: `npx shadcn@latest docs <x>`, regras de
composição/formulário/estilo e o MCP (`search_items_in_registries`, `view_items_in_registries`,
`get_item_examples_from_registries`). **O passo de escrever arquivo é sempre o desta skill.**

## Por que quarentena

`shadcn add <x>` reescreve também toda **dependência de registro** de `<x>`, sem `--overwrite` e
sem avisar: `add dialog` escreve `button.tsx` junto. Vários primitivos daqui têm mudança local
deliberada (`progress.tsx`, `popover.tsx`, `calendar.tsx`, `sonner.tsx`, `datetime-picker.tsx`...)
— um `add` direto em `src/shared/ui` desfazia essas correções em silêncio.

Por isso os aliases `ui`/`components` do `components.json` apontam pra
`src/shared/ui/generated/`: pasta ignorada pelo git, fora do `tsc`, do oxlint, do prettier e da
cobertura. `tooling/shadcn-quarantine.test.ts` quebra se o alias, a regra do `.gitignore` ou o
estado da pasta saírem do lugar — **não "corrija" o alias**, ele está certo.

## Fluxo

1. **Veja antes de escrever.** `npx shadcn@latest add <nome> --dry-run` mostra os arquivos e as
   dependências; `--view` mostra o conteúdo. Ou pelo MCP (`view_items_in_registries`).
2. **Gere na quarentena:** `npx shadcn@latest add <nome> -y`. Tudo cai em
   `src/shared/ui/generated/`. `git status` não pode mostrar nada lá dentro.
3. **Desfaça a dependência fantasma.** O registro atual pede um pacote npm chamado `cn` (os
   arquivos gerados importam `from "cn"`). Este projeto usa `@/shared/lib/utils`:
   `git diff package.json` — se entrou `"cn"`, rode `npm uninstall cn`. O mesmo vale pra
   `next-themes` (vem com o `sonner`; aqui o tema é `useThemeStore`).
4. **Compare e copie o que interessa:**
   - primitivo **novo**: copie `generated/<nome>.tsx` pra `src/shared/ui/<nome>.tsx`;
   - primitivo **que já existe** (veio como dependência, ex. `button` pelo `dialog`): **não
     copie**. Só traga algo se o diff (`diff src/shared/ui/<x>.tsx src/shared/ui/generated/<x>.tsx`)
     tiver uma correção de upstream que você quer, e aí aplique à mão, preservando a mudança local.
5. **Ajuste o arquivo copiado:**
   - `import { cn } from "cn"` → `import { cn } from "@/shared/lib/utils"`;
   - imports de irmãos `@/shared/ui/generated/<x>` → `@/shared/ui/<x>`;
   - `npx prettier --write` no arquivo (a quarentena não é formatada).
6. **Confira os bugs já vistos no gerado** (catálogo em `docs/patterns/shadcn-gotchas.md`): prop
   controlada desestruturada e não repassada ao primitivo Radix (o `Progress` perdia `value`),
   dependência de Next.js, `autoFocus` que briga com o visual do protótipo.
7. `npm run build` — confirma que compila.
8. Se o componente participa de uma tela com faixa de prazo/status (semáforo), confira que as
   variantes de cor certas (`ok`/`warn`/`crit`/`bad`, que não são do padrão shadcn) são usadas onde
   o protótipo pede, não `primary`/`destructive` crus.
9. **`verify-visual`** — renderize o componente nos dois temas antes de dar como pronto.

A quarentena pode ficar com arquivos velhos; apague `src/shared/ui/generated/` quando quiser, nada
importa de lá.

## Outras armadilhas

- `npm`, não `yarn`/`pnpm` — o projeto usa `package-lock.json`. Confirme que o CLI não criou
  `yarn.lock`/`pnpm-lock.yaml`.
- Se o arquivo cair numa pasta `@/` literal na raiz, o `tsconfig.json` perdeu o `baseUrl`/`paths`
  (ver `docs/patterns/shadcn-gotchas.md`).
- **Nunca renomeie só a caixa de um arquivo com `mv`** (`Button.tsx` → `button.tsx`): o macOS é
  case-insensitive e isso confunde o git. Use `git mv` com nome intermediário.
