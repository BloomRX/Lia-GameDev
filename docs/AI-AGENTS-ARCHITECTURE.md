# Lia Studio — AI Agents Architecture

> Especificação técnica para separar Runtime, Role, Skill, MCP, Tool, Provider, Model, Computer Use e Session.

## 1. Princípio

O Lia Studio deve tratar **Agent Runtime, Role/Profile, Skill, MCP, Tool, Provider/Model, Computer Use e Session como entidades distintas**.

Não criar uma classe ou módulo monolítico `Agent` que contenha toda a lógica.

## 2. Modelo

```text
Agent Role/Profile
      │
      ├── Skills
      ├── Runtime
      ├── Computer Use (opcional)
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

## 4. Computer Use Runtime

Computer Use é uma capacidade/runtime especializado em operar interfaces gráficas reais por mouse, teclado, tela e/ou acessibilidade.

Exemplos de implementação candidata:

- [Agent S](https://github.com/simular-ai/Agent-S) — framework open-source de computer use multiplataforma;
- outros backends de computer use podem ser adicionados futuramente.

Agent S é **uma implementação possível**, não uma dependência obrigatória do Lia Studio.

O Studio deve manter o contrato abstrato para permitir trocar o backend.

Computer Use pode ser usado para:

- QA visual;
- testar menus e interfaces;
- operar ferramentas sem API;
- executar fluxos no editor/jogo;
- capturar evidências visuais.

Computer Use deve sempre respeitar as permissões da Session e pode exigir approval gate.

## 5. Role/Profile

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
Profile: Gameplay QA
Runtime: Claude Code
Skills: Unreal QA
MCP: Unreal
Computer Use: Agent S
Permissions: project + editor, no publish
```

## 6. Skill

Skill é conhecimento/instrução/workflow reutilizável.

Uma Skill pode ser usada por vários Profiles e runtimes.

Não é responsabilidade da Skill:

- autenticar provider;
- instalar runtime;
- guardar credenciais;
- conectar MCP automaticamente;
- executar operações privilegiadas sem autorização.

## 7. MCP Connection

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

## 8. Tool

Tool é uma operação concreta oferecida por um runtime ou integração.

Uma Tool deve possuir identidade própria e origem identificável.

Exemplo:

```text
Tool: unreal.get_scene
Source: Unreal MCP
```

Tools não devem ser transformadas em Agents individuais.

## 9. Provider e Model

Provider é o serviço/API que fornece capacidade de IA ou outro serviço externo.

Model é uma implementação/modelo específico quando o provider/runtime permite sua escolha.

Não assumir que todo runtime expõe provider e model separadamente. A arquitetura deve suportar runtimes que encapsulam essas escolhas.

## 10. Session

Session representa uma execução concreta.

Deve permitir rastrear:

- runtime;
- profile;
- projeto;
- tarefa;
- skills utilizadas;
- MCPs conectados;
- tools utilizadas quando disponível;
- computer-use backend quando utilizado;
- provider/model quando disponível;
- permissões efetivas;
- estado;
- saída;
- evidências;
- duração;
- erro/cancelamento.

## 11. Registry

O Studio deve possuir registries separados para:

```text
Runtime Registry
Computer Use Registry
Skill Registry
MCP Registry
Tool Registry
Provider Registry
```

Não criar um único catálogo genérico que perca a origem e o tipo da integração.

## 12. Configuração global e de projeto

### Global

```text
Runtimes
Computer Use backends
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
Computer Use permitido
Provider/model policy
Permissions
```

O projeto referencia recursos globais; não precisa duplicá-los.

## 13. Fluxo de resolução

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
Computer Use (se necessário)
 ↓
Permissions
 ↓
Session
```

Se não houver capacidade suficiente, a tarefa deve parar ou solicitar intervenção, em vez de inventar uma ferramenta.

## 14. Segurança

Credenciais devem ser fornecidas apenas para a integração/sessão que precisa delas.

Computer Use é uma capacidade de alto impacto: ações de shell, arquivos, instalações, publicação ou outras operações destrutivas devem permanecer atrás das políticas de permissão e approval gates.

Nunca encaminhar automaticamente todo o ambiente do processo para um runtime.

Nenhum segredo deve aparecer em:

- Skills;
- commits;
- logs;
- relatórios;
- evidências;
- UI.

## 15. Extensibilidade

Novos runtimes, providers, MCPs, computer-use backends e engines devem ser adicionáveis sem alterar o núcleo da pipeline.

A implementação inicial pode ser pequena, mas os contratos devem permitir expansão.

## 16. Regra para implementação

> **Primeiro separar as responsabilidades; depois adicionar integrações reais.**
>
> A implementação Alpha pode utilizar execução simulada, desde que preserve os mesmos contratos que serão usados pela execução real.
