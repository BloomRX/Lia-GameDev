# Arquitetura e decisões técnicas — Lia Studio (alpha)

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
- O servidor escuta em `127.0.0.1` por padrão. `HOST=0.0.0.0` é opção explícita
  para preview/rede confiável; CORS irrestrito foi removido, mutações cross-site
  e Host externo no modo local são recusados. Não é autenticação para expor o app publicamente.
- A interface é servida por um servidor HTTP local. No destino Windows, este mesmo
  servidor pode ser embrulhado num executável (PyInstaller/Nuitka ou Tauri sidecar).
- **Limitação:** o `.exe` Windows **não** foi gerado/testado aqui (ambiente Linux).
  Arquitetura prepara o alvo, mas o pacote não está verificado.

## Decisão 3 — Persistência local-first, arquivos legíveis
- Cada projeto é uma pasta com Markdown + JSON. A única fonte de verdade dos
  metadados é o índice `lia_index.json`; `meta.json` não é mais gerado.
- Arquivos globais são limitados a `lia_settings.json`; o perfil de engine é
  persistido em `engine_profile.json` e não em `release.json`.
- **Vantagem:** dados do Dev ficam no PC; exportável; sem lock de banco.

## Nome e armazenamento
- Nome do produto: **Lia Studio**; pasta padrão: `~/LiaStudioProjects`.
- `LIA_PROJECTS_DIR` permite escolher outra pasta. Sem dados anteriores a migrar.

## Decisão 4 — Núcleo agnóstico a engine / provedor
- `engines.py` e `providers.py` são catálogos/perfis da Alpha, **não** adapters
  reais. Engine `generic` é perfil agnóstico; Unreal/Godot/Unity/MonoGame são
  perfis **não verificados**. Provedores de IA são catálogo + modo, sempre
  `not_connected`/`simulated`. Adapters reais permanecem separados do core.

## Decisão 5 — Execução e IA são simuladas nesta entrega
- Não há agente de código nem engine conectados. `execution.simulate_execution`
  produz proposta + resultado SIMULADO e rotula claramente. Nenhuma chamada paga.

## Decisão 6 — Branch de trabalho
- O handoff pedia uma nova branch de tarefa. O ambiente desta sessão fixa o trabalho
  em branch de trabalho separada, preservando a skill da Etapa 0 como base.
  Não houve alteração de `main`, merge ou force-push.

## Decisão 7 — Reutilização da skill (direção; execução parcial)
- Direção: `.agents/skills/lia-game-project-bootstrap/` deve ser a fonte do
  procedimento da Etapa 0; não criar dois métodos concorrentes de preparação.
- **Auditoria de 2026-10-01:** `templates_loader` permite consultar Skill,
  templates e glossário pela API, mas `bootstrap.py` gera seu próprio Markdown e
  não lê esses templates. A afirmação anterior de reutilização no gerador era
  incorreta. A parametrização dos templates e a responsabilidade pelo conteúdo
  final precisam de contrato próprio antes de refatorar o wizard; até lá, a
  integração é **parcial**, sem alegar Skill executada por runtime.

## Atualização incremental (2026-09-30)
A fase não avança automaticamente por falta de tarefas abertas; o próximo passo
aponta pendências de validação. Execução simulada tem estado separado de validação.
Skills locais podem ser lidas via API/SPA, não executadas automaticamente.

## Decisão 8 — Estágio, atividades e gates (2026-09-30)
- O índice `lia_index.json` é a fonte de verdade para `stage`
  (`preparation`, `mvp`, `production`, `delivery`), `stage_history`, estado do
  projeto (`status`/`archived`) e próximo passo. Novos projetos não duplicam
  o estado em `meta.json`; exportações incluem a entrada atual no manifesto.
- `phase` continua descrevendo atividades da alpha (bootstrap/plan/execute/QA),
  **não** o estágio do jogo. Saúde (`health`) e gate são calculados a partir do
  estado persistido; não viram valores editáveis pelo cliente.
- `app/lia/stages.py` avalia bloqueios e aceita somente avanço para o estágio
  seguinte com `approved: true` booleano e nota registrada. A API genérica só
  edita o nome; não altera estágio, fase nem saúde. Não há avanço automático
  por ausência de tarefas. Histórico de decisão persiste no índice.
- Preparação → MVP exige docs não vazios, ideia definida e ausência de conflito.
  MVP/Produção exigem módulos com tarefas, execução real, validação, QA com
  evidência, aceite dos módulos e confirmação do Dev. A execução simulada não
  satisfaz essas exigências; gates avançados ficam bloqueados enquanto não
  existir executor real. Isso não finge um jogo pronto.
- `approval_status` aprova a **execução** simulada, não o resultado criativo;
  `review_status` é separado e ainda não tem fluxo de aceite implementado.
  Mutação genérica de resultado/validação/aprovação é recusada.
- O lock local protege duas confirmações simultâneas do mesmo estágio; o
  conjunto inteiro de arquivos ainda não é transacional entre processos.

## Decisão 9 — JSON versionado e recuperação sem perda silenciosa (2026-09-30)
- `lia_index.json` v2 e envelopes JSON v2 com `schema_version`/`data` para
  módulos, decisões, QA, assets, release, engine e configurações. API e funções
  de domínio continuam vendo listas/dicionários, não envelopes. Leitura v1
  permanece possível; upgrades apenas na escrita. Versões futuras falham
  explicitamente, sem downgrade ou migração silenciosa.
- Arquivos inválidos causam erro legível, sem converter corrupção em `[]`/`{}`.
  O backup `.bak` conserva uma versão anterior validada; leitura não recupera
  automaticamente. O usuário pode inspecionar em **Dados** e confirmar restauração,
  que guarda uma cópia byte a byte do arquivo danificado.
- O índice é a única fonte de metadados; eliminação de `meta.json` evita
  divergência entre nome/status/estágio. A entrada atual viaja no manifesto
  `_export_meta.json` da exportação. O processo ainda não oferece transações
  multi-arquivos/multi-processos nem backup externo automático.

## Decisão 10 — Afirmações de QA/release exigem suporte verificável (2026-09-30)
- A prévia de execução (`approved: false`) retorna somente a proposta, sem resultado
  simulado, escrita ou aprovação. A interface pede confirmação em etapa separada;
  `approved: true` reavalia dependências no servidor. O resultado continua simulado.
- QA não executa testes: para marcar `executado`, `aprovado_dev` ou `falhou`, o Dev
  precisa registrar critério, ferramenta e evidência textual; a UI confirma o
  registro `aprovado_dev`. Isto documenta uma **declaração humana**, não comprova
  automaticamente a ferramenta, o resultado ou um runner real.
- Não há contrato de artefato de build implementado. Somente `preparando` e
  `pronto_para_build` podem ser gravados; `published: true` é recusado. Estados
  anteriores de build/publicação são lidos sem regravação, marcados como
  **não verificados** e requerem reclassificação explícita (inclusive retirada da
  declaração de publicação) antes de outra escrita. O checklist é relato manual.
- Requisições com JSON inválido/sem objeto não geram ações implícitas: retornam 400.
  O corpo tem limite de 4 MB nesta alpha. Preços/quotas do catálogo offline são
  indicativos; iniciar o app não conta como verificação de fonte.

## Decisão 11 — Handoff materializado como projeção local (2026-09-30)
- `app/lia/handoff.py` extrai de índice/módulos/decisões/QA uma prévia legível por
  tarefa (`project_id`, `module_id`, `task_id`). `HANDOFF.md` é snapshot/projeção,
  **não** fonte canônica do estado; `modules.json`, `decisions.json`, `qa.json` e
  documentos persistidos continuam prevalecendo.
- A prévia não escreve; a gravação exige `confirm: true`, fingerprint reavaliado
  e `replace: true` para sobrescrever um arquivo anterior. Alterações nas fontes
  estruturadas/documentos entre prévia e gravação exigem nova revisão. Na retomada,
  o marcador indica snapshot desatualizado; Markdown manual sem marcador tem
  atualidade desconhecida. O texto ainda requer revisão humana após qualquer edição.
- QA bruta e conteúdo de documentos/arquivos/journal não são copiados, apenas
  referências/estados. O histórico de Sessions simuladas aparece apenas por ID e
  estados das até 5 mais recentes da tarefa, com contagem total; `sessions.json`
  entra no fingerprint para invalidar o snapshot quando o histórico mudar. Isso
  não valida uma execução, evidência ou teste, nem copia prompts/logs do worker.
  Texto de decisões, tarefas, caminhos ou permissões **pode
  conter segredos**: a UI pede revisão antes de compartilhar; não há filtro de
  credenciais garantido, envio externo, agente nem execução de skills.
- A conferência de hash funciona para gravações feitas por este processo; não é
  transação entre processos nem valida a verdade das evidências ou do jogo.

## Decisão 12 — Evidência local identificável não é verdict (2026-09-30)
- `app/lia/evidence.py` registra arquivo já existente no projeto, caminho relativo,
  SHA-256/bytes, alvo por ID de módulo/tarefa e QA opcional do mesmo alvo. A API
  retorna somente metadados, não o conteúdo. Integridade `intact`/`changed`/
  `unavailable` é **derivada** relendo bytes locais, não armazenada como aprovação.
- Recusam-se caminhos absolutos/`..`/drive/links simbólicos, arquivos fora do
  projeto ou acima de 50 MB; não há execução de comando, runner, upload, alteração
  de tarefa/QA ou unlock de gate. Ações de outro processo/edição durante leitura
  não têm garantia transacional; proteção e testes Windows ainda pendentes.
- Registros ficam em `evidence.json` v2 e entram no export do projeto. O handoff
  inclui IDs/caminhos/estado de integridade, não copia bytes nem declara um teste
  aprovado. Revisar dados sensíveis nos arquivos antes de compartilhar/exportar.

## Decisão 13 — Markdown e pasta de projeto exigem revisão manual (2026-09-30)
- Leitura/escrita de documentos e append do journal recusam links simbólicos,
  mesmo quebrados; o índice não pode indicar pasta relativa com travessia nem
  pasta externa divergente da localização registrada. O diagnóstico de integridade
  enumera problemas JSON e Markdown, sem ler os alvos dos links.
- Apenas JSON tem recuperação confirmada a partir de `.bak`; documentos Markdown
  inválidos/ausentes e pastas problemáticas exigem revisão manual, sem sobrescrita
  automática. Respostas e campos de planejamento inválidos são recusados antes
  das escritas correspondentes. O lock é local ao processo e não garante uma
  transação entre processos nem substitui testes de uso/Windows.

## Decisão 14 — Decisões editáveis com revisão e projeção protegida (2026-09-30)
- `decisions.json` continua fonte estruturada. A aba Decisões permite ao Dev
  adicionar e revisar entradas; a API valida assunto, rótulo e tipos. `PUT` usa
  posição no array **junto com** revisão SHA-256 do JSON: edição de versão antiga
  falha e pede recarga; POST pode incluir a revisão para a mesma proteção.
- `DECISIONS.md` é regenerado a partir do registro. Se o Markdown tiver alterações
  manuais, não é sobrescrito sem `replace_projection: true` após revisão/confirmar.
  O serviço pré-verifica os dois destinos sob lock local; o diagnóstico/recovery
  também validam as entradas de `decisions.json` e seu backup. Falha de disco entre
  duas escritas ainda pode deixar projeção desatualizada (não é transação).
- A revisão comprova somente qual lista foi vista, não a veracidade de uma decisão.
  Rótulo “confirmado” é escolha do Dev; conflitos continuam bloqueando gate e
  nenhuma decisão é resolvida automaticamente. Não há migração de registros antigos.

## Decisão 15 — Histórico mínimo de Session para o simulador (2026-09-30)
- **Contratos existentes:** `AI-AGENTS-ARCHITECTURE.md` separa Runtime, Profile,
  Skill, MCP, Tool, Provider/Model e Session; `AI-EXECUTION-ORCHESTRATION.md`
  define estados e o percurso Task → Session → Result → Evidence;
  `EVIDENCE-AND-EXECUTION-HISTORY.md` separa término de processo, validação e
  evidência. O formato em disco do histórico Alpha ainda não estava definido.
- **Escolha limitada à Alpha:** `app/lia/sessions.py` registra somente metadados
  de simulações **aprovadas** em `sessions.json`, lista com envelope JSON v2 e
  backup/recovery existentes. Prévia não cria Session. Cada registro possui ID,
  projeto/módulo/tarefa e estágio, runtime `simulator` explicitamente não real,
  estado terminal da **Session**, execução `simulated`, validação `not_run`,
  evidência `not_verified`, referências de evidência vazias e timestamps. Profile,
  Skills, MCP, Tools, Provider, Model e Computer Use ficam ausentes/nulos, não são
  inferidos da configuração global. Em registros novos,
  `computer_use_backend_id: null` explicita essa ausência; registros anteriores
  sem esse campo permanecem legíveis sem migração. Permissões efetivas e contexto entregue a runtime externo
  são vazios; nenhuma credencial, saída bruta, prompt ou ambiente é persistido.
  `completed` descreve apenas o fluxo de simulação, nunca a tarefa ou o jogo.
- Histórico é append-only por API (sem migrar simulações antigas nem apagar
  automaticamente), somente leitura na UI; a tarefa continua em `modules.json`
  com execução `simulated` e gate não avança. O link com `evidence.json` permanece
  reservado até haver evidências de execução/validação reais; hash de arquivo
  manual não vira aprovação. Serviço de Session não é registry de Runtime,
  Profile, Skill, MCP, Tool ou Provider. A separação será usada para adaptar um
  executor real depois, com decisões adicionais antes de configurar credenciais,
  retenção ou processos externos. O diagnóstico de integridade e a recuperação
  recusam registros/backup cujo `project_id` pertença a outro projeto.
- O lock local serializa o registro neste processo, mas `modules.json`, journal,
  índice e `sessions.json` não formam transação multi-arquivo/processo. Falha de
  disco pode exigir reconciliação manual; não declarar histórico completo nem
  execução verificada. Lia Project permanece opcional e fora do core.

## Decisão 16 — Aprovação da simulação vinculada à prévia (2026-10-01)
- **Problema:** a interface exigia a leitura da proposta, mas `approved: true`
  podia ser enviado sem a prévia ou após mudanças de escopo/permissões.
- **Escolha restrita à Alpha:** `approved: false` devolve `preview_digest`, SHA-256
  de IDs, proposta, estágio, estado de arquivamento e grafo de módulos/tarefas (incluindo
  permissões e bloqueios). `approved: true` exige esse valor; sob o lock local,
  o servidor reavalia bloqueios e digest antes de escrever. A UI mantém o
  digest apenas em memória e o descarta ao confirmar ou remontar a aba.
  Prévia não persiste Session; uma mudança pede nova leitura e confirmação.
- **Alternativas:** manter somente o bloqueio na UI permitiria cliente direto ou
  aba desatualizada; gravar tokens/segredos de autorização exigiria nova política
  e persistência. O hash não é autenticação, prova de leitura, segredo, nem
  autorização de runtime real; uma prévia pode ser repetida se o estado for o
  mesmo, e o lock não garante transações entre arquivos/processos.
- **Escopo:** nenhuma mudança na política de Tool/MCP/Provider/Computer Use,
  gastos ou validação de resultado. A Session permanece `simulated`/`not_run`/
  `not_verified`; Windows e teste humano permanecem pendentes.

## Limites para integrações posteriores (2026-10-01)
- O registro de questões pendentes está em `DECISOES-PENDENTES-INTEGRACOES.md`.
  Ele **não** escolhe backend, custo, credencial ou autoridade em nome do Dev.
- Preferências globais do catálogo (`offline`, `local`, `cloud`, `combined` e ID
  conhecido) são apenas configuração offline. Entrada inválida/segredo em JSON
  não é aceita nem restaurada como configuração saudável; salvar a preferência
  não conecta provider, não habilita chaves e não faz inferência.
