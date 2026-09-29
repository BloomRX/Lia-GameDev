# Armazenamento de dados, backup/exportação e privacidade

## Onde os dados ficam
- Pasta padrão: `~/LiaGameDevProjects` (configurável via env `LIA_PROJECTS_DIR`).
- Cada projeto: `<pasta>/<slug>-<id>/` contendo:
  - Markdown editável: `PROJECT_BRIEF.md`, `GDD.md`, `SCOPE.md`, `REFERENCIAS.md`,
    `DECISIONS.md`, `MODULE_INDEX.md`, `ASSET_REGISTER.md`, `RELEASE.md`, `JOURNAL.md`.
  - JSON estruturado: `meta.json`, `decisions.json`, `modules.json`, `qa.json`,
    `assets.json`, `release.json`.
- Índice global: `<pasta>/lia_index.json`. Configurações de app: `<pasta>/lia_settings.json`.

## Formato
- Tudo é texto (Markdown/JSON) — legível, versionável e exportável. Nenhum binário de
  projeto é gerado pelo app nesta alpha.

## Backup / exportação
- `Storage.export_project(project_id, dest_dir)` copia a pasta do projeto para outro
  local. Disponível via API (`GET /api/projects/<id>/export` — a ser exposto na UI).
- Git/sync/nuvem são **opcionais** e controlados pelo Dev; nada é enviado automaticamente.

## Privacidade
- Nenhum dado de projeto sai da máquina por padrão.
- Provedores de IA ficam offline; se um dia conectados, o modo nuvem informará que o
  conteúdo da tarefa pode ser enviado ao provedor, e exigirá chave do próprio Dev.
- Nenhuma chave/token é armazenada em texto puro e nenhuma chamada paga é feita.

## Limpeza
- Exclusão de projeto é destrutiva e exige confirmação explícita (`confirm=true`).
  Não há lixeira automática — o Dev decide.
