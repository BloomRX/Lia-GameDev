# Matriz de funcionalidades — Lia Studio (alpha, 2026-09-29)

Legenda: ✅ implementado e testado · 🟡 implementado, não testado · 🔶 parcial ·
🟣 simulado · ⬜ não implementado · 🚫 bloqueado

## A. Início e projetos
| Item | Estado | Notas |
|---|---|---|
| Listar projetos recentes com estado/próximo passo | ✅ | testado (API + UI) |
| Criar / renomear / arquivar / reabrir | ✅ | excluir exige confirmação |
| Escolha visível de local e formato exportável | ✅ | `LIA_PROJECTS_DIR` + `export_project` |
| Confirmação antes de exclusão destrutiva | ✅ | `confirm=true` obrigatório |

## B. Preparação — Etapa 0
| Item | Estado | Notas |
|---|---|---|
| Conversa guiada sem vocabulário técnico | ✅ | wizard de 8 campos |
| Perguntas adaptativas de alto impacto | 🟡 | campos-chave; sem ramificação dinâmica |
| Gerar documentos coerentes (brief/GDD/escopo/dec/ref) | ✅ | reutiliza skill; testado |
| Rótulos confirmado/proposto/suposição/em aberto | ✅ | testado |
| Referências com origem/permissão | ✅ | tabela em REFERENCIAS |
| Sugerir vertical slice sem virar limite | ✅ | texto explícito |
| Não escrever gameplay | ✅ | verificado (nenhum código) |
| Reutilizar skill existente (não duplicar) | ✅ | `templates_loader` |

## C. Plano, tarefas e continuidade
| Item | Estado | Notas |
|---|---|---|
| Módulos/tarefas com aceite/dependências | ✅ | testado |
| Andamento, bloqueios, pendências, evidências | 🟡 | resumo em Visão geral |
| Journal/handoff/resumo de retomada | ✅ | JOURNAL + `build_resume` |
| Pausar/retomar por arquivos persistidos | ✅ | reload reconstrói estado |
| Handoff/retomada como skill | 🔶 | flujo de retomada implementado no produto; skills `lia-task-handoff`/`lia-project-resume` ainda não criadas |

## D. Execução assistida
| Item | Estado | Notas |
|---|---|---|
| Escolher tarefa, ver objetivo/permissões/verificar | ✅ | formulário de tarefa |
| Separar proposta/aprovação/execução | ✅ | botão "aprovar e simular" |
| Diffs/resultado (arquivos) | 🟣 | simulado (sem agente real) |
| Pausa/cancelamento/retomada | 🟡 | status de tarefa |
| Permissões claras + confirmação destrutiva | ✅ | modelo de `permissions` |
| Não alegar "feito" se só sugestão | ✅ | banner SIMULADO |

## E. IA e provedores
| Item | Estado | Notas |
|---|---|---|
| Tela de configuração simples + estado | ✅ | modo + catálogo |
| Abstração local/nuvem + seleção por tarefa | 🟡 | modelo de modo; seleção por tarefa não UI-plena |
| Nunca embutir chaves; storage seguro | ✅ | nenhuma chave existe/é pedida |
| Integração real só se segura/testável | 🟣 | tudo simulado/offline |
| Não instalar/modelos/contas/pagamento | ✅ | respeitado |
| Validar preço/quota com fonte/data | ✅ | catálogo com fonte |

## F. Engines, assets, QA e entrega
| Item | Estado | Notas |
|---|---|---|
| Perfil/config de engine (genérico + adaptadores) | 🟡 | godot/unity/monogame não verificados |
| Referências/registro de assets + revisão humana | 🟡 | `ASSET_REGISTER` previsto; UI mínima |
| QA/playtest com ferramenta/comando/evidência | ✅ | testado (API) |
| Preparação de build/release (checklist/créditos/notas) | ✅ | sem publicação |
| Caminho básico sem serviço pago | ✅ | app roda offline |

## G. Interface e avaliação
| Item | Estado | Notas |
|---|---|---|
| Preview navegável | ✅ | servidor local + SPA |
| Layout claro/responsivo/estados vazios/erro | ✅ | CSS responsivo |
| Dados demonstrativos identificados | ✅ | "exemplo demonstrativo" |
| Carregar exemplo sem conta externa | ✅ | botão exemplo |
| Sem logo/arte oficial inventada | ✅ | placeholder próprio |
| Mesma camada visual no preview browser | ✅ | servidor serve a SPA |

## Pendências priorizadas (próximas laps)
1. Concretizar `lia-module-planning`, `lia-task-handoff`, `lia-project-resume` como skills.
2. UI de export e de handoff explícito.
3. Empacotamento Windows real (Tauri/PyInstaller) e teste do `.exe`.
4. Conectar um provedor local (Ollama) atrás de consentimento e storage seguro de chave.
5. Adaptadores reais de engine com verificação em ambiente seguro.
6. Suíte de UI automatizada (ex.: Playwright) para substituir walkthrough manual.
