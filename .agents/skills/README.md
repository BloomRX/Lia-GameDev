# Skills da Lia GameDev

Convenção canônica das skills: **`.agents/skills/<id-da-skill>/`**, em formato
compatível com Agent Skills (cada skill tem um `SKILL.md` com metadados simples e,
quando necessário, pastas `templates/` e `references/`).

- `.agents/skills/` é a fonte mantida. Se houver necessidade de uma cópia específica
  para outra ferramenta (por exemplo `.claude/skills/`), ela deve ser gerada a partir
  desta fonte e mantida em sincronia, sem divergir.
- Cada skill tem **uma** responsabilidade clara e aponta para as outras quando precisa.

## Estado desta slice (fundação de skills)

Implementada nesta etapa:

- `lia-game-project-bootstrap` — Etapa 0: preparar o jogo (documental, sem gameplay).

Ainda **não** criadas (planejadas para slices seguintes, conforme
`planejamento/primeira-slice-especificacao-das-skills.md`):

- `lia-module-planning` — transformar a visão aprovada em módulos/tarefas.
- `lia-task-handoff` — transferir tarefa/sessão com limites e evidências.
- `lia-project-resume` — retomar projeto a partir dos documentos técnicos.

Não houve construção de aplicativo, integração com a Lia Waifu, push para `main`,
chamadas a serviços externos/pagos ou cópia de assets de terceiros nesta etapa.
