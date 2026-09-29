"""Preparação de build/release — checklist, créditos/licenças, notas, estado.

NÃO compra, faz upload, publica, anuncia ou libera build externamente. Apenas prepara
o estado e a documentação para release, deixando claro o que foi validado.
"""
from __future__ import annotations

from typing import Any, Dict, List

from .storage import Storage

DEFAULT_CHECKLIST = [
    "Build gerada localmente (ou marcado como não testado).",
    "Testes finais executados e registrados em QA.",
    "Créditos e licenças de assets revisados.",
    "Notas de versão escritas.",
    "Compatibilidade (Windows) verificada ou declarada como limitação.",
    "Backup/exportação do projeto realizada.",
]


def get_release(storage: Storage, project_id: str) -> Dict[str, Any]:
    data = storage.read_structured(project_id, "release.json")
    if not isinstance(data, dict):
        data = {}
    data.setdefault("checklist", [{ "item": i, "done": False } for i in DEFAULT_CHECKLIST])
    data.setdefault("credits", "")
    data.setdefault("version_notes", "")
    data.setdefault("state", "preparando")
    data.setdefault("published", False)
    return data


def save_release(storage: Storage, project_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    allowed = {"checklist", "credits", "version_notes", "state", "published", "engine_profile"}
    clean = {k: v for k, v in data.items() if k in allowed}
    current = get_release(storage, project_id)
    current.update(clean)
    storage.write_structured(project_id, "release.json", current)
    from .bootstrap import _append_journal
    _append_journal(storage, project_id, "Preparação de release atualizada (sem publicação externa).")
    return current
