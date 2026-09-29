# Arquitetura e decisões técnicas — Lia GameDev (alpha)

Data: 2026-09-29. Ambiente de build: Linux (sandbox). Destino final: Windows.

## Decisão 1 — Sem dependências de terceiros (stdlib only)
- **Escolha:** backend em Python puro (http.server) e frontend em JS vanilla, sem
  build. Roda com `python run.py`.
- **Por quê:** minimiza instalação para o iniciante, evita `pip install` e mantém o
  app reproduzível e auditável.
- **Alternativas descartadas:** Tauri/Electron (empacotamento) e frameworks web com
  build (React/Vite) — úteis para o executável Windows, mas adiam a entrega e exigem
  toolchain. A camada visual é a mesma e poderá ser envolvida por Tauri/Electron depois.

## Decisão 2 — Servidor local + SPA, não app web
- A interface é servida por um servidor HTTP local. No destino Windows, este mesmo
  servidor pode ser embrulhado num executável (PyInstaller/Nuitka ou Tauri sidecar).
- **Limitação:** o `.exe` Windows **não** foi gerado/testado aqui (ambiente Linux).
  Arquitetura prepara o alvo, mas o pacote não está verificado.

## Decisão 3 — Persistência local-first, arquivos legíveis
- Cada projeto é uma pasta com Markdown + JSON. Índice em `lia_index.json`.
- **Vantagem:** dados do Dev ficam no PC; exportável; sem lock de banco.

## Decisão 4 — Núcleo agnóstico a engine / provedor
- `engines.py` e `providers.py` são adaptadores. Engine "generic" é suportada; as
  demais (Godot/Unity/MonoGame) são perfis **não verificados**. Provedores de IA são
  catálogo + modo, sempre `not_connected`/`simulated`.

## Decisão 5 — Execução e IA são simuladas nesta entrega
- Não há agente de código nem engine conectados. `execution.simulate_execution`
  produz proposta + resultado SIMULADO e rotula claramente. Nenhuma chamada paga.

## Decisão 6 — Branch de trabalho
- O handoff pedia uma nova branch de tarefa. O ambiente desta sessão fixa o trabalho
  em `arena/01a0ec59-lia-gamedev`; para não violar a restrição de não mexer em `main`
  e o tracking da sessão, trabalhei nesta branch, preservando a skill da Etapa 0 como base.
  Não houve alteração de `main`, merge ou force-push.

## Decisão 7 — Reutilização da skill (não duplicação)
- O fluxo de Etapa 0 lê `.agents/skills/lia-game-project-bootstrap/` (SKILL.md, templates,
  glossário) como fonte, em vez de reimplementar um wizard concorrente.
