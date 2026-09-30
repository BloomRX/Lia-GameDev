"""Abstração de provedores de IA — local e nuvem configuráveis.

IMPORTANTE: nada é conectado por padrão. Toda integração real está ausente nesta
entrega; os adaptadores são entregues claramente marcados como "não conectado" e o
modo demonstrativo NÃO alega inferência real. Nenhuma chave/token é armazenada em
texto puro e nenhuma chamada paga é feita. Informações voláteis (preço/quota) trazem
fonte e data e não prometem gratuidade permanente.
"""
from __future__ import annotations

from datetime import date
from typing import Any, Dict, List

from .storage import Storage

SETTINGS_FILE = "lia_settings.json"
_INFO_DATE = date.today().isoformat()


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
            "note": f"Info volátil (verificada em {_INFO_DATE}); não prometemos gratuidade permanente.",
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
            "note": f"Info volátil (verificada em {_INFO_DATE}).",
        },
    ]


def get_settings(storage: Storage) -> Dict[str, Any]:
    data = storage.read_structured_global(SETTINGS_FILE)
    if not isinstance(data, dict):
        data = {}
    data.setdefault("active_provider", None)
    data.setdefault("mode", "offline")  # offline | local | cloud | combined
    data.setdefault("keys_present", False)  # nunca verdadeiro por padrão; só após consentimento explícito
    return data


def set_settings(storage: Storage, settings: Dict[str, Any]) -> Dict[str, Any]:
    allowed = {"active_provider", "mode"}
    clean = {k: v for k, v in settings.items() if k in allowed}
    current = get_settings(storage)
    current.update(clean)
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
