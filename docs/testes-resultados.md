# Testes automatizados e registros de desenvolvimento

> Os testes abaixo são da implementação, **não** de aceitação pelo usuário.
> O aplicativo ainda precisa de teste manual do Dev e validação em Windows.

Ambiente: Linux (sandbox), Python 3.x, sem dependências de terceiros. Data: 2026-09-29.

## 1. Testes de núcleo (automatizados; marco inicial de 2026-09-29)
No marco inicial, `python tests/test_core.py` → **15 testes, todos OK**.
O resultado atualizado da suíte completa aparece abaixo.

| Teste | Verifica | Resultado |
|---|---|---|
| Storage: create/list/get | criação e leitura de projeto | OK |
| Storage: docs/structured | ler/escrever Markdown e JSON | OK |
| Storage: archive/reopen/delete | arquivar, reabrir e excluir (exige `confirm`) | OK |
| Storage: path traversal | escrita em `../evil.md` bloqueada | OK |
| Storage: export | exportação de projeto | OK |
| Bootstrap: ideia incompleta | 5 docs gerados; nada `confirmado` inventado; lacunas `em aberto` | OK |
| Bootstrap: ideia completa | público/plataforma viram `confirmado` | OK |
| Conflicts: confirmado vs suposição | detecta conflito de plataforma | OK |
| Conflicts: sem falso positivo | vazio não gera conflito | OK |
| Planning: módulo/tarefa/resumo | cria, atualiza status, resume | OK |
| QA: registro | adiciona verificação | OK |
| Release: defaults | checklist e `published=false` | OK |
| Providers: simulado | catálogo `simulated` e `not_connected`; runtime não conectado | OK |
| Engines: generic verificado | perfil definido; godot não verificado | OK |
| Skill reuse: templates | skill existe e templates presentes | OK |

### Atualização automatizada de 2026-09-30
`python tests/test_core.py` → **92 testes OK** (núcleo, API local, gates,
schemas v1/v2, backup, corrupção do índice/JSON, restauração confirmada,
exportação; dependências, IDs, QA, prévia sem execução, rejeição de publicação
sem build e corpo JSON inválido; handoff com confirmação, IDs, reinício, proteção de links e detecção de fonte alterada; SHA-256 de arquivo local, alvo/QA por ID, isolamento de caminhos e integridade alterada/ausente; links e tipos inválidos em
Markdown/journal, serialização local de append, validação de wizard/plano, resposta
400 e diagnóstico de integridade JSON/Markdown, recusa de pasta adulterada no índice;
decisões com validação, revisão desatualizada, concorrência local, pré-verificação
de JSON/Markdown e confirmação de substituição da projeção manual; diagnóstico
semântico de decisões inválidas e restauração apenas de backup de decisões válido;
Session do simulador após aprovação, prévia sem escrita, histórico local sem
credenciais/permissões efetivas, API somente leitura, corrupção/recovery confirmado,
histórico preservado após reset, gates não promovidos, sessão de outro projeto
recusada no diagnóstico/recovery, campo Computer Use opcional retrolegível e
perfil Unreal selecionável sem adapter real; preferências de provider rejeitam
modo/provider/segredo inválidos sem escrita nem conexão e saúde/recovery conferem
backup válido).
`node tests/test_ui.cjs` → **OK** (prévia →
aprovação, reset, dependências, handoff com prévia e confirmação, decisões com edição por revisão e confirmação antes de substituir Markdown manual, registro de arquivo local sem upload, Sessions simuladas recentes sem alegar
validação e seletor de engine vindo do catálogo com Unreal não verificado). O cenário de desbloqueio
injeta uma fixture com estados de execução/validação externa; **a aplicação não
produz esses estados por simulação**. Testes automatizados não substituem teste
humano em Windows nem teste completo no navegador.

### Incremento automatizado de 2026-10-01
`python tests/test_core.py` → **93 testes OK**. Handoff referencia somente ID,
estados e data das Sessions simuladas da tarefa, não copia resultado bruto,
rejeita a gravação com digest anterior e detecta alteração de `sessions.json`
mesmo sem mudança no plano. Prévia de execução não envelhece o snapshot.
`node tests/test_ui.cjs`, `node --check app/static/app.js`,
`python -m compileall -q app` e `git diff --check` → **OK**.
Sem testes de uso, Windows, engines ou provedores reais.

### Continuação da Alpha em 2026-10-01
`python tests/test_core.py` → **94 testes OK**. Aprovação da simulação sem
prévia, com digest incorreto ou após mudança nas permissões é recusada sem
criar Session; nova prévia permite a simulação. A API exige `preview_digest`
e a UI o encaminha somente após mostrar a proposta.
`node tests/test_ui.cjs`, `node --check app/static/app.js`,
`python -m compileall -q app` e `git diff --check` → **OK**.
O digest não autentica usuário nem prova leitura humana. Testes de uso e no
Windows permanecem pendentes; runtime/engine/provider/Computer Use reais não
foram conectados.

## 2. Smoke técnico anterior de API (via curl; não é teste de uso/aceite)
Fluxo registrado anteriormente pelo desenvolvimento: criar projeto → bootstrap com ideia incompleta →
listar decisões (todas `em aberto`) → inserir decisão conflitante (plataforma
`confirmado` mobile + `suposição` PC) → `GET /conflicts` retorna o conflito →
criar módulo + tarefa → `POST .../execute` retorna `simulated=true` → registrar QA
→ `GET /release` retorna `published=false` com 6 itens de checklist → `POST /api/example`
cria projeto de exemplo → `/` serve o HTML da interface. **Todos os passos OK.**

## 3. Roteiro de teste de uso **pendente** (não executado pelo Dev)
- Abrir `http://localhost:8080` → tela inicial com botões Novo / Exemplo.
- "Carregar exemplo demonstrativo" popula projeto com docs, módulo e tarefa.
- Navegar pelas abas (Visão geral, Etapa 0, Documentos, Plano, Execução, QA, Release,
  Configuração) sem erro; editar documento e salvar persiste.
- Aba Execução mostra a proposta antes da aprovação, distingue resultado SIMULADO
  e bloqueia tarefas de módulos com dependências ainda não prontas.
- Aba QA exige evidência para registro executado/aprovado e não afirma runner real.
- Aba Release não oferece estado publicado/build gerado; apresenta declarações
  antigas como não verificadas.
- Aba Handoff permite revisar uma prévia e confirma substituição; ao mudar fontes
  (inclusive novas Sessions simuladas) o arquivo salvo aparece como desatualizado,
  sem publicar/envio automático. Referências a Sessions não são evidência validada.
- Aba Evidências registra hash de arquivo relativo sem enviar bytes; alteração
  e indisponibilidade aparecem, mas não alteram aprovação/execução.
- Aba Configurações lista provedores com banner offline/simulado.

Nenhuma linha deste roteiro constitui aceite ou teste de uso já realizado.

## O que NÃO foi testado
- Empacotamento/execução como `.exe` Windows (ambiente Linux; teste futuro do Dev).
- Caminhos/permissões do registro de evidências no Windows.
- Integração real com engine ou provedor de IA (fora do escopo da alpha; tudo simulado).
- UI automatizada em navegador (há apenas regressão JS sem DOM real).
- Teste de uso/aceite pelo Dev (o roteiro acima permanece pendente).
