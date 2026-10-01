# Skills da Lia Studio

Convenção canônica das skills: **`.agents/skills/<id-da-skill>/`**, em formato
compatível com Agent Skills (cada skill tem um `SKILL.md` com metadados simples e,
quando necessário, pastas `templates/` e `references/`).

- `.agents/skills/` é a fonte mantida. Se houver necessidade de uma cópia específica
  para outra ferramenta (por exemplo `.claude/skills/`), ela deve ser gerada a partir
  desta fonte e mantida em sincronia, sem divergir.
- Cada skill tem **uma** responsabilidade clara e aponta para as outras quando precisa.

## Skills disponíveis

- `lia-game-project-bootstrap` — Etapa 0: preparar o jogo (documental, sem gameplay).
- `lia-module-planning` — planejar módulos, tarefas, aceite e dependências.
- `lia-task-handoff` — transferir trabalho com limites e evidências.
- `lia-project-resume` — retomar o projeto a partir dos registros locais.

Todas são instruções locais revisáveis pelo Dev, independentes de um provedor.
A biblioteca do Studio permite consultá-las, mas ainda não as aplica por um runtime.
