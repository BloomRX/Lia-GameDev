"""Carrega a skill lia-game-project-bootstrap existente para reutilizá-la.

Em vez de duplicar o procedimento da Etapa 0 num wizard concorrente, a aplicação
lê o SKILL.md e os templates originais da skill e os usa como fonte de verdade para
o fluxo de preparação do jogo.
"""
from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Optional

SKILL_ID = "lia-game-project-bootstrap"

# app/lia/__init__.py -> app -> <repo root>
REPO_ROOT = Path(__file__).resolve().parents[2]
SKILL_DIR = REPO_ROOT / ".agents" / "skills" / SKILL_ID


def skill_dir() -> Path:
    return SKILL_DIR


def skill_exists() -> bool:
    return (SKILL_DIR / "SKILL.md").exists()


def read_skill_markdown() -> Optional[str]:
    path = SKILL_DIR / "SKILL.md"
    if not path.exists():
        return None
    return path.read_text(encoding="utf-8")


def read_template(name: str) -> Optional[str]:
    """Lê um template da skill (ex.: PROJECT_BRIEF.md)."""
    path = SKILL_DIR / "templates" / name
    if not path.exists():
        return None
    return path.read_text(encoding="utf-8")


def list_templates() -> List[str]:
    tdir = SKILL_DIR / "templates"
    if not tdir.exists():
        return []
    return sorted(p.name for p in tdir.glob("*.md"))


def read_glossary() -> Optional[str]:
    path = SKILL_DIR / "references" / "glossario-e-metodo.md"
    if not path.exists():
        return None
    return path.read_text(encoding="utf-8")


def read_tests() -> Optional[str]:
    path = SKILL_DIR / "references" / "testes-documentais.md"
    if not path.exists():
        return None
    return path.read_text(encoding="utf-8")


def bootstrap_steps() -> List[Dict[str, str]]:
    """Passos nomeados extraídos do SKILL.md (seção 5) para exibir na UI."""
    md = read_skill_markdown() or ""
    steps: List[Dict[str, str]] = []
    for line in md.splitlines():
        line = line.strip()
        if line.startswith("**Passo") and "**" in line[7:]:
            # **Passo 1 — Captar a ideia ...**
            title = line.strip("*").strip()
            steps.append({"title": title})
    return steps


def template_names_for_bootstrap() -> List[str]:
    return ["PROJECT_BRIEF.md", "GDD.md", "SCOPE.md", "DECISIONS.md", "REFERENCIAS.md"]
