# Lia Studio — Arquitetura de Agents

> **Objetivo:** definir como Roles, Runtimes, Skills, MCP, Tools, Providers e Sessions se combinam sem transformar tudo em uma única entidade chamada Agent.

## 1. Princípio

O Lia Studio deve separar **o que um Agent é**, **como ele executa**, **o que ele sabe**, **quais ferramentas possui** e **quais serviços/modelos utiliza**.

```text
Role / Profile
      │
      ├── Skills
      ├── Runtime
      ├── MCP Connections
      ├── Tools
      ├── Permissions
      └── Project Context
              │
              ▼
           Session
```

A referência de comportamento é o modelo observado no Mr. Mak: runtimes como Codex, Claude Code e Kimi são executores independentes; Coordinator e workers permanecem conceitualmente separados. fileciteturn106file0

---

## 2. Entidades

### Agent Runtime

Programa/cliente executor capaz de realizar trabalho, por exemplo:

- Codex;
- Claude Code;
- Kimi;
- outros runtimes futuros;
- runtimes locais compatíveis.

### Role / Profile

Define **o papel da execução**, não o modelo.

Exemplos:

- Gameplay;
- QA;
- Documentation;
- Build/Release;
- Tools;
- Art Pipeline.

Um mesmo runtime pode executar vários Roles.

### Skill

Conhecimento, instruções, padrões ou workflow reutilizável.

### MCP Connection

Conexão com um servidor MCP que fornece contexto/capacidades.

### Tool

Operação concreta disponibilizada ao runtime.

### Provider

Serviço que fornece modelos ou outras capacidades externas.

### Model

Modelo específico selecionado dentro de um provider/runtime quando essa escolha é exposta.

### Session

Instância concreta de uma execução.

---

## 3. Composição

Uma execução deve ser montada a partir de configuração global + contexto do projeto + tarefa.

```text
GLOBAL
 ├── Runtimes
 ├── MCPs
 ├── Providers
 └── Skills

PROJECT
 ├── Runtime permitido/preferencial
 ├── Role
 ├── Skills autorizadas/relevantes
 ├── MCPs autorizados
 ├── Permissions
 └── Context

TASK
 ├── objetivo
 ├── contexto específico
 └── critérios de conclusão

             ↓

SESSION
```

---

## 4. Exemplo

```text
Role: Gameplay
Runtime: Claude Code
Provider/Model: conforme runtime/configuração
Skills:
  - Unreal Gameplay
  - Inventory
  - Save System
MCP:
  - Unreal
  - Git
Permissions:
  - project files: read/write
  - git commit: allowed
  - git push: approval
```

A troca para Codex não deve exigir criar outro Role:

```text
Role: Gameplay
Runtime: Codex
Skills: mesmas
MCP: mesmos quando compatíveis
Permissions: mesmas
```

---

## 5. Profiles não são Agents permanentes

Evitar criar entidades rígidas como:

```text
GameplayAgent
QAAgent
BuildAgent
```

quando isso representar apenas configurações diferentes do mesmo runtime.

Preferir:

```text
Gameplay Role + Runtime X
QA Role + Runtime X
Build Role + Runtime Y
```

Uma implementação pode futuramente oferecer **Agent Presets** como atalhos de configuração, mas o modelo interno deve preservar a separação.

---

## 6. Session

Cada execução deve ter identidade própria e permitir reconstruir o contexto necessário.

Uma Session deve registrar, quando disponível:

- projeto;
- tarefa;
- Role;
- Runtime;
- provider/modelo;
- Skills usadas;
- MCPs conectados;
- permissões;
- início/fim;
- status;
- arquivos alterados;
- resultado;
- evidências;
- erros.

Isso é essencial para diagnóstico e histórico.

---

## 7. Estado do Runtime

O Studio deve distinguir:

```text
Detectado
Instalado
Configurado
Autenticado
Disponível
Em execução
Indisponível
```

Não assumir que “instalado” significa “pronto para executar”.

---

## 8. Compatibilidade

Runtimes e MCPs devem declarar capacidades quando possível.

Exemplo:

```text
Runtime
  capabilities:
    code_execution
    terminal
    project_files

MCP
  capabilities:
    unreal_editor
    git
```

A composição de uma Session deve verificar incompatibilidades antes da execução.

---

## 9. Coordinator / Lia Copilot

A Lia atua como camada de interação/orquestração, mas não precisa executar diretamente toda operação.

```text
Usuário
  ↓
Lia Copilot
  ↓
Task / Context Resolver
  ↓
Role + Runtime
  ↓
Session
```

O Coordinator pode:

- entender intenção;
- montar contexto;
- sugerir Runtime/Role;
- selecionar Skills relevantes;
- validar pré-condições;
- solicitar confirmação;
- acompanhar execução;
- apresentar resultado.

O Worker Runtime continua sendo responsável pela execução efetiva.

---

## 10. Falhas

Falhas de composição devem ser detectadas antes de iniciar uma Session quando possível.

Exemplos:

- runtime não instalado;
- autenticação ausente;
- Skill incompatível;
- MCP indisponível;
- permissão insuficiente;
- provider não autorizado;
- política de custo bloqueando execução.

A UI deve explicar **qual camada falhou**.

---

## 11. Regra de arquitetura

> **Um Agent é uma composição de capacidades e contexto, não uma caixa monolítica que contém modelo, Skill, MCP e ferramenta dentro dela.**

Essa regra deve orientar nomes de classes, serviços, configurações e componentes de UI.
