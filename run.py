#!/usr/bin/env python3
"""Launcher da Lia GameDev.

Inicia o servidor local (stdlib puro). Para abrir a interface, acesse o endereço
impresso no terminal. Para empacotar no destino Windows, envolva este script com
Tauri/Electron ou gere um executável (PyInstaller/Nuitka) — a camada visual é a
mesma servida aqui.

Uso:
    python run.py            # porta 8080 (ou env PORT)
    PORT=8080 python run.py
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app import server  # noqa: E402


def main() -> None:
    port = int(os.environ.get("PORT", "8080"))
    server.run(host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
