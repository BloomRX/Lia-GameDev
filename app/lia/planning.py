"""Planejamento de módulos/tarefas e retomada do projeto (sem implementar nada)."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from .storage import Storage

TASK_STATES = ["pendente", "em andamento", "concluído", "bloqueado", "não verificado"]
MODULE_STATES = ["pendente", "em andamento", "concluído", "bloqueado", "não verificado"]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _new_id() -> str:
    return uuid.uuid4().hex[:8]


def get_modules(storage: Storage, project_id: str) -> List[Dict[str, Any]]:
    data = storage.read_structured(project_id, "modules.json")
    return data if isinstance(data, list) else []


def save_modules(storage: Storage, project_id: str, modules: List[Dict[str, Any]]) -> None:
    storage.write_structured(project_id, "modules.json", modules)
    storage.write_doc(project_id, "MODULE_INDEX.md", render_module_index(modules))
    # recalcula próximo passo
    _update_next_step(storage, project_id, modules)


def create_module(storage: Storage, project_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    modules = get_modules(storage, project_id)
    mod = {
        "id": _new_id(),
        "name": data.get("name", "Módulo sem nome").strip(),
        "description": data.get("description", "").strip(),
        "depends_on": data.get("depends_on", []),
        "acceptance": data.get("acceptance", []),
        "status": data.get("status", "pendente"),
        "tasks": [],
    }
    modules.append(mod)
    save_modules(storage, project_id, modules)
    _journal(storage, project_id, f"Módulo criado: {mod['name']}.")
    return mod


def update_module(storage: Storage, project_id: str, module_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    modules = get_modules(storage, project_id)
    for m in modules:
        if m["id"] == module_id:
            for k in ("name", "description", "depends_on", "acceptance", "status"):
                if k in data:
                    m[k] = data[k]
            save_modules(storage, project_id, modules)
            _journal(storage, project_id, f"Módulo atualizado: {m['name']}.")
            return m
    raise StorageError("módulo não encontrado")


def create_task(storage: Storage, project_id: str, module_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    modules = get_modules(storage, project_id)
    for m in modules:
        if m["id"] == module_id:
            task = {
                "id": _new_id(),
                "name": data.get("name", "Tarefa sem nome").strip(),
                "objective": data.get("objective", "").strip(),
                "files": data.get("files", []),
                "permissions": data.get("permissions", []),
                "verify": data.get("verify", "").strip(),
                "status": data.get("status", "pendente"),
                "result": "",
                "created": _now(),
            }
            m["tasks"].append(task)
            save_modules(storage, project_id, modules)
            _journal(storage, project_id, f"Tarefa criada em '{m['name']}': {task['name']}.")
            return task
    raise StorageError("módulo não encontrado")


def update_task(storage: Storage, project_id: str, module_id: str, task_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    modules = get_modules(storage, project_id)
    for m in modules:
        if m["id"] == module_id:
            for t in m["tasks"]:
                if t["id"] == task_id:
                    for k in ("name", "objective", "files", "permissions", "verify", "status", "result"):
                        if k in data:
                            t[k] = data[k]
                    save_modules(storage, project_id, modules)
                    _journal(storage, project_id, f"Tarefa atualizada: {t['name']} (status={t['status']}).")
                    return t
    raise StorageError("tarefa não encontrada")


def render_module_index(modules: List[Dict[str, Any]]) -> str:
    lines = ["# Índice de módulos", "", "> Gerado a partir do planejamento. Estados: pendente · em andamento · concluído · bloqueado · não verificado", ""]
    if not modules:
        lines.append("_nenhum módulo ainda — crie o primeiro plano._")
        return "\n".join(lines)
    for m in modules:
        lines.append(f"## {m['name']} — `{m['status']}`")
        if m.get("description"):
            lines.append(f"{m['description']}")
        if m.get("depends_on"):
            lines.append(f"- Depende de: {', '.join(m['depends_on'])}")
        if m.get("acceptance"):
            lines.append("- Critérios de aceite:")
            for a in m["acceptance"]:
                lines.append(f"  - {a}")
        if m.get("tasks"):
            lines.append("- Tarefas:")
            for t in m["tasks"]:
                lines.append(f"  - `{t['status']}` {t['name']}")
        lines.append("")
    return "\n".join(lines)


def build_resume(storage: Storage, project_id: str) -> Dict[str, Any]:
    """Reconstrói o contexto ativo a partir dos arquivos persistidos (não do chat)."""
    entry = storage.get_entry(project_id) or {}
    modules = get_modules(storage, project_id)
    decisions = storage.read_structured(project_id, "decisions.json")
    journal = storage.read_doc(project_id, "JOURNAL.md")

    open_tasks = [t for m in modules for t in m.get("tasks", []) if t["status"] in ("pendente", "em andamento", "bloqueado")]
    blocked = [t for m in modules for t in m.get("tasks", []) if t["status"] == "bloqueado"]
    pending_decisions = [d for d in decisions if d.get("label") in ("em aberto", "suposição")]

    summary = (
        f"Projeto **{entry.get('name','?')}** (fase: {entry.get('phase','?')}).\n"
        f"- Módulos: {len(modules)}; tarefas abertas: {len(open_tasks)}; bloqueadas: {len(blocked)}.\n"
        f"- Decisões em aberto/suposição: {len(pending_decisions)}.\n"
        f"- Próximo passo registrado: {entry.get('next_step','?')}."
    )
    return {
        "summary": summary,
        "phase": entry.get("phase"),
        "next_step": entry.get("next_step"),
        "open_tasks": open_tasks,
        "blocked": blocked,
        "pending_decisions": pending_decisions,
        "journal_tail": "\n".join(journal.splitlines()[-12:]),
    }


def _update_next_step(storage: Storage, project_id: str, modules: List[Dict[str, Any]]) -> None:
    open_tasks = [t for m in modules for t in m.get("tasks", []) if t["status"] in ("pendente", "em andamento")]
    if open_tasks:
        storage.update_entry(project_id, phase="execute",
                             next_step=f"Executar tarefa: {open_tasks[0]['name']}.")
    elif modules:
        storage.update_entry(project_id, phase="qa", next_step="Revisar/verificar os módulos concluídos.")
    else:
        storage.update_entry(project_id, next_step="Criar o primeiro módulo/tarefa.")


def _journal(storage: Storage, project_id: str, text: str) -> None:
    from .bootstrap import _append_journal
    _append_journal(storage, project_id, text)


class StorageError(Exception):
    pass
