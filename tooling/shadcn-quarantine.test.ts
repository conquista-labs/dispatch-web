import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

// Fica em tooling/ (não em src/) porque precisa de APIs do Node e o tsconfig.app.json não tem os
// tipos do Node — de propósito, pra código de app não usar global do Node sem perceber.
// `__dirname`, não `import.meta.url`: no ambiente jsdom o Vitest dá a este arquivo uma URL
// `http://localhost`, e `fileURLToPath` recusa qualquer coisa que não seja `file:`.
const raizDoProjeto = path.resolve(__dirname, '..')
const componentsJson = JSON.parse(readFileSync(path.join(raizDoProjeto, 'components.json'), 'utf8')) as {
  aliases: Record<string, string>
}

/**
 * Guarda a guarda (padrão adotado do whitelabel-design-system da Swap).
 *
 * `shadcn add <x>` não escreve só `<x>`: reescreve também toda **dependência de registro** dele.
 * Pedir `dialog` sozinho sobrescreve `button.tsx` sem `--overwrite` e sem citar o Button. Vários
 * primitivos deste projeto têm mudança local deliberada — `progress.tsx` (o `value` que o gerado
 * não repassava), `popover.tsx` (scroll dentro de Dialog), `calendar.tsx` (slots fora do render),
 * `sonner.tsx` (sem next-themes) — e é assim que uma correção dessas volta em silêncio.
 *
 * A proteção é estrutural: o alias `ui` aponta pra `src/shared/ui/generated/`, uma pasta de
 * quarentena ignorada pelo git, então saída do registro nunca cai por cima de um primitivo já
 * curado — compara-se o que chegou e copia-se o que interessa pra `src/shared/ui/`. Três coisas
 * precisam continuar verdadeiras pra isso valer, e este teste quebra se qualquer uma sair do lugar.
 */
describe('quarentena do shadcn add', () => {
  it('aponta os aliases `ui` e `components` pra quarentena, não pros primitivos curados', () => {
    expect(componentsJson.aliases.ui).toBe('@/shared/ui/generated')
    expect(componentsJson.aliases.components).toBe('@/shared/ui/generated')
  })

  it('ignora a quarentena no .gitignore do projeto', () => {
    const regras = readFileSync(path.join(raizDoProjeto, '.gitignore'), 'utf8')
      .split('\n')
      .map((linha) => linha.trim())
    expect(regras).toContain('/src/shared/ui/generated/')
  })

  it('não versiona nada dentro da quarentena', () => {
    let versionados: string
    try {
      versionados = execFileSync('git', ['ls-files', 'src/shared/ui/generated'], {
        cwd: raizDoProjeto,
        encoding: 'utf8',
      })
    } catch (error) {
      // Sem binário do git (ex.: uma imagem de CI mínima): as duas checagens acima continuam
      // valendo; esta roda onde houver git — toda máquina de dev e o pre-commit.
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return
      throw error
    }
    expect(versionados.trim()).toBe('')
  })
})
