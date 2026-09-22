// Os matchers do jest-dom (`toBeInTheDocument`, `toHaveAttribute`, `toHaveStyle`...) são
// registrados em runtime pelo `vitest.setup.ts`, mas o `tsc -b` não enxerga isso: o setup fica
// fora do `include: ["src"]` do tsconfig.app.json, então a augmentação de `declare module
// 'vitest'` que esse import carrega nunca entrava no programa de tipos — os testes passavam e
// o typecheck reclamava de "Property 'toBeInTheDocument' does not exist".
//
// Mesmo padrão do `vite-env.d.ts` ao lado: um .d.ts dentro de src/ só pra trazer tipo de
// ferramenta pro programa.
import '@testing-library/jest-dom/vitest'
