"""Armazenamento local-first da Lia GameDev.

Tudo é salvo em arquivos legíveis no computador do Dev. Nenhum dado sai da máquina
por padrão. O local dos projetos é configurável (env LIA_PROJECTS_DIR) e exportável.
"""
from __future__ import annotations

import json
import os
import shutil
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

INDEX_FILE = "lia_index.json"
INDEX_VERSION = 1

# Documentos em Markdown (editáveis pelo Dev) e dados estruturados (JSON).
MARKDOWN_DOCS = [
    "PROJECT_BRIEF.md",
    "GDD.md",
    "SCOPE.md",
    "REFERENCIAS.md",
    "RELEASE.md",
    "JOURNAL.md",
    # Estes são renderizados a partir de dados estruturados, mas também editáveis:
    "DECISIONS.md",
    "MODULE_INDEX.md",
    "ASSET_REGISTER.md",
]

STRUCTURED_FILES = [
    "meta.json",
    "decisions.json",
    "modules.json",
    "qa.json",
    "assets.json",
    "release.json",
]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _slug(name: str) -> str:
    base = "".join(c if c.isalnum() or c in "-_" else "-" for c in name.strip().lower())
    base = base.strip("-") or "projeto"
    return base[:40]


def default_projects_dir() -> Path:
    env = os.environ.get("LIA_PROJECTS_DIR")
    if env:
        return Path(env).expanduser()
    return Path(os.path.expanduser("~/LiaGameDevProjects"))


class StorageError(Exception):
    pass


class Storage:
    def __init__(self, projects_dir: Optional[Path] = None):
        self.projects_dir = (projects_dir or default_projects_dir()).resolve()
        self.projects_dir.mkdir(parents=True, exist_ok=True)
        self._index_path = self.projects_dir / INDEX_FILE

    # ---- índice de projetos ----
    def _read_index(self) -> Dict[str, Any]:
        if not self._index_path.exists():
            return {"version": INDEX_VERSION, "projects": []}
        try:
            with self._index_path.open("r", encoding="utf-8") as f:
                data = json.load(f)
            if not isinstance(data.get("projects"), list):
                data["projects"] = []
            return data
        except (json.JSONDecodeError, OSError):
            # índice corrompido: preserva tudo, recria índice vazio
            return {"version": INDEX_VERSION, "projects": []}

    def _write_index(self, data: Dict[str, Any]) -> None:
        self._atomic_write(self._index_path, json.dumps(data, ensure_ascii=False, indent=2))

    def list_projects(self) -> List[Dict[str, Any]]:
        idx = self._read_index()
        # preserva ordem por atualização desc
        items = [p for p in idx["projects"]]
        items.sort(key=lambda p: p.get("updated", ""), reverse=True)
        return items

    def get_entry(self, project_id: str) -> Optional[Dict[str, Any]]:
        for p in self._read_index()["projects"]:
            if p["id"] == project_id:
                return p
        return None

    def project_path(self, project_id: str) -> Path:
        entry = self.get_entry(project_id)
        if not entry:
            raise StorageError(f"projeto não encontrado: {project_id}")
        return self.projects_dir / entry["folder"]

    # ---- criação / atualização / exclusão ----
    def create_project(self, name: str, location: Optional[str] = None) -> Dict[str, Any]:
        if not name or not name.strip():
            raise StorageError("nome do projeto é obrigatório")
        base_dir = Path(location).expanduser() if location else self.projects_dir
        base_dir.mkdir(parents=True, exist_ok=True)
        pid = uuid.uuid4().hex[:12]
        folder = f"{_slug(name)}-{pid[:6]}"
        proj_dir = base_dir / folder
        # evita colisão
        while proj_dir.exists():
            folder = f"{_slug(name)}-{uuid.uuid4().hex[:6]}"
            proj_dir = base_dir / folder
        proj_dir.mkdir(parents=True, exist_ok=True)

        meta = {
            "id": pid,
            "name": name.strip(),
            "folder": str(proj_dir.relative_to(self.projects_dir)) if base_dir == self.projects_dir else str(proj_dir),
            "status": "ativo",
            "archived": False,
            "created": _now(),
            "updated": _now(),
            "phase": "bootstrap",  # bootstrap | plan | execute | qa | release
            "next_step": "Completar a Etapa 0 (preparação do jogo).",
        }
        Storage._atomic_write(
            proj_dir / "meta.json",
            json.dumps(meta, ensure_ascii=False, indent=2),
        )

        entry = {
            "id": pid,
            "name": meta["name"],
            "folder": meta["folder"],
            "status": meta["status"],
            "archived": meta["archived"],
            "created": meta["created"],
            "updated": meta["updated"],
            "phase": meta["phase"],
            "next_step": meta["next_step"],
            "location": str(proj_dir),
        }
        idx = self._read_index()
        idx["projects"].append(entry)
        self._write_index(idx)
        return entry

    def update_entry(self, project_id: str, **fields) -> Dict[str, Any]:
        idx = self._read_index()
        for p in idx["projects"]:
            if p["id"] == project_id:
                for k, v in fields.items():
                    if k in ("name", "status", "archived", "phase", "next_step"):
                        p[k] = v
                p["updated"] = _now()
                self._write_index(idx)
                return p
        raise StorageError(f"projeto não encontrado: {project_id}")

    def archive_project(self, project_id: str) -> Dict[str, Any]:
        return self.update_entry(project_id, archived=True, status="arquivado")

    def reopen_project(self, project_id: str) -> Dict[str, Any]:
        return self.update_entry(project_id, archived=False, status="ativo")

    def delete_project(self, project_id: str, confirm: bool = False) -> bool:
        entry = self.get_entry(project_id)
        if not entry:
            raise StorageError(f"projeto não encontrado: {project_id}")
        if not confirm:
            raise StorageError("exclusão requer confirmação explícita (confirm=true)")
        proj_dir = self.projects_dir / entry["folder"]
        # se o projeto está em local externo, a pasta é absoluta
        if not proj_dir.exists() and Path(entry["folder"]).is_absolute():
            proj_dir = Path(entry["folder"])
        if proj_dir.exists():
            shutil.rmtree(proj_dir)
        idx = self._read_index()
        idx["projects"] = [p for p in idx["projects"] if p["id"] != project_id]
        self._write_index(idx)
        return True

    # ---- documentos ----
    def read_doc(self, project_id: str, doc: str) -> str:
        self._check_doc(doc)
        path = self.project_path(project_id) / doc
        if not path.exists():
            return ""
        return path.read_text(encoding="utf-8")

    def write_doc(self, project_id: str, doc: str, content: str) -> None:
        self._check_doc(doc)
        proj_dir = self.project_path(project_id)
        proj_dir.mkdir(parents=True, exist_ok=True)
        self._atomic_write(proj_dir / doc, content)
        self._touch(project_id)

    def list_docs(self, project_id: str) -> List[str]:
        proj_dir = self.project_path(project_id)
        if not proj_dir.exists():
            return []
        return sorted(p.name for p in proj_dir.glob("*.md"))

    # ---- dados estruturados ----
    _LIST_FILES = {"decisions.json", "modules.json", "qa.json", "assets.json"}

    def read_structured(self, project_id: str, name: str) -> Any:
        if name not in STRUCTURED_FILES:
            raise StorageError(f"arquivo estruturado inválido: {name}")
        path = self.project_path(project_id) / name
        if not path.exists():
            return [] if name in self._LIST_FILES else {}
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return [] if name in self._LIST_FILES else {}

    def write_structured(self, project_id: str, name: str, data: Any) -> None:
        if name not in STRUCTURED_FILES:
            raise StorageError(f"arquivo estruturado inválido: {name}")
        proj_dir = self.project_path(project_id)
        proj_dir.mkdir(parents=True, exist_ok=True)
        self._atomic_write(proj_dir / name, json.dumps(data, ensure_ascii=False, indent=2))
        self._touch(project_id)

    # ---- configuração global do app (nível da raiz de projetos) ----
    def read_structured_global(self, name: str) -> Any:
        if not name.endswith(".json"):
            raise StorageError(f"arquivo global inválido: {name}")
        path = self.projects_dir / name
        if not path.exists():
            return {}
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {}

    def write_structured_global(self, name: str, data: Any) -> None:
        if not name.endswith(".json"):
            raise StorageError(f"arquivo global inválido: {name}")
        self._atomic_write(self.projects_dir / name, json.dumps(data, ensure_ascii=False, indent=2))

    def export_project(self, project_id: str, dest_dir: str) -> str:
        entry = self.get_entry(project_id)
        if not entry:
            raise StorageError(f"projeto não encontrado: {project_id}")
        src = self.project_path(project_id)
        dest = Path(dest_dir).expanduser() / entry["folder"]
        dest.mkdir(parents=True, exist_ok=True)
        if src.exists():
            shutil.copytree(src, dest, dirs_exist_ok=True)
        # empacota também o índice de metadados do projeto
        (dest / "_export_meta.json").write_text(
            json.dumps({"exported_at": _now(), "source": str(src)}, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        return str(dest)

    # ---- helpers ----
    def _touch(self, project_id: str) -> None:
        try:
            self.update_entry(project_id)
        except StorageError:
            pass

    @staticmethod
    def _check_doc(doc: str) -> None:
        # Permite qualquer arquivo .md dentro do projeto, mas bloqueia
        # path traversal e extensões perigosas.
        if not doc.endswith(".md") or "/" in doc or "\\" in doc:
            raise StorageError(f"documento inválido: {doc}")

    @staticmethod
    def _atomic_write(path: Path, content: str) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        fd, tmp = tempfile.mkstemp(dir=str(path.parent), suffix=".tmp")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                f.write(content)
            os.replace(tmp, path)
        finally:
            if os.path.exists(tmp):
                os.unlink(tmp)
