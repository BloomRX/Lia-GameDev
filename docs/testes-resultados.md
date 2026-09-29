# Testes executados — resultados reais

Ambiente: Linux (sandbox), Python 3.x, sem dependências de terceiros. Data: 2026-09-29.

## 1. Testes de núcleo (automatizados)
Comando: `python tests/test_core.py` → **15 testes, todos OK**.

| Teste | Verifica | Resultado |
|---|---|---|
| Storage: create/list/get | criação e leitura de projeto | OK |
| Storage: docs/structured | ler/escrever Markdown e JSON | OK |
| Storage: archive/reopen/delete | arquivar, reabrir e excluir (exige `confirm`) | OK |
| Storage: path traversal | escrita em `../evil.md` bloqueada | OK |
| Storage: export | exportação de projeto | OK |
| Bootstrap: ideia incompleta | 5 docs gerados; nada `confirmado` inventado; lacunas `em aberto` | OK |
| Bootstrap: ideia completa | público/plataforma viram `confirmado` | OK |
| Conflicts: confirmado vs suposição | detecta conflito de plataforma | OK |
| Conflicts: sem falso positivo | vazio não gera conflito | OK |
| Planning: módulo/tarefa/resumo | cria, atualiza status, resume | OK |
| QA: registro | adiciona verificação | OK |
| Release: defaults | checklist e `published=false` | OK |
| Providers: simulado | catálogo `simulated` e `not_connected`; runtime não conectado | OK |
| Engines: generic verificado | perfil definido; godot não verificado | OK |
| Skill reuse: templates | skill existe e templates presentes | OK |

## 2. Teste de API ponta a ponta (manual, via curl)
Fluxo executado e observado: criar projeto → bootstrap com ideia incompleta →
listar decisões (todas `em aberto`) → inserir decisão conflitante (plataforma
`confirmado` mobile + `suposição` PC) → `GET /conflicts` retorna o conflito →
criar módulo + tarefa → `POST .../execute` retorna `simulated=true` → registrar QA
→ `GET /release` retorna `published=false` com 6 itens de checklist → `POST /api/example`
cria projeto de exemplo → `/` serve o HTML da interface. **Todos os passos OK.**

## 3. Walkthrough de interface (manual)
- Abrir `http://localhost:8080` → tela inicial com botões Novo / Exemplo.
- "Carregar exemplo demonstrativo" popula projeto com docs, módulo e tarefa.
- Navegar pelas abas (Visão geral, Etapa 0, Documentos, Plano, Execução, QA, Release,
  Configuração) sem erro; editar documento e salvar persiste.
- Aba Execução mostra banner "Simulado" e resultado rotulado como SIMULADO.
- Aba Configurações lista provedores com banner offline/simulado.

## O que NÃO foi testado
- Empacotamento/execução como `.exe` Windows (ambiente Linux).
- Integração real com engine ou provedor de IA (fora do escopo da alpha; tudo simulado).
- UI automatizada (não há suíte de browser neste ambiente) — usamos walkthrough manual.
