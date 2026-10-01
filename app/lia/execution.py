"""Execução assistida — SIMULADA nesta entrega.

Não há agente de código nem engine conectados. A execução produz uma proposta e um
resultado SIMULADO, claramente rotulado, e não escreve código de jogo nem altera
arquivos do projeto além do journal. A aprovação do Dev é separada da execução.
"""
from __future__ import annotations

from typing import Any, Dict

from . import planning
from .storage import Storage, StorageError


def simulate_execution(
    storage: Storage,
    project_id: str,
    module_id: str,
    task_id: str,
    approved: bool = False,
) -> Dict[str, Any]:
    if type(approved) is not bool:
        raise StorageError("aprovação deve ser um booleano")
    task = _find_task(storage, project_id, module_id, task_id)
    blockers = planning.module_blockers(planning.get_modules(storage, project_id), module_id)
    if approved and blockers:
        raise StorageError("módulo bloqueado: " + "; ".join(b["message"] for b in blockers))
    proposal = (
        f"Proposta para '{task['name']}':\n"
        f"- Objetivo: {task.get('objective') or '(sem objetivo descrito)'}\n"
        f"- Arquivos/sistemas envolvidos: {', '.join(task.get('files') or []) or 'nenhum'}\n"
        f"- Permissões necessárias: {', '.join(task.get('permissions') or []) or 'nenhuma'}\n"
        f"- Como verificar: {task.get('verify') or '(sem critério de verificação)'}"
    )
    simulated_result = (
        "[RESULTADO SIMULADO — nenhuma inferência real foi executada]\n"
        f"Tarefa '{task['name']}' seria executada com as permissões acima. "
        "Nesta entrega não há agente/engine conectado, então isto é uma demonstração "
        "do fluxo de aprovação e registro, não código produzido."
    )

    if approved:
        planning.record_simulated_execution(storage, project_id, module_id, task_id, simulated_result)
    return {
        "task_id": task_id,
        "approved": approved,
        "simulated": approved,
        "blockers": blockers,
        "proposal": proposal,
        "simulated_result": simulated_result if approved else None,
        "warning": ("Execução simulada. Nenhum código foi escrito nem serviço chamado." if approved
                    else "Apenas proposta; nenhum resultado foi registrado."),
    }


def _find_task(storage: Storage, project_id: str, module_id: str, task_id: str) -> Dict[str, Any]:
    modules = planning.get_modules(storage, project_id)
    for m in modules:
        if m["id"] == module_id:
            for t in m["tasks"]:
                if t["id"] == task_id:
                    return t
    raise planning.StorageError("tarefa não encontrada")
