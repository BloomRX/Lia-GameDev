# Lia Studio — AI Context & Permissions

> **Objetivo:** controlar o que cada execução pode conhecer e modificar.

## 1. Princípio

Um Agent deve receber **o contexto mínimo necessário** para realizar a Task e somente as capacidades autorizadas pelo projeto/usuário.

```text
Contexto ≠ memória total
Permissão ≠ capacidade técnica
```

Ter acesso a uma ferramenta não significa que ela deve ser usada em toda Task.

---

## 2. Camadas de contexto

```text
GLOBAL
  ├── Studio configuration
  ├── available runtimes
  ├── available Skills
  └── integrations

PROJECT
  ├── engine
  ├── architecture
  ├── project docs
  ├── project Skills
  └── project rules

STAGE
  ├── current phase
  └── phase-specific context

TASK
  ├── objective
  ├── relevant files
  ├── criteria
  └── constraints

SESSION
  ├── current conversation
  ├── tool results
  └── execution state
```

---

## 3. Lia Project e memória de convivência

O Lia Studio deve funcionar sem o Lia Project.

Quando a integração existir, a memória de convivência deve ser uma camada opcional.

```text
Lia Project
  └── memória de convivência
          ↓
     Integration Bridge
          ↓
   contexto autorizado
          ↓
      Lia Studio
```

A memória pessoal **não deve ser enviada automaticamente para qualquer Agent**.

O Studio deve distinguir:

- contexto técnico do projeto;
- contexto da tarefa;
- preferências do usuário;
- memória de convivência;
- segredos/credenciais.

Credenciais nunca são contexto comum.

---

## 4. Escopo de acesso

Permissões devem poder ser definidas por escopo:

```text
Studio
Project
Workspace
Task
Session
Tool
```

Preferir o escopo mais restrito capaz de resolver a Task.

---

## 5. Matriz inicial

| Capacidade | Padrão sugerido |
|---|---|
| Ler arquivos do projeto | Permitido |
| Criar arquivos | Permitido/configurável |
| Editar arquivos | Permitido/configurável |
| Apagar arquivos | Aprovação/configurável |
| Executar testes | Permitido/configurável |
| Executar build | Configurável |
| Shell | Restrito/configurável |
| Git status/diff | Permitido |
| Git commit | Configurável |
| Git push | Aprovação |
| Publicar release | Aprovação |
| Usar provider pago | Conforme política de custo |
| Acessar memória de convivência | Nunca automático |

Os defaults podem evoluir conforme o modelo de ameaça e experiência do produto.

---

## 6. MCP e Tools

Uma conexão MCP deve declarar quais Tools fornece e quais escopos de acesso são necessários.

```text
MCP: Unreal
  ├── inspect
  ├── query
  └── modify

Project permission:
  Unreal MCP = allowed

Task permission:
  modify = allowed
```

Configuração global não deve equivaler a autorização automática em todos os projetos.

---

## 7. Segredos

Nunca enviar automaticamente:

- API keys;
- tokens;
- senhas;
- cookies de autenticação;
- credenciais do sistema;
- variáveis de ambiente não necessárias.

A aplicação deve fornecer somente as credenciais explicitamente necessárias para a integração/session.

---

## 8. Destructive Actions

Ações destrutivas devem possuir política clara.

```text
LOW
  leitura
  análise
  diff

MEDIUM
  edição
  criação
  testes

HIGH
  deleção
  shell sensível
  push
  release
```

A categorização pode evoluir por Tool.

---

## 9. Approval Gate

Quando uma ação exigir aprovação:

```text
Agent solicita ação
      ↓
Studio mostra:
  - ação
  - ferramenta
  - alvo
  - possível impacto
      ↓
Usuário aprova/nega
      ↓
Execução
```

Nunca pedir aprovação vaga como:

> “Posso continuar?”

Mostrar o que será feito.

---

## 10. Context leakage

Evitar que uma Task receba informações de outros projetos, usuários ou sessões sem necessidade.

Cada Project deve possuir fronteira clara de contexto.

Uma Skill global pode ser reutilizada, mas seu conteúdo não deve carregar dados privados de um projeto anterior.

---

## 11. Regra final

> **O Agent deve ter capacidade suficiente para executar a Task, mas não acesso irrestrito apenas porque tecnicamente consegue obtê-lo.**

Segurança deve ser aplicada na camada de execução, não apenas na UI.
