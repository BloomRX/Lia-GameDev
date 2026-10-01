"""Abstração de provedores de IA — local e nuvem configuráveis.

IMPORTANTE: nada é conectado por padrão. Toda integração real está ausente nesta
entrega; os adaptadores são entregues claramente marcados como "não conectado" e o
modo demonstrativo NÃO alega inferência real. Nenhuma chave/token é armazenada em
texto puro e nenhuma chamada paga é feita. Informações voláteis (preço/quota) trazem
fontes indicativas e não alegam verificação atual ou gratuidade permanente.
"""
from __future__ import annotations

from typing import Any, Dict, List

from .storage import Storage, StorageError

SETTINGS_FILE = "lia_settings.json"
MODES = {"offline", "local", "cloud", "combined"}
# Catálogo indicativo offline; não usar a data de execução como se fosse uma verificação das fontes.


def provider_catalog() -> List[Dict[str, Any]]:
    return [
        {
            "id": "local-ollama",
            "kind": "local",
            "name": "Ollama (rota local)",
            "status": "not_connected",
            "simulated": True,
            "requires": "Ollama instalado no PC (Windows 10+); modelo baixado pelo Dev.",
            "cost": "Grátis (roda no seu hardware). Download de modelo é opcional e exige confirmação.",
            "data_egress": "Nenhum dado sai do PC.",
            "source": "ollama.com/download/windows",
            "note": "Guia/configuração apenas. Nenhuma instalação ou download automático é feito aqui.",
        },
        {
            "id": "cloud-gemini",
            "kind": "cloud",
            "name": "Gemini API (rota em nuvem)",
            "status": "not_connected",
            "simulated": True,
            "requires": "Conta Google; chave do próprio Dev obtida com guia em Configurações.",
            "cost": "Faixa gratuita existe para alguns modelos, mas muda — valide preço/quota no momento de conectar.",
            "data_egress": "Conteúdo da tarefa pode ser enviado ao provedor; informe isso antes de usar.",
            "source": "ai.google.dev/gemini-api/docs/pricing",
            "note": "Informação indicativa, não verificada em tempo real; consulte preço e quota na fonte antes de conectar.",
        },
        {
            "id": "cloud-openrouter",
            "kind": "cloud",
            "name": "OpenRouter (rota em nuvem)",
            "status": "not_connected",
            "simulated": True,
            "requires": "Conta OpenRouter; chave do próprio Dev.",
            "cost": "Modelos gratuitos listados sujeitos a limites; valide no momento de conectar.",
            "data_egress": "Conteúdo da tarefa pode ser enviado ao provedor.",
            "source": "openrouter.ai/docs/faq",
            "note": "Informação indicativa, não verificada em tempo real; consulte preço e quota na fonte antes de conectar.",
        },
    ]


def validate_settings(data: Any) -> None:
    """Preferências de catálogo, nunca credenciais ou prova de conexão."""
    ids = {p["id"] for p in provider_catalog()}
    if (not isinstance(data, dict) or set(data) - {"mode", "active_provider", "keys_present"}
        or not isinstance(data.get("mode", "offline"), str)
        or data.get("mode", "offline") not in MODES
        or data.get("active_provider") not in (None, *ids)
        or data.get("keys_present", False) is not False):
        raise StorageError("configuração de provedor inválida; nenhuma conexão foi ativada")


def get_settings(storage: Storage) -> Dict[str, Any]:
    data = storage.read_structured_global(SETTINGS_FILE)
    validate_settings(data)
    return {"active_provider": data.get("active_provider"),
            "mode": data.get("mode", "offline"), "keys_present": False}


def set_settings(storage: Storage, settings: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(settings, dict) or not settings or set(settings) - {"active_provider", "mode"}:
        raise StorageError("altere somente modo ou provider do catálogo")
    with storage.stage_lock:
        current = get_settings(storage)
        current.update(settings)
        validate_settings(current)
        storage.write_structured_global(SETTINGS_FILE, current)
        return current


def describe_runtime(storage: Storage) -> Dict[str, Any]:
    """Descreve o estado de execução de IA: sempre offline/simulado nesta entrega."""
    s = get_settings(storage)
    return {
        "mode": s["mode"],
        "active_provider": s["active_provider"],
        "connected": False,
        "simulated": True,
        "message": (
            "Nenhuma inferência real está ativa. A Lia Studio roda offline; provedores "
            "são configuráveis mas permanecem 'não conectado'. Execuções de tarefa nesta "
            "entrega são SIMULADAS e claramente rotuladas."
        ),
        "catalog": provider_catalog(),
    }
