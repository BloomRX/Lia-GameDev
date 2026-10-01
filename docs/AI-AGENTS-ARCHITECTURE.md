# Lia Studio — AI Agents Architecture

> Especificação técnica inicial para separar Runtime, Role, Skill, MCP, Tool, Provider, Model e Session.

## 1. Princípio

O Lia Studio deve tratar **Agent Runtime, Role/Profile, Skill, MCP, Tool, Provider/Model e Session como entidades distintas**.

Não criar uma classe ou módulo monolítico `Agent` que contenha toda a lógica.

## 2. Modelo

```text
Agent Role/Profile
      │
      ├── Skills
      ├── Runtime
      ├── MCP Connections
      ├── Tools
      ├── Context
      └── Permissions
              │
              ▼
          Session
              │
              ▼
       Provider / Model
```

## 3. Agent Runtime

Representa o executor instalado/disponível no computador.

Exemplos iniciais:

- Codex;
- Claude Code;
- Kimi;
- outros runtimes compatíveis no futuro.

Responsabilidades:

- detectar disponibilidade;
- verificar versão quando possível;
- iniciar sessão;
- enviar contexto permitido;
- acompanhar processo;
- capturar saída;
- encerrar/cancelar sessão;
- reportar estado.

O Runtime não deve possuir conhecimento específico de uma fase do jogo.

## 4. Role/Profile

Representa **como o runtime será utilizado para uma tarefa**.

Exemplos:

- Gameplay;
- QA;
- Build;
- Documentation;
- Art Pipeline.

Um Profile referencia Skills, permissões e capacidades relevantes, mas não precisa possuir um runtime próprio.

Exemplo:

```text
Profile: Gameplay
Runtime: Claude Code
Skills: Unreal Gameplay, Debugging
MCP: Unreal, Git
```

## 5. Skill

Skill é conhecimento/instrução/workflow reutilizável.

Uma Skill pode ser usada por vários Profiles e runtimes.

Não é responsabilidade da Skill:

- autenticar provider;
- instalar runtime;
- guardar credenciais;
- conectar MCP automaticamente;
- executar operações privilegiadas sem autorização.

## 6. MCP Connection

Representa uma conexão configurada com um servidor MCP.

Deve registrar, quando aplicável:

- nome/ID;
- origem (global, projeto, plugin);
- transporte;
- comando ou endpoint;
- variáveis explicitamente necessárias;
- estado;
- capacidades descobertas;
- política de aprovação.

MCP configurado não significa MCP conectado à sessão atual.

## 7. Tool

Tool é uma operação concreta oferecida por um runtime ou integração.

Uma Tool deve possuir identidade própria e origem identificável.

Exemplo:

```text
Tool: unreal.get_scene
Source: Unreal MCP
```

Tools não devem ser transformadas em Agents individuais.

## 8. Provider e Model

Provider é o serviço/API que fornece capacidade de IA ou outro serviço externo.

Model é uma implementação/modelo específico quando o provider/runtime permite sua escolha.

Não assumir que todo runtime expõe provider e model separadamente. A arquitetura deve suportar runtimes que encapsulam essas escolhas.

## 9. Session

Session representa uma execução concreta.

Deve permitir rastrear:

- runtime;
- profile;
- projeto;
- tarefa;
- skills utilizadas;
- MCPs conectados;
- tools utilizadas quando disponível;
- provider/model quando disponível;
- permissões efetivas;
- estado;
- saída;
- evidências;
- duração;
- erro/cancelamento.

## 10. Registry

O Studio deve possuir registries separados para:

```text
Runtime Registry
Skill Registry
MCP Registry
Tool Registry
Provider Registry
```

Não criar um único catálogo genérico que perca a origem e o tipo da integração.

## 11. Configuração global e de projeto

### Global

```text
Runtimes
MCP Connections
Providers/APIs
Skills disponíveis
Credenciais
Preferências
```

### Projeto

```text
Engine
Runtime/Profile selecionado
Skills autorizadas
MCPs permitidos
Tools permitidas
Provider/model policy
Permissions
```

O projeto referencia recursos globais; não precisa duplicá-los.

## 12. Fluxo de resolução

```text
Task
 ↓
Capability Resolver
 ↓
Profile/Role
 ↓
Runtime
 ↓
Skills
 ↓
MCP + Tools
 ↓
Permissions
 ↓
Session
```

Se não houver capacidade suficiente, a tarefa deve parar ou solicitar intervenção, em vez de inventar uma ferramenta.

## 13. Segurança

Credenciais devem ser fornecidas apenas para a integração/sessão que precisa delas.

Nunca encaminhar automaticamente todo o ambiente do processo para um runtime.

Nenhum segredo deve aparecer em:

- Skills;
- commits;
- logs;
- relatórios;
- evidências;
- UI.

## 14. Extensibilidade

Novos runtimes, providers, MCPs e engines devem ser adicionáveis sem alterar o núcleo da pipeline.

A implementação inicial pode ser pequena, mas os contratos devem permitir expansão.

## 15. Regra para implementação

> **Primeiro separar as responsabilidades; depois adicionar integrações reais.**
>
> A implementação Alpha pode utilizar execução simulada, desde que preserve os mesmos contratos que serão usados pela execução real.
