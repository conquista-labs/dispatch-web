#!/usr/bin/env python3
"""PostToolUse (Edit|Write|MultiEdit): roda o prettier só no arquivo que acabou de ser editado.

Adaptado do swap-benefits-web. Formatar `src/` inteiro depois de uma edição reformata arquivos
que não tinham nada a ver, e esse ruído vai parar no commit. Formatar só o arquivo tocado deixa o
diff no que se quis mudar — é o mesmo comando que o lint-staged roda no commit (inclusive o
`prettier-plugin-tailwindcss`, que reordena classe), só que antes.

Nunca bloqueia: qualquer falha sai com 0 e só avisa no stderr.
"""

import json
import os
import subprocess
import sys

FORMATAVEIS = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".css", ".yml", ".yaml"}
# `.md` fica de fora de propósito: CLAUDE.md, docs/ e SKILL.md são texto quebrado à mão.
PASTAS_IGNORADAS = (
    "/node_modules/", "/dist/", "/coverage/", "/playwright-report/", "/test-results/",
    "/src/shared/ui/generated/", "/.agents/",
)


def raiz_do_repo() -> str:
    """O repositório deste hook, achado pelo próprio arquivo (`<repo>/.claude/hooks/x.py`)."""
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0
    if payload.get("tool_name") not in {"Edit", "Write", "MultiEdit"}:
        return 0

    arquivo = payload.get("tool_input", {}).get("file_path", "")
    if not arquivo or not os.path.isfile(arquivo):
        return 0
    if os.path.splitext(arquivo)[1] not in FORMATAVEIS:
        return 0
    if any(pasta in arquivo for pasta in PASTAS_IGNORADAS):
        return 0

    repo = raiz_do_repo()
    # Só arquivo deste repositório — a sessão também escreve em scratchpad, memória e no outro repo.
    if not os.path.abspath(arquivo).startswith(repo + os.sep):
        return 0

    try:
        resultado = subprocess.run(
            ["npx", "prettier", "--write", "--ignore-unknown", "--log-level", "warn", arquivo],
            cwd=repo,
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )
        if resultado.returncode != 0 and resultado.stderr.strip():
            sys.stderr.write(f"prettier: {resultado.stderr.strip()}\n")
    except (OSError, subprocess.TimeoutExpired) as erro:
        sys.stderr.write(f"hook do prettier pulado: {erro}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
