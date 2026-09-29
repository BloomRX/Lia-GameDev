# Lia-GameDev

Ferramenta da Lia para ajudar uma pessoa — inclusive sem experiência de programação —
a preparar, construir, testar, documentar e retomar projetos de jogos com agentes
supervisionáveis, sem substituir a direção criativa do Dev.

Este repositório está em construção por slices. O estado atual traz a **fundação de
skills** (procedimentos documentais/testáveis), não o aplicativo completo.

## O que existe agora

- `planejamento/` — documentos de visão, inventário de skills e esta primeira slice.
- `.agents/skills/lia-game-project-bootstrap/` — a skill da **Etapa 0**: capta a
  ideia, faz perguntas de alto impacto, registra decisões/suposições e prepara os
  documentos iniciais do jogo **sem implementar gameplay**.

As demais skills (planejamento de módulos, handoff, retomada) e o aplicativo Windows
são planejadas para slices seguintes e **não** foram criadas ainda.

## Licença e marca

- Código e documentação próprios: **MIT** (ver `LICENSE`).
- Nome, personagem, logo e identidade visual da Lia: política de marca **separada**,
  não licenciada pela MIT para apropriação ou representação como produto oficial
  (ver `THIRD_PARTY_NOTICES.md`).

## Como usar por enquanto

As skills ficam em `.agents/skills/` (formato compatível com Agent Skills). Elas são
procedimentos em Markdown que um agente de código pode seguir; a interface visual
(compatível com Windows, integrável futuramente à Lia Waifu) vem em fase posterior.
