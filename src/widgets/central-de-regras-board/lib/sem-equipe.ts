// Sentinela pra "sem equipe" dentro de estado que só guarda string (alvoSelecionados do
// construtor de regra, equipeSelecionada do simulador "Testar") — o back representa isso com
// EquipeId nulo (RF-29a: "sem equipe" é alvo válido, não ausência). Estava duplicado em
// AbaAlcada.tsx e AbaAlcadaTestar.tsx, sem o comentário explicativo na 2ª cópia — achado numa
// auditoria de qualidade.
export const SEM_EQUIPE = '__sem-equipe__'
