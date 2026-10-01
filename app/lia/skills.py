"""Catálogo local somente leitura das skills distribuídas com a Lia Studio."""
from __future__ import annotations

import re
from pathlib import Path
from typing import Dict, List

from .storage import StorageError

SKILLS_DIR = Path(__file__).resolve().parents[2] / ".agents" / "skills"
SKILL_ID = re.compile(r"^lia-[a-z0-9-]+$")


def _entry(skill_id: str, path: Path) -> Dict[str, str]:
    text = path.read_text(encoding="utf-8")
    title = next((line[2:].strip() for line in text.splitlines() if line.startswith("# ")), skill_id)
    return {"id": skill_id, "title": title, "content": text}


def list_skills() -> List[Dict[str, str]]:
    if not SKILLS_DIR.is_dir():
        return []
    items = []
    for folder in sorted(SKILLS_DIR.iterdir()):
        if folder.is_dir() and SKILL_ID.fullmatch(folder.name) and (folder / "SKILL.md").is_file():
            skill = _entry(folder.name, folder / "SKILL.md")
            items.append({"id": skill["id"], "title": skill["title"]})
    return items


def get_skill(skill_id: str) -> Dict[str, str]:
    if not SKILL_ID.fullmatch(skill_id):
        raise StorageError("skill inválida")
    path = SKILLS_DIR / skill_id / "SKILL.md"
    if not path.is_file():
        raise StorageError("skill não encontrada")
    return _entry(skill_id, path)
