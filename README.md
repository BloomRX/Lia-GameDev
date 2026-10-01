# Lia Studio

Ferramenta da Lia para ajudar uma pessoa — inclusive sem experiência de programação —
a preparar, construir, testar, documentar e retomar projetos de jogos com agentes
supervisionáveis, sem substituir a direção criativa do Dev.

> **Estado atual (honesto): alpha integrada, local-first, offline.**
> Desenvolvimento incremental conforme o plano técnico; **não está certificada
> como pronta para produção** nem passou por aceite de uso do Dev. O núcleo
> (preparação, planejamento, QA, release, armazenamento) é **real e local**.
> A execução assistida e os provedores de IA são **simulados** e claramente
> rotulados: não há agente de código nem engine conectados, e nenhuma chamada
> paga ou externa é feita.

## O que está implementado (testes automatizados, ainda sem aceite do Dev)
- Gerenciamento de projetos (criar, renomear, arquivar, reabrir, excluir com confirmação).
- JSON versionado, backup local da versão anterior, diagnóstico e recuperação
  com confirmação. Exportação manual de projeto com manifesto do índice.
- **Etapa 0** guiada que gera documentos do jogo (brief, GDD, escopo, decisões,
  referências) sem escrever gameplay. A skill `lia-game-project-bootstrap` é
  consultável, mas o gerador ainda não usa seus templates diretamente.
- Edição de documentos Markdown e rótulos `confirmado/proposto/suposição/em aberto`.
- Detecção de **conflitos** entre decisão confirmada e suposição/em-aberto; aba
  Decisões para registro e revisão humana, com proteção contra edição obsoleta e
  confirmação antes de substituir `DECISIONS.md` modificado manualmente.
- Planejamento em módulos/tarefas com critérios de aceite, IDs estáveis e dependências verificadas; módulos dependentes não podem ter tarefas simuladas antes de as dependências registrarem conclusão, execução real, validação e revisão aprovadas. A simulação não gera nem comprova esses estados.
- Estágios Preparação → MVP jogável → Produção → Entrega com gates e aprovação
  explícita. Sem execução real, o gate de saída do MVP permanece bloqueado.
- Prévia de proposta sem gravação, seguida de aprovação explícita vinculada ao
  digest atual do plano/permissões e execução **simulada** (validação e revisão do
  resultado são separadas; sem código/serviço real).
  Cada confirmação nova registra uma Session de simulação com ID em `sessions.json`;
  conclusão da Session não comprova execução real, validação ou evidência.
- QA/playtest com registro **manual** de verificações (planejado/executado/aprovado/falhou);
  critério, ferramenta e evidência são exigidos para resultados não planejados.
  Arquivos já existentes no projeto podem ser vinculados a módulo/tarefa e QA por ID;
  o SHA-256 verifica apenas integridade dos bytes, nunca aprovação do teste.
- Preparação documental de build/release (checklist, créditos, notas) — **sem
  build nem publicação**; API não permite declarar build gerada ou publicação.
- Preferências de provedores validadas (modo/provider do catálogo, sem credenciais),
  sempre offline; perfis de engine exibidos do catálogo, incluindo Unreal não verificado.
  Nenhum adapter ou provider real está conectado.
- Decisões que bloqueiam integrações futuras: `docs/DECISOES-PENDENTES-INTEGRACOES.md`.
- Interface navegável (SPA) servida localmente, com preview no navegador.
- Handoff explícito por tarefa: prévia, revisão e confirmação geram `HANDOFF.md`
  no projeto. A retomada sinaliza quando o snapshot mudou; não envia dados nem
  executa código, e não substitui a revisão humana antes de compartilhar.
- Biblioteca de quatro Skills locais consultáveis, separada dos projetos; aplicação por agente ainda não conectada.

## O que é apenas simulado / não implementado
- Inferência real de IA (Ollama/Gemini/OpenRouter): apenas catálogo e modo; nada conectado.
- Integração real com engines (Unreal/Godot/Unity/MonoGame): perfis selecionáveis,
  mas adapters não implementados/verificados.
- Empacotamento Windows (executável): a arquitetura prepara o alvo, mas o `.exe` não
  foi gerado/testado neste ambiente (Linux). Veja `docs/arquitetura-decisoes.md`.

## Requisitos
- Python 3.9+ (apenas biblioteca padrão — **sem `pip install`**).
- Navegador para a interface. Windows é o destino final; aqui roda como servidor local.

## Como executar
```bash
python run.py              # sobe em http://127.0.0.1:8080 (ou env PORT)
```
`HOST=0.0.0.0` expõe o servidor na rede e só deve ser usado em preview ou rede
confiável; ainda não há autenticação para publicação na internet. Abra a URL no navegador. Para experimentar sem configurar conta, use o botão
**"Carregar exemplo demonstrativo"** na tela inicial. Projetos são salvos em
`~/LiaStudioProjects` (configurável via `LIA_PROJECTS_DIR`).

## Testes
```bash
python tests/test_core.py   # testes offline de núcleo/API
node tests/test_ui.cjs       # regressão da UI, requer Node.js (opcional)
```
Veja `docs/testes-resultados.md` para os resultados e o walkthrough de interface.
Backups `.bak` não substituem cópias em outro disco; veja `docs/armazenamento-privacidade.md`.

## Estrutura
- `app/lia/` — núcleo (armazenamento, estágios/gates, bootstrap, planejamento,
  skills, provedores, execução simulada, QA, release, engines e conflitos).
- `app/server.py` — API JSON + servidor HTTP (stdlib).
- `app/static/` — interface (HTML/CSS/JS vanilla, sem build).
- `.agents/skills/` — quatro skills canônicas; Etapa 0 reutilizada pelo app.
- `planejamento/` — documentos de visão e handoffs.
- `docs/` — documentação da entrega.

## Licença e marca
- Código e documentação próprios: **MIT** (ver `LICENSE`).
- Nome, personagem, logo e identidade visual da Lia: política de marca **separada**,
  não licenciada pela MIT para apropriação ou representação como produto oficial
  (ver `THIRD_PARTY_NOTICES.md`).
