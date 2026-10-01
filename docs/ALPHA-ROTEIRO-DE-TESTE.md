# Lia Studio — Alpha offline: roteiro de teste de uso

> **Situação (2026-10-01): pronta para o Dev experimentar, não aceita/validada no Windows.**
> O smoke automatizado roda em diretórios temporários, mas este roteiro precisa ser executado e registrado por uma pessoa. Nenhum resultado abaixo está marcado como aprovado.

## 1. Limite desta Alpha

O Studio funciona isolado do Lia Project. Projeto, documentos, planejamento, gates, QA manual, evidência local, histórico de Session simulada, handoff e exportação são fluxos locais. A execução da tarefa **não escreve código de jogo**, não invoca Agent/Provider/Engine/MCP/Computer Use e não valida resultado. Multi-Agent é contrato opcional, **desligado** na Alpha. Preferência `cloud` é apenas preferência offline; não conecta nem gera gasto. `.exe`/janela desktop própria e compatibilidade Windows ainda não foram produzidos/verificados.

## 2. Preparação

1. Em uma cópia do repositório, instale Python 3.9+; Node.js é opcional para a regressão JS. Não são necessárias chaves, contas, `pip install` ou rede.
2. Em terminal, execute `python verify_alpha.py` (no Windows, `py verify_alpha.py` também pode funcionar). Guarde a saída e a versão do Python. Se Node.js não existir, a UI será marcada como **não executada**, não aprovada.
3. Escolha uma pasta **nova e temporária** para projetos. Defina `LIA_PROJECTS_DIR` para ela e inicie `python run.py`; abra `http://127.0.0.1:8080`. Não exponha `HOST=0.0.0.0` numa rede não confiável: a API não autentica usuários.
4. Faça o roteiro abaixo **em um projeto descartável**, não com arquivos importantes. Quando for testar falha/recuperação, faça primeiro exportação/cópia e nunca apague dados reais.

> Os testes automatizados usam links simbólicos para testar isolamento. No Windows, criar symlink pode exigir Modo de Desenvolvedor ou privilégio administrativo; sem isso, os testes específicos são **pulados**, não aprovados. Anote quantos foram pulados. Teste de uso da interface não exige criar symlink.

## 3. Percurso funcional (preencha após executar)

| Passo | Ação | Comportamento esperado | Resultado / notas do Dev |
|---|---|---|---|
| 1 | Criar projeto novo | Aparece na Home; pasta em `LIA_PROJECTS_DIR`; sem conta nem chamada externa. | Pendente |
| 2 | Gerar Etapa 0 com ideia, deixando um campo opcional vazio | Brief/GDD/Escopo/Decisões/Referências gerados; lacuna fica `[em aberto]`, não `confirmado`. | Pendente |
| 3 | Editar `GDD.md` em Documentos, salvar e recarregar | Edição persiste. A Etapa 0 não é regenerada silenciosamente; revisão de decisões ocorre na aba própria. | Pendente |
| 4 | Verificar gate em Visão geral; aprovar Preparação com nota | Só avança para MVP com docs/ideia e sem conflito; histórico registra nota e aprovação local. | Pendente |
| 5 | Criar módulo/tarefa com critérios e permissões; ver proposta | Prévia não cria Session, não escreve código nem resultado. Permissões declaradas não são concedidas. | Pendente |
| 6 | Aprovar simulação após ler proposta | Session `simulator` aparece; tarefa indica `simulated`, validação `not_run` e evidência `not_verified`; gate de MVP ainda bloqueado. | Pendente |
| 7 | Registrar QA como `planejado`; registrar um arquivo local pequeno como evidência | QA é relato manual; arquivo mostra hash/integridade `intact`, sem validar critério. Edite/remova o arquivo e confirme `changed`/`unavailable`. | Pendente |
| 8 | Gerar prévia do Handoff e salvar com confirmação | Menciona IDs/status de Sessions sem logs/segredos brutos; alterar Journal/plano o deixa desatualizado e requer nova prévia. | Pendente |
| 9 | Preencher preparação de Release; exportar; reabrir app | Não há build/publicação; exportação contém documentos, JSONs, Sessions, Handoff; persistência/retomada funcionam após reinício. | Pendente |
| 10 | Abrir Dados → Integridade | Estado saudável sem problemas no projeto novo. Para testar recuperação, use somente cópia descartável e confirme que backup válido exige confirmação. | Pendente |

Anote sistema operacional/versão, Python/Node, horário, passos realmente feitos, problemas e capturas **sem segredos**. O Dev decide se a Alpha foi aceita; não inferir aceite dos testes automatizados.

## 4. Verificação automatizada já disponível

`python verify_alpha.py` executa a suíte Python (inclui um smoke HTTP de criação → Etapa 0 → estágio → plano → simulação → QA/evidência → handoff → release → exportação → reload) e compilação sintática. Com Node presente, executa regressão JS e verificação sintática. O teste é offline, usa diretórios temporários, **não** substitui navegador real nem aceite Windows.

## 5. O que fica para depois do teste da Alpha

- Runtime de Agent/Coordinator/Worker real, multiagente, Skill aplicada por runtime, Provider/Model conectado, MCP/Tool e Computer Use.
- Adapter Unreal/outra engine, build de jogo, QA automático e prova de resultado real.
- Bridge opcional com Lia Project, custo/credenciais, desktop `.exe`, instalação e testes de empacotamento Windows.
- Decisões ainda abertas em `DECISOES-PENDENTES-INTEGRACOES.md`; D4 Multi-Agent tem contrato, mas fica desligado nesta Alpha.
