# Lia Studio

Ferramenta da Lia para ajudar uma pessoa — inclusive sem experiência de programação —
a preparar, construir, testar, documentar e retomar projetos de jogos com agentes
supervisionáveis, sem substituir a direção criativa do Dev.

> **Estado atual (honesto): alpha integrada, local-first, offline.**
> Esta entrega tenta cobrir o máximo possível do produto completo em uma única
> sessão, mas **não está certificada como pronta para produção**. O núcleo
> (preparação, planejamento, QA, release, armazenamento) é **real e local**.
> A execução assistida e os provedores de IA são **simulados** e claramente
> rotulados: não há agente de código nem engine conectados, e nenhuma chamada
> paga ou externa é feita.

## O que está implementado e testado
- Gerenciamento de projetos (criar, renomear, arquivar, reabrir, excluir com confirmação).
- **Etapa 0** guiada que reutiliza a skill `lia-game-project-bootstrap` e gera os
  documentos do jogo (brief, GDD, escopo, decisões, referências) sem escrever gameplay.
- Edição de documentos Markdown e rótulos `confirmado/proposto/suposição/em aberto`.
- Detecção de **conflitos** entre decisão confirmada e suposição/em-aberto.
- Planejamento em módulos/tarefas com critérios de aceite e dependências.
- Execução assistida **simulada** (aprovação separada; sem código/serviço real).
- QA/playtest com registro de verificações (planejado/executado/aprovado/falhou).
- Preparação de build/release (checklist, créditos, notas) — **sem publicação**.
- Configuração de provedores (local/nuvem) e perfil de engine, sempre offline/simulado.
- Interface navegável (SPA) servida localmente, com preview no navegador.

## O que é apenas simulado / não implementado
- Inferência real de IA (Ollama/Gemini/OpenRouter): apenas catálogo e modo; nada conectado.
- Integração real com engines (Godot/Unity/MonoGame): perfis disponíveis, não verificados.
- Empacotamento Windows (executável): a arquitetura prepara o alvo, mas o `.exe` não
  foi gerado/testado neste ambiente (Linux). Veja `docs/arquitetura-decisoes.md`.

## Requisitos
- Python 3.9+ (apenas biblioteca padrão — **sem `pip install`**).
- Navegador para a interface. Windows é o destino final; aqui roda como servidor local.

## Como executar
```bash
python run.py              # sobe em http://localhost:8080 (ou env PORT)
```
Abra a URL no navegador. Para experimentar sem configurar conta, use o botão
**"Carregar exemplo demonstrativo"** na tela inicial. Projetos são salvos em
`~/LiaGameDevProjects` (configurável via `LIA_PROJECTS_DIR`).

## Testes
```bash
python tests/test_core.py   # 15 testes de núcleo (offline, sem serviços)
```
Veja `docs/testes-resultados.md` para os resultados e o walkthrough de interface.

## Estrutura
- `app/lia/` — núcleo (storage local-first, bootstrap, planning, providers, execution, qa, release, engines, conflicts).
- `app/server.py` — API JSON + servidor HTTP (stdlib).
- `app/static/` — interface (HTML/CSS/JS vanilla, sem build).
- `.agents/skills/lia-game-project-bootstrap/` — skill da Etapa 0 (reutilizada).
- `planejamento/` — documentos de visão e handoffs.
- `docs/` — documentação da entrega.

## Licença e marca
- Código e documentação próprios: **MIT** (ver `LICENSE`).
- Nome, personagem, logo e identidade visual da Lia: política de marca **separada**,
  não licenciada pela MIT para apropriação ou representação como produto oficial
  (ver `THIRD_PARTY_NOTICES.md`).
