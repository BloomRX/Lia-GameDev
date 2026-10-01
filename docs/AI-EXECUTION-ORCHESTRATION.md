# Lia Studio — AI Execution & Orchestration

> **Objetivo:** definir como o Studio transforma uma intenção do usuário em uma execução controlada de Agent, sem acoplar a Lia a um único runtime.

## 1. Princípio

A Lia não deve simplesmente encaminhar toda mensagem para o mesmo Agent.

Ela deve entender o contexto e ajudar a montar a execução adequada.

```text
Usuário
  ↓
Lia Copilot
  ↓
Task Resolver
  ↓
Capability Resolver
  ↓
Role + Runtime
  ↓
Skills + MCP + Tools + Permissions
  ↓
Session
  ↓
Validation
  ↓
Evidence
  ↓
Lia apresenta resultado
```

---

## 2. Task

Toda execução deve, quando possível, possuir uma Task explícita.

Uma Task representa:

- objetivo;
- projeto;
- fase;
- contexto;
- arquivos/áreas relevantes;
- critérios de conclusão;
- restrições;
- política de execução.

Exemplo:

```text
Task: Implementar inventário
Project: Relatos
Stage: MVP Jogável
Area: Gameplay
Criteria:
  - item pode ser adicionado
  - item pode ser removido
  - estado persiste
```

---

## 3. Resolver capacidades

Antes de executar, o Studio deve determinar o que a Task precisa.

Exemplo:

```text
Inventário
 ├── código
 ├── Unreal
 ├── save
 └── testes
```

Depois procura:

```text
Skills relevantes
MCPs relevantes
Tools relevantes
Runtime compatível
```

---

## 4. Escolha de Runtime

A seleção deve considerar, nesta ordem conceitual:

1. preferência explícita do usuário;
2. configuração do projeto;
3. Role/Profile;
4. compatibilidade da tarefa;
5. disponibilidade do runtime;
6. política Free-First/custo;
7. fallback autorizado.

O Studio não deve trocar silenciosamente para um provider pago apenas porque o primeiro caminho falhou.

---

## 5. Preparação da Session

Antes de iniciar:

```text
validar runtime
validar autenticação
validar Skills
validar MCP
validar permissões
validar política de custo
montar contexto mínimo necessário
```

Se houver problema, a execução deve parar antes de produzir efeitos quando possível.

---

## 6. Contexto mínimo necessário

O Studio deve evitar enviar contexto indiscriminado.

Preferir:

```text
Project
 + Stage
 + Task
 + Relevant files
 + Relevant docs
 + Relevant Skills
 + Relevant MCPs
```

Não enviar automaticamente toda memória da Lia Project, todo projeto ou todos os documentos.

---

## 7. Execução

Uma Session pode produzir:

- alterações de arquivos;
- comandos executados;
- logs;
- testes;
- artefatos;
- evidências;
- mensagens do runtime.

O Studio deve acompanhar o estado:

```text
Preparing
Running
Waiting for approval
Validating
Completed
Failed
Cancelled
```

---

## 8. Aprovação humana

Ações potencialmente destrutivas ou de alto impacto devem poder exigir confirmação.

Exemplos:

- apagar grande quantidade de arquivos;
- push remoto;
- publicar release;
- executar comandos sensíveis;
- usar provider pago quando a política exigir confirmação.

A política deve ser configurável, mas o comportamento seguro deve existir como opção padrão.

---

## 9. Validação

“Agent terminou” não significa “Task concluída”.

Após execução, o Studio deve tentar validar os critérios definidos.

```text
Execution
  ↓
Validation
  ├── tests
  ├── build
  ├── diff
  ├── static checks
  └── user review
```

---

## 10. Evidence First

Toda conclusão relevante deve possuir evidência quando possível.

```text
Task
 ↓
Execution
 ↓
Evidence
```

Exemplos:

- teste passou;
- build concluído;
- arquivo alterado;
- diff produzido;
- screenshot;
- log;
- resultado de ferramenta.

A Lia deve distinguir:

> **“O Agent afirmou que terminou.”**

 de

> **“O Studio verificou evidência de conclusão.”**

---

## 11. Falha e recuperação

Quando uma execução falhar:

1. preservar logs;
2. preservar estado da Session;
3. identificar camada da falha;
4. sugerir recuperação;
5. evitar repetir automaticamente uma operação potencialmente destrutiva;
6. permitir retry explícito quando apropriado.

Fallback de runtime/provider só deve ocorrer quando autorizado pela política do usuário.

---

## 12. Paralelismo

O Studio poderá executar Tasks independentes em paralelo no futuro.

Não executar paralelamente Tasks que possam editar os mesmos recursos sem mecanismo de coordenação.

Exemplo seguro:

```text
QA Task A ──────────┐
Documentation Task ─┼→ paralelo
Asset Analysis ─────┘
```

Exemplo que exige coordenação:

```text
Agent A → Gameplay.cpp
Agent B → Gameplay.cpp
```

---

## 13. Cancelamento

O usuário deve conseguir cancelar uma Session quando o runtime permitir.

Cancelar deve:

- interromper quando possível;
- registrar estado;
- preservar logs;
- informar se alterações parciais podem existir.

---

## 14. Resultado para o usuário

A Lia deve resumir o resultado em linguagem clara:

```text
Concluído

✓ Inventário implementado
✓ Testes executados
✓ Save atualizado

Alterações:
  6 arquivos

Evidências:
  3 testes
  1 build

Atenção:
  1 tarefa ainda bloqueada
```

A UI não deve esconder o acesso aos detalhes técnicos.

---

## 15. Regra final

> **Orquestrar não significa automatizar tudo. Orquestrar significa selecionar contexto, capacidades, execução, validação e aprovação de forma previsível.**
