"""Servidor HTTP da Lia Studio (stdlib puro, sem dependências de terceiros).

Serve a interface (SPA em app/static) e a API JSON em /api. Tudo roda localmente;
nenhuma chamada externa é feita. Pode ser envolvido por Tauri/Electron para o
destino Windows, ou simplesmente executado com `python run.py`.
"""
from __future__ import annotations

import json
import os
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
from urllib.parse import parse_qs, urlparse

from .lia import bootstrap, conflicts, engines, execution, planning, providers, qa, release, templates_loader
from .lia.storage import Storage, StorageError

STATIC_DIR = Path(__file__).resolve().parent / "static"
ROOT_DIR = Path(__file__).resolve().parent.parent

storage = Storage()

# ---------- helpers ----------


def _read_body(handler) -> Dict[str, Any]:
    length = int(handler.headers.get("Content-Length", 0) or 0)
    if length == 0:
        return {}
    raw = handler.rfile.read(length)
    try:
        return json.loads(raw.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return {}


def _send_json(handler, payload: Any, status: int = 200) -> None:
    body = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.end_headers()
    handler.wfile.write(body)


def _send_file(handler, path: Path, content_type: str) -> None:
    data = path.read_bytes()
    handler.send_response(200)
    handler.send_header("Content-Type", content_type)
    handler.send_header("Content-Length", str(len(data)))
    handler.end_headers()
    handler.wfile.write(data)


def _err(handler, status: int, message: str) -> None:
    _send_json(handler, {"error": message}, status)


# ---------- rotas de projeto ----------


def api_projects(handler, pid: Optional[str], sub: list, method: str, body, query) -> Any:
    if method == "GET" and pid is None:
        return {"projects": storage.list_projects()}

    if method == "POST" and pid is None:
        name = (body.get("name") or "").strip()
        if not name:
            raise StorageError("nome obrigatório")
        entry = storage.create_project(name, body.get("location"))
        return entry, 201

    if pid is None:
        raise StorageError("requisição inválida")

    if method == "GET" and not sub:
        entry = storage.get_entry(pid)
        if not entry:
            raise StorageError("projeto não encontrado")
        decisions = storage.read_structured(pid, "decisions.json")
        modules = planning.get_modules(storage, pid)
        conflicts_list = conflicts.detect_conflicts(decisions)
        return {
            "entry": entry,
            "docs": storage.list_docs(pid),
            "decisions": decisions,
            "conflicts": conflicts_list,
            "modules": modules,
            "qa": qa.get_verifications(storage, pid),
            "release": release.get_release(storage, pid),
            "resume": planning.build_resume(storage, pid),
            "engine": engines.get_profile(storage, pid),
            "providers": providers.describe_runtime(storage),
        }

    if method == "PUT" and not sub:
        entry = storage.update_entry(pid, **{k: body[k] for k in ("name", "status", "phase", "next_step") if k in body})
        return entry

    if method == "DELETE" and not sub:
        confirm = query.get("confirm", ["false"])[0].lower() == "true"
        storage.delete_project(pid, confirm=confirm)
        return {"deleted": True}

    if method == "POST" and sub == ["archive"]:
        return storage.archive_project(pid)
    if method == "POST" and sub == ["reopen"]:
        return storage.reopen_project(pid)

    if method == "GET" and sub[0] == "docs" and len(sub) == 2:
        return {"doc": sub[1], "content": storage.read_doc(pid, sub[1])}
    if method == "PUT" and sub[0] == "docs" and len(sub) == 2:
        storage.write_doc(pid, sub[1], body.get("content", ""))
        return {"saved": sub[1]}

    if method == "POST" and sub == ["bootstrap"]:
        result = bootstrap.run_bootstrap(storage, pid, body.get("answers", {}))
        return result, 201

    if method == "GET" and sub == ["modules"]:
        return {"modules": planning.get_modules(storage, pid)}
    if method == "POST" and sub == ["modules"]:
        return planning.create_module(storage, pid, body), 201
    if method == "PUT" and sub[0] == "modules" and len(sub) == 2:
        return planning.update_module(storage, pid, sub[1], body)

    if method == "POST" and sub[0] == "modules" and len(sub) == 3 and sub[2] == "tasks":
        return planning.create_task(storage, pid, sub[1], body), 201
    if method == "PUT" and sub[0] == "modules" and len(sub) == 4 and sub[2] == "tasks":
        return planning.update_task(storage, pid, sub[1], sub[3], body)

    if method == "POST" and len(sub) == 4 and sub[0] == "tasks" and sub[3] == "execute":
        return execution.simulate_execution(storage, pid, sub[1], sub[2], approved=bool(body.get("approved", False)))

    if method == "GET" and sub == ["conflicts"]:
        return {"conflicts": conflicts.detect_conflicts(storage.read_structured(pid, "decisions.json"))}

    if method == "POST" and sub == ["decisions"]:
        decisions = storage.read_structured(pid, "decisions.json")
        decisions.append({
            "topic": body.get("topic", "Decisão"),
            "label": body.get("label", "em aberto"),
            "value": body.get("value", ""),
            "note": body.get("note", ""),
        })
        storage.write_structured(pid, "decisions.json", decisions)
        storage.write_doc(pid, "DECISIONS.md", bootstrap.render_decisions_md(decisions))
        return {"decisions": decisions}, 201

    if method == "GET" and sub == ["qa"]:
        return {"qa": qa.get_verifications(storage, pid)}
    if method == "POST" and sub == ["qa"]:
        return qa.add_verification(storage, pid, body), 201
    if method == "PUT" and sub[0] == "qa" and len(sub) == 2:
        return qa.update_verification(storage, pid, sub[1], body)

    if method == "GET" and sub == ["release"]:
        return {"release": release.get_release(storage, pid)}
    if method == "PUT" and sub == ["release"]:
        return release.save_release(storage, pid, body)

    if method == "GET" and sub == ["resume"]:
        return planning.build_resume(storage, pid)

    if method == "GET" and sub == ["engines"]:
        return {"catalog": engines.get_catalog(), "profile": engines.get_profile(storage, pid)}
    if method == "POST" and sub == ["engines"]:
        return engines.set_profile(storage, pid, body.get("engine_id", "generic"))

    raise StorageError("rota não encontrada")


# ---------- rota de exemplo ----------


def create_example_project() -> Dict[str, Any]:
    entry = storage.create_project("Exemplo — Lia Demo (demonstrativo)")
    storage.update_entry(entry["id"], phase="plan",
                        next_step="Explore os fluxos: docs, plano, tarefas, QA e release.")
    answers = {
        "idea": "Um jogo calmo onde você cultiva ilhas flutuantes à noite e resolve pequenos mistérios.",
        "experience": "Sentimento de paz, curiosidade e descoberta tranquila.",
        "audience": "Jogadores casuais, 12+",
        "platform": "PC (Windows)",
        "pillars": ["Exploração calma", "Mistérios leves", "Progressão sem pressa"],
        "restrictions": "Orçamento pequeno; time de 1 pessoa.",
        "references": [{"name": "Stardew Valley", "origin": "ConcernedApe", "use": "referência de loop calmo"}],
        "vertical_slice": "Demo: uma ilha, colher, um mistério resolvel. [proposto]",
    }
    bootstrap.run_bootstrap(storage, entry["id"], answers)
    planning.create_module(storage, entry["id"], {
        "name": "Slice de validação",
        "description": "Primeira fatia demonstrável.",
        "depends_on": [],
        "acceptance": ["Ilha carrega", "Colheita funciona", "Mistério resolvel"],
        "status": "em andamento",
    })
    return storage.get_entry(entry["id"])


# ---------- handler ----------


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):  # silencia logs verbosos
        pass

    def _dispatch_api(self) -> Optional[Tuple[Any, int]]:
        parsed = urlparse(self.path)
        parts = [p for p in parsed.path.split("/") if p]
        query = parse_qs(parsed.query)
        method = self.command

        body = self._body
        try:
            if parts == ["api", "health"]:
                return {"ok": True, "app": "Lia Studio", "offline": True}, 200
            if parts == ["api", "skill"]:
                return {
                    "skill_exists": templates_loader.skill_exists(),
                    "steps": templates_loader.bootstrap_steps(),
                    "templates": templates_loader.list_templates(),
                }, 200
            if parts == ["api", "projects"]:
                return api_projects(self, None, [], method, self._body, query)
            if len(parts) >= 3 and parts[0] == "api" and parts[1] == "projects":
                pid = parts[2]
                sub = parts[3:]
                return api_projects(self, pid, sub, method, self._body, query)
            if parts == ["api", "providers"]:
                return {"catalog": providers.provider_catalog()}, 200
            if parts == ["api", "providers", "settings"] and method == "GET":
                return providers.get_settings(storage), 200
            if parts == ["api", "providers", "settings"] and method == "PUT":
                return providers.set_settings(storage, self._body), 200
            if parts == ["api", "example"] and method == "POST":
                return create_example_project(), 201
            return None
        except StorageError as e:
            return {"error": str(e)}, 400
        except (ValueError, KeyError) as e:
            return {"error": str(e)}, 400
        except Exception as e:  # noqa: BLE001
            return {"error": f"erro interno: {e}"}, 500

    def _route(self):
        self._body = _read_body(self)
        parsed = urlparse(self.path)
        parts = [p for p in parsed.path.split("/") if p]

        if parts and parts[0] == "api":
            result = self._dispatch_api()
            if result is None:
                _err(self, 404, "rota não encontrada")
                return
            payload, status = result if isinstance(result, tuple) else (result, 200)
            _send_json(self, payload, status)
            return

        # arquivos estáticos
        if not parts or parts[0] in ("", "index.html"):
            _send_file(self, STATIC_DIR / "index.html", "text/html; charset=utf-8")
            return
        if parts[0] == "static":
            rel = "/".join(parts[1:])
            candidate = (STATIC_DIR / rel).resolve()
            if candidate.exists() and str(candidate).startswith(str(STATIC_DIR)):
                ctype = "text/css; charset=utf-8" if candidate.suffix == ".css" else "application/javascript; charset=utf-8"
                if candidate.suffix == ".html":
                    ctype = "text/html; charset=utf-8"
                _send_file(self, candidate, ctype)
                return
        # SPA fallback
        _send_file(self, STATIC_DIR / "index.html", "text/html; charset=utf-8")

    def do_GET(self):
        self._route()

    def do_POST(self):
        self._route()

    def do_PUT(self):
        self._route()

    def do_DELETE(self):
        self._route()


def run(host: str = "0.0.0.0", port: int = 8080) -> None:
    server = ThreadingHTTPServer((host, port), Handler)
    print(f"Lia Studio em http://{host}:{port}  (Ctrl+C para parar)")
    print(f"Projetos locais em: {storage.projects_dir}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()


if __name__ == "__main__":
    run(port=int(os.environ.get("PORT", "8080")))
