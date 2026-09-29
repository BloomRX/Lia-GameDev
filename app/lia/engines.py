"""Perfis de engine — arquitetura agnóstica, adaptadores claramente marcados.

O núcleo da Lia não depende de engine. Estes perfis permitem configurar Godot,
Unity, MonoGame ou um caminho genérico. NENHUMA integração real com engine foi
executada/verificada nesta entrega; os adaptadores concretos ficam como marcados
'not_verified'.
"""
from __future__ import annotations

from typing import Any, Dict, List

from .storage import Storage

ENGINE_CATALOG = [
    {
        "id": "generic",
        "name": "Genérico / agnóstico",
        "status": "supported",
        "verified": True,
        "note": "Caminho padrão. Não exige engine específica.",
    },
    {
        "id": "godot",
        "name": "Godot",
        "status": "not_verified",
        "verified": False,
        "note": "Perfil disponível; integração real depende de Godot instalado e não foi verificada aqui.",
    },
    {
        "id": "unity",
        "name": "Unity",
        "status": "not_verified",
        "verified": False,
        "note": "Perfil disponível; integração real não verificada nesta entrega.",
    },
    {
        "id": "monogame",
        "name": "MonoGame",
        "status": "not_verified",
        "verified": False,
        "note": "Perfil disponível; integração real não verificada nesta entrega.",
    },
]


def get_catalog() -> List[Dict[str, Any]]:
    return ENGINE_CATALOG


def get_profile(storage: Storage, project_id: str) -> Dict[str, Any]:
    data = storage.read_structured(project_id, "release.json")
    if isinstance(data, dict) and "engine_profile" in data:
        return data["engine_profile"]
    return {"id": "generic", "name": "Genérico / agnóstico", "verified": True}


def set_profile(storage: Storage, project_id: str, engine_id: str) -> Dict[str, Any]:
    cat = {e["id"]: e for e in ENGINE_CATALOG}
    if engine_id not in cat:
        raise ValueError(f"engine inválida: {engine_id}")
    profile = {
        "id": engine_id,
        "name": cat[engine_id]["name"],
        "verified": cat[engine_id]["verified"],
        "note": cat[engine_id]["note"],
    }
    release = storage.read_structured(project_id, "release.json")
    if not isinstance(release, dict):
        release = {}
    release["engine_profile"] = profile
    storage.write_structured(project_id, "release.json", release)
    return profile
