# Provedores de IA e engines — suportados, requisitos e o que é simulado

Tudo nesta alpha é **offline e simulado**. Nenhuma integração real foi executada.

## Provedores de IA (catálogo)
| ID | Tipo | Requer | Custo | Dados | Estado |
|---|---|---|---|---|---|
| local-ollama | local | Ollama no PC (Windows 10+) | Grátis (hardware) | Nenhum dado sai | não conectado / simulado |
| cloud-gemini | nuvem | Conta Google + chave do Dev | Faixa gratuita variável | Conteúdo pode sair | não conectado / simulado |
| cloud-openrouter | nuvem | Conta + chave do Dev | Modelos gratuitos sujeitos a limite | Conteúdo pode sair | não conectado / simulado |

- **Modos:** `offline` (padrão) · `local` · `cloud` · `combined`.
- Nenhuma chave é armazenada; nenhuma chamada é feita. Conectar fica fora desta entrega.

## Engines (perfis)
| ID | Estado | Verificado? |
|---|---|---|
| generic (agnóstico) | suportado | sim |
| godot | perfil disponível | não |
| unity | perfil disponível | não |
| monogame | perfil disponível | não |

- O núcleo não depende de engine. Adaptadores concretos são marcados `not_verified`
  até haver ambiente seguro para verificar. Não alegamos integração real com engine.

## O que está apenas simulado
- Inferência de IA (todas as rotas de provedor).
- Execução de tarefas/agentes e ferramentas de engine (`execution.simulate_execution`).
- Empacotamento Windows (executável) — arquitetura preparada, não gerado/testado aqui.
