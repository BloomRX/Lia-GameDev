# Guia rápido do Dev — Lia GameDev (alpha)

Este guia cobre os fluxos principais pela interface. Não exige conta externa.

## 1. Iniciar
```bash
python run.py
```
Abra `http://localhost:8080`. Tela inicial mostra projetos recentes, estado e próximo passo.

## 2. Criar e preparar um projeto (Etapa 0)
1. Clique **+ Novo projeto**, dê um nome e (opcional) uma pasta local.
2. Na aba **Etapa 0**, descreva a ideia em uma frase. Os demais campos são opcionais:
   o que não for preenchido vira `[em aberto]`.
3. Clique **Gerar documentos da Etapa 0**. São criados `PROJECT_BRIEF`, `GDD`,
   `SCOPE`, `DECISIONS`, `REFERENCIAS` — nenhum código de jogo é escrito.
4. Aba **Documentos**: edite qualquer arquivo Markdown livremente e salve.

## 3. Planejar
- Aba **Plano**: crie módulos (nome, descrição, critérios de aceite) e tarefas.
- Cada tarefa tem objetivo, arquivos envolvidos, permissões e como verificar.

## 4. Executar (simulado)
- Aba **Execução**: para cada tarefa, **Aprovar e simular execução** mostra a
  proposta e um resultado **SIMULADO** (sem agente/engine reais, sem chamadas).

## 5. QA / Playtest
- Aba **QA**: registre verificações com ferramenta, comando, data, evidência e
  resultado (`planejado` · `executado` · `aprovado_dev` · `falhou`).

## 6. Release
- Aba **Release**: checklist, créditos/licenças e notas de versão. **Nada é publicado.**

## 7. Conflitos
- Se uma decisão `confirmado` divergir de uma `suposição`/`em aberto`, a aba
  **Visão geral** mostra um banner de conflito. O produto não escolhe silenciosamente.

## 8. Provedores / Engine
- **Configurações** (topo) e aba **Configuração** do projeto: catálogo de provedores
  e perfil de engine. Tudo **offline/simulado** nesta alpha; nenhuma chave é gravada.

## Dica
Use **Carregar exemplo demonstrativo** na inicial para percorrer todos os fluxos com
dados de exemplo, sem precisar criar conta.
