# Lia Studio — Integração com Lia Project

> **Objetivo:** definir uma integração opcional entre Lia Studio e Lia Project sem tornar o Studio dependente da aplicação de convivência.

## 1. Princípio

**Lia Studio funciona sozinho.**

O Lia Project pode adicionar uma camada de personalidade, convivência e memória do usuário, mas essa integração é opcional.

```text
                 LIA STUDIO
                     │
        ┌────────────┴────────────┐
        │                         │
    standalone              Lia Project
        │                         │
        │                    integração
        │                         │
        └────────────┬────────────┘
                     ↓
                Lia Copilot
```

---

## 2. Responsabilidades

### Lia Studio

Responsável por:

- projetos de jogos;
- pipeline;
- Skills;
- Agents/Runtimes;
- MCP;
- Tools;
- engine adapters;
- execução;
- evidências;
- histórico;
- contexto técnico.

### Lia Project

Quando conectado, pode fornecer:

- identidade da Lia;
- personalidade;
- memória de convivência;
- preferências de interação;
- contexto pessoal autorizado pelo usuário.

Não mover a lógica de desenvolvimento do Studio para o Lia Project apenas por causa da integração.

---

## 3. Bridge

A integração deve possuir uma fronteira explícita.

```text
Lia Project
    │
    │ identidade / memória autorizada
    ▼
Lia Studio Bridge
    │
    │ contexto permitido
    ▼
Lia Copilot
    │
    ▼
Project / Task / Agent Runtime
```

O Bridge deve ser uma dependência opcional.

---

## 4. Memória de convivência

A memória do usuário não deve ser tratada como documentação técnica do projeto.

Separar:

```text
Project Knowledge
  └── fatos técnicos do projeto

User Preferences
  └── preferências relevantes para interação

Relationship Memory
  └── memória de convivência da Lia
```

Um Agent executor não recebe Relationship Memory automaticamente.

A Lia pode usar essa memória para melhorar a conversa e, quando apropriado, produzir um contexto técnico resumido para a Task.

---

## 5. Princípio de mínimo contexto

A integração deve compartilhar somente o necessário.

Exemplo:

```text
Usuário diz:
“Faça como costumamos organizar nossos sistemas.”

Lia Project
  ↓
interpreta preferência/memória
  ↓
Lia Studio
  ↓
transforma em instrução técnica apropriada
  ↓
Agent Runtime
```

Não enviar o banco completo de memória para o Agent.

---

## 6. Estado de conexão

A UI deve deixar claro:

```text
Lia Project
● Conectado
○ Desconectado
⚠ Permissão parcial
```

O Studio deve continuar funcional quando:

- Lia Project estiver fechado;
- Bridge estiver indisponível;
- integração estiver desativada;
- usuário não autorizar determinada categoria de memória.

---

## 7. Permissões

O usuário deve poder controlar quais informações podem atravessar a Bridge.

Categorias futuras podem incluir:

- personalidade;
- preferências de interação;
- memória de convivência;
- contexto selecionado;
- nenhuma memória.

Credenciais de provider e segredos de projeto não fazem parte da memória de convivência.

---

## 8. Identidade

A Lia do Studio deve manter identidade visual e personalidade básica mesmo sem o Lia Project.

Quando conectado, o Project pode enriquecer:

- avatar/expressões;
- estilo de comunicação;
- preferências;
- continuidade da relação.

Não deve ser necessário instalar o Lia Project para abrir ou trabalhar em um projeto do Studio.

---

## 9. Falha da integração

Se a Bridge falhar:

```text
Lia Project indisponível
       ↓
Studio continua
       ↓
Lia Studio Copilot assume contexto técnico local
```

Nunca bloquear uma Task puramente porque a memória de convivência não está disponível, salvo se o usuário explicitamente configurou essa dependência.

---

## 10. Regra final

> **Lia Project torna a Lia mais pessoal; Lia Studio torna a Lia mais útil para desenvolvimento de jogos. A integração une as duas experiências sem transformar uma em requisito da outra.**
