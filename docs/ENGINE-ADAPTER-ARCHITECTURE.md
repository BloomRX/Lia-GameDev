# Lia Studio — Engine Adapter Architecture

> **Objetivo:** manter o Lia Studio agnóstico de engine e permitir integrações específicas sem transformar o produto em uma ferramenta exclusiva de Unreal.

## 1. Princípio

O Studio deve conhecer um contrato comum de desenvolvimento de jogos e delegar detalhes específicos para adapters.

```text
Lia Studio Core
      │
      ├── Unreal Adapter
      ├── Unity Adapter
      ├── Godot Adapter
      └── futuros adapters
```

O MVP pode priorizar Unreal sem codificar a arquitetura como Unreal-only.

---

## 2. Responsabilidades do Adapter

Um Engine Adapter pode fornecer, quando suportado:

- detecção do projeto;
- identificação de versão;
- localização da instalação;
- abertura/fechamento do editor;
- descoberta de módulos/targets;
- build;
- testes;
- logs;
- execução de comandos da engine;
- integração com editor;
- descoberta de assets;
- diagnóstico;
- capabilities.

---

## 3. Contrato conceitual

```text
EngineAdapter
  ├── detect()
  ├── inspect()
  ├── launch()
  ├── close()
  ├── build()
  ├── test()
  ├── collectLogs()
  └── capabilities()
```

Os nomes exatos de classes/métodos ficam para a implementação.

---

## 4. Capabilities

Nem toda engine suporta todas as operações.

Exemplo:

```text
Unreal
  ✓ editor automation
  ✓ C++ build
  ✓ Blueprint tooling
  ✓ automation tests

Outra engine
  ✓ project detection
  ✓ build
  ? editor automation
```

A UI deve esconder ou desabilitar ações não suportadas em vez de fingir compatibilidade.

---

## 5. Engine Context

O Project deve registrar a engine e o adapter ativo.

```text
Project
  Engine
    id: unreal
    version: ...
    adapter: UnrealAdapter
```

Não duplicar detalhes da engine em cada Task.

---

## 6. Agents e Engine

O Agent Runtime não deve ser acoplado diretamente a uma engine específica.

```text
Gameplay Role
    ↓
Runtime
    ↓
Engine Adapter + MCP + Skills
```

Exemplo:

```text
Claude Code
  + Unreal Gameplay Skill
  + Unreal Adapter
  + Unreal MCP
```

O mesmo Runtime pode trabalhar em outro projeto com outro adapter.

---

## 7. MCP versus Adapter

Não confundir:

### Engine Adapter

Integração nativa do Lia Studio com a engine.

### MCP

Integração fornecida por um servidor MCP para um Agent/runtime.

Podem coexistir.

```text
Lia Studio Core
   └── Unreal Adapter

Agent Runtime
   └── Unreal MCP
```

O Adapter não precisa substituir o MCP e o MCP não deve ser a única forma de o Studio conhecer a engine.

---

## 8. Build e execução

O Adapter deve oferecer operações padronizadas quando possível:

```text
prepare
build
test
package
run
collect result
```

A pipeline do Studio pode então permanecer engine-agnostic:

```text
PREPARAÇÃO → MVP JOGÁVEL → PRODUÇÃO → FINALIZAÇÃO
```

Enquanto a implementação concreta muda por engine.

---

## 9. Versionamento

O Adapter deve identificar compatibilidade de versão.

Exemplo:

```text
Unreal Adapter
  supports: 5.x

Project
  Unreal: 5.8.x
```

Se houver incompatibilidade, informar antes da execução.

---

## 10. Regra final

> **Unreal pode ser a primeira engine do Lia Studio sem ser a arquitetura do Lia Studio.**

Toda integração específica deve ficar atrás de um contrato que permita adicionar outra engine sem reescrever Home, Projects, Skills, Agents ou Pipeline.
