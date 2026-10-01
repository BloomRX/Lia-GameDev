# Lia Studio — Evidence & Execution History

> **Objetivo:** garantir que o Studio registre não apenas o que um Agent diz ter feito, mas o que foi executado, validado e produzido.

## 1. Evidence First

Uma Task não deve ser considerada concluída apenas porque o runtime retornou uma mensagem de sucesso.

```text
Task
 ↓
Execution
 ↓
Validation
 ↓
Evidence
 ↓
Conclusion
```

---

## 2. Execution Record

Cada Session deve gerar um registro suficiente para reconstruir a execução.

Registrar quando disponível:

- Session ID;
- Project;
- Task;
- Stage;
- Role;
- Runtime;
- Provider/modelo;
- Skills;
- MCPs;
- Tools relevantes;
- início/fim;
- status;
- logs;
- arquivos alterados;
- resultado;
- evidências;
- erros;
- approvals.

---

## 3. Evidence

Evidence é um artefato verificável relacionado à Task.

Exemplos:

```text
Code diff
Test result
Build result
Screenshot
Log
Generated artifact
Command result
Git status/diff
```

Uma execução pode ter várias evidências.

---

## 4. Evidence não é verdade automática

Um log do Agent dizendo:

> “Build concluído.”

não substitui o resultado real do build quando o Studio consegue verificá-lo.

Priorizar evidência produzida pela ferramenta/engine/teste.

---

## 5. Task Status

Estados recomendados:

```text
Pending
Preparing
Running
WaitingApproval
Validating
Completed
CompletedWithWarnings
Failed
Cancelled
Blocked
```

`Completed` deve representar conclusão validada dentro do que foi possível verificar.

---

## 6. Histórico

O usuário deve conseguir consultar:

```text
Project
  ↓
Task History
  ↓
Session
  ↓
Execution
  ↓
Evidence
```

A interface pode mostrar resumo e permitir abrir os detalhes técnicos.

---

## 7. Diff e alterações

Quando uma execução alterar arquivos, o Studio deve tentar registrar:

- arquivos criados;
- modificados;
- removidos;
- diff quando disponível.

Não exigir Git para todo projeto, mas aproveitar Git quando presente.

---

## 8. Rollback

O Studio deve facilitar identificação de alterações realizadas por uma Session.

Rollback automático não deve ser presumido.

Quando Git estiver disponível, mostrar claramente o estado antes/depois e permitir que o usuário decida a ação.

---

## 9. Aprendizado de Skills

Evidências podem alimentar revisão de Skills, mas nunca alterar automaticamente uma Skill global.

```text
Execution
 ↓
Result
 ↓
Learning / Suggestion
 ↓
Review
 ↓
New Skill Version
```

---

## 10. Privacidade

Histórico não deve registrar segredos.

Filtrar:

- API keys;
- tokens;
- senhas;
- credenciais;
- dados pessoais desnecessários.

---

## 11. Regra final

> **O histórico deve responder três perguntas: o que foi pedido, o que foi executado e qual evidência temos de que funcionou.**
