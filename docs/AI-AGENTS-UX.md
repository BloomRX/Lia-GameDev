# Lia Studio — AI Agents e participação no Projeto

> **Complemento de UX/arquitetura**  
> Agents não são apenas uma tela de configuração. Eles são participantes operacionais do projeto.

## 1. Princípio

O Lia Studio deve tratar **AI Agents como recursos de primeira classe**.

A interface não deve reduzir Agents a:

> `Configurações → escolher modelo → salvar`

A configuração existe, mas é apenas uma parte do ciclo.

O conceito correto é:

```text
Agent
  ↓
Identidade + Skills + ferramentas + permissões
  ↓
Entrada no Projeto
  ↓
Participação em uma fase/área/tarefa
  ↓
Execução
  ↓
Resultado + evidência + logs
  ↓
Revisão humana
```

O usuário continua sendo o responsável por decisões importantes. Agents executam trabalho dentro de limites explícitos.

---

# 2. Dois níveis de Agent

## 2.1 Agent do Studio

É uma definição reutilizável.

Exemplos:

- Unreal Gameplay Agent
- Technical Designer Agent
- QA Agent
- Build/Release Agent
- Documentation Agent
- Art Pipeline Agent
- Code Review Agent

Um Agent pode existir independentemente de qualquer projeto.

## 2.2 Agent do Projeto

É uma instância/configuração do Agent aplicada a um projeto específico.

Exemplo:

```text
Agent global: Unreal Gameplay Agent

Projeto: Relatos
  └── Agent aplicado:
      Unreal Gameplay Agent
      Skills: Gameplay, Save System, UE Architecture
      Ferramentas: Git, build, editor automation
      Permissões: leitura + execução limitada
```

O projeto pode adaptar contexto, Skills, ferramentas e permissões sem alterar automaticamente a definição global do Agent.

---

# 3. Agent não é necessariamente um modelo

Separar conceitualmente:

```text
Agent
 ├── Papel / objetivo
 ├── Instruções
 ├── Skills
 ├── Ferramentas
 ├── Memória/contexto permitido
 ├── Permissões
 ├── Política de execução
 └── Provider / modelo
```

O modelo é um componente substituível.

Um Agent deve poder utilizar:

- modelo local;
- modelo hospedado gratuito;
- modelo em nuvem pago;
- provider compatível configurado pelo usuário.

A UI não deve presumir que um Agent é “GPT”, “Claude”, “Gemini” etc. O Agent é a função; o modelo é o motor configurável.

---

# 4. Como Agents entram em um projeto

Ao abrir um projeto, deve existir uma área como:

```text
PROJETO
  Visão Geral
  Tarefas
  Documentos
  Assets
  QA
  Builds
  Agents
  Skills
```

A tela de Agents do projeto deve responder:

> **“Quais Agents estão trabalhando neste projeto e o que eles podem fazer?”**

Não mostrar apenas configurações técnicas.

Exemplo:

```text
┌────────────────────────────────────────────────────┐
│ AGENTS DO PROJETO                                  │
│                                                    │
│ ● Gameplay Agent          Ativo                   │
│   Gameplay / C++ / UE                              │
│   3 tarefas em execução                            │
│                                                    │
│ ● QA Agent                Disponível              │
│   Testes / análise / relatórios                    │
│                                                    │
│ ○ Build Agent             Desativado              │
│   Build / packaging / release                      │
└────────────────────────────────────────────────────┘
```

---

# 5. Agents participam da pipeline

A pipeline do projeto continua sendo:

```text
PREPARAÇÃO → MVP JOGÁVEL → PRODUÇÃO → FINALIZAÇÃO
```

Agents podem participar de uma ou várias fases.

Exemplo:

```text
Preparação
  └── Documentation Agent

MVP
  ├── Gameplay Agent
  └── QA Agent

Produção
  ├── Gameplay Agent
  ├── Content/Tools Agent
  └── QA Agent

Finalização
  ├── QA Agent
  └── Build Agent
```

A pipeline não deve virar uma lista de Agents. A pipeline continua sendo o eixo do projeto; Agents aparecem **dentro do contexto da fase**.

---

# 6. Agents também entram em tarefas

Uma tarefa pode indicar:

```text
Implementar sistema de inventário

Responsável:
  Gameplay Agent

Skills:
  Inventory Architecture
  Unreal Gameplay Systems
  Save System

Estado:
  Em execução

Último resultado:
  Implementação criada

Revisão humana:
  Necessária
```

Isso permite que o usuário veja **quem está fazendo o quê**.

---

# 7. Lia e Agents são papéis diferentes

A Lia não deve ser confundida automaticamente com todos os Agents.

### Lia Copilot

É a interface inteligente e contextual com o usuário.

Ela pode:

- explicar;
- planejar;
- sugerir;
- coordenar;
- chamar um Agent;
- resumir resultados;
- pedir aprovação;
- apresentar conflitos.

### Agents

Executam papéis especializados.

```text
Usuário
   ↓
Lia Copilot
   ↓
Orquestração
   ├── Gameplay Agent
   ├── QA Agent
   ├── Build Agent
   └── Documentation Agent
```

Isso deixa espaço para uma arquitetura futura em que a Lia coordena vários Agents sem obrigar que ela própria execute todas as tarefas.

---

# 8. UX de execução

Quando um Agent estiver trabalhando, o usuário deve conseguir ver:

- tarefa atual;
- fase do projeto;
- Agent responsável;
- Skill(s) utilizadas;
- ferramentas utilizadas;
- modelo/provider utilizado quando relevante;
- progresso/estado;
- logs resumidos;
- arquivos alterados;
- resultado;
- necessidade de revisão/aprovação.

Não expor logs técnicos gigantes como experiência principal. Deve existir uma visão resumida e uma opção para expandir detalhes.

---

# 9. Human-in-the-loop

Ações potencialmente destrutivas ou de alto impacto devem respeitar permissões e confirmação.

Exemplos:

- apagar arquivos;
- modificar configuração crítica;
- executar comandos perigosos;
- alterar branch/repositório;
- publicar release;
- sobrescrever conteúdo;
- modificar Skills globais.

Fluxo preferencial:

```text
Agent propõe
   ↓
Lia explica
   ↓
Usuário aprova
   ↓
Agent executa
   ↓
Resultado registrado
```

Permissões automáticas podem existir para ações seguras, mas devem ser explícitas e configuráveis.

---

# 10. Agents + Skills

Skills são conhecimento reutilizável.

Agents são executores especializados.

A relação deve ser:

```text
Skill
  ↓
Agent recebe Skill + contexto
  ↓
Agent executa
  ↓
Resultado
```

Uma Skill não deve ficar presa a um único Agent.

Um Agent pode utilizar várias Skills.

Uma mesma Skill pode ser utilizada por vários Agents.

---

# 11. Agents + memória do Lia Project

O Lia Studio deve funcionar sozinho.

Se o Lia Project estiver conectado, a Lia pode trazer contexto de convivência, preferências e histórico permitido.

Isso não deve transformar automaticamente esse contexto pessoal em memória operacional de todos os Agents.

A ponte deve controlar o que é compartilhado:

```text
Lia Project
  │
  │ contexto autorizado
  ▼
Lia Copilot
  │
  │ contexto de trabalho necessário
  ▼
Agent
```

Agents recebem apenas o contexto necessário para executar a tarefa.

---

# 12. Interface de Agents

A interface deve possuir pelo menos dois níveis:

## Biblioteca/Configuração

Para:

- criar Agent;
- editar identidade;
- selecionar Skills;
- configurar provider/modelo;
- configurar ferramentas;
- definir permissões;
- testar;
- versionar.

## Participação no Projeto

Para:

- adicionar Agent ao projeto;
- definir áreas/fases permitidas;
- definir tarefas;
- visualizar atividade;
- revisar resultados;
- pausar/remover Agent;
- alterar permissões específicas do projeto.

Esses dois espaços não devem ser confundidos.

---

# 13. Agentes na Home

A Home não precisa colocar Agents como um terceiro destino equivalente a Projeto e Skills.

A entrada principal continua:

```text
Criar/Abrir Projeto
Skills
```

Agents podem ser acessados pela área de conhecimento/configuração do Studio e, principalmente, dentro do contexto de projeto.

Isso evita transformar a Home em um painel administrativo.

---

# 14. Regra de UX

> **Não mostre apenas “qual modelo está configurado”. Mostre “quem está trabalhando, em quê, usando quais capacidades, com quais limites e qual foi o resultado”.**

Essa regra deve orientar qualquer futura tela de Agents.
