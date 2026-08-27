import { expect, test } from '@playwright/test'

// Checagem pontual: cursor de "mão" em elementos clicáveis (desligado sem querer na
// inicialização do shadcn, ver src/app/styles/index.css). Cursor não aparece em screenshot —
// confere o valor computado de CSS em vez de tentar "ver" o mouse na imagem.
test('botões mostram cursor pointer', async ({ page }) => {
  await page.goto('/login')

  const entrar = page.getByRole('button', { name: 'Entrar' })
  await expect(entrar).toHaveCSS('cursor', 'pointer')
})
