"""QA / playtest — registro de verificações com evidência.

Distingue: planejado · executado · aprovado pelo Dev. Nenhuma execução real de teste
é feita pelo produto; o Dev registra a ferramenta, comando, data, saída/evidência e
resultado. Não afirmamos que um teste passou se a ferramenta não foi executada.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List

from .storage import Storage

RESULT_STATES = ["planejado", "executado", "aprovado_dev", "falhou"]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _new_id() -> str:
    return uuid.uuid4().hex[:8]


def get_verifications(storage: Storage, project_id: str) -> List[Dict[str, Any]]:
    data = storage.read_structured(project_id, "qa.json")
    return data if isinstance(data, list) else []


def add_verification(storage: Storage, project_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    rec = {
        "id": _new_id(),
        "target": data.get("target", ""),          # módulo/tarefa/critério
        "criteria": data.get("criteria", ""),
        "tool": data.get("tool", ""),
        "command": data.get("command", ""),
        "date": data.get("date") or _now(),
        "evidence": data.get("evidence", ""),
        "result": data.get("result", "planejado"),
        "created": _now(),
    }
    recs = get_verifications(storage, project_id)
    recs.append(rec)
    storage.write_structured(project_id, "qa.json", recs)
    from .bootstrap import _append_journal
    _append_journal(storage, project_id, f"Verificação registrada ({rec['result']}): {rec['target']}.")
    return rec


def update_verification(storage: Storage, project_id: str, rec_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    recs = get_verifications(storage, project_id)
    for r in recs:
        if r["id"] == rec_id:
            for k in ("target", "criteria", "tool", "command", "date", "evidence", "result"):
                if k in data:
                    r[k] = data[k]
            storage.write_structured(project_id, "qa.json", recs)
            return r
    raise ValueError("verificação não encontrada")
