"use strict";

/* ============================================================
   Lia Studio — SPA local (vanilla JS, sem build)
   ============================================================ */

const view = document.getElementById("view");
const toastEl = document.getElementById("toast");

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function pill(label) {
  const cls = String(label).toLowerCase().replace(/[^a-z]/g, ".");
  return `<span class="pill ${esc(cls)}">${esc(label)}</span>`;
}
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => (toastEl.hidden = true), 2600);
}
async function api(method, path, body) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  let data = null;
  try { data = await res.json(); } catch (e) { /* no json */ }
  if (!res.ok) throw new Error((data && data.error) || `HTTP ${res.status}`);
  return data;
}

/* ----------------------- routing ----------------------- */
const routes = {
  home: renderHome,
  config: renderGlobalConfig,
  skills: renderSkills,
  recovery: renderRecovery,
  project: renderProject,
};

function navigate() {
  const hash = location.hash.replace(/^#\//, "");
  const parts = hash.split("/").filter(Boolean);
  view.innerHTML = `<div class="loading">Carregando…</div>`;
  if (parts.length === 0) return renderHome();
  const [first, ...rest] = parts;
  if (first === "home") return renderHome();
  if (first === "config") return renderGlobalConfig();
  if (first === "skills") return renderSkills(rest[0]);
  if (first === "recovery") return renderRecovery();
  if (first === "project") return renderProject(rest[0], rest[1] || "overview");
  return renderHome();
}
window.addEventListener("hashchange", navigate);

/* ----------------------- HOME ----------------------- */
async function renderHome() {
  let projects = [];
  try { projects = (await api("GET", "/api/projects")).projects; }
  catch (e) { view.innerHTML = `<div class="banner danger">Erro ao carregar projetos: ${esc(e.message)}. Os dados não foram recriados.</div><a class="btn" href="#/recovery">Verificar integridade dos dados</a>`; return; }

  const cards = projects.length
    ? `<div class="grid">${projects.map(p => projectCard(p)).join("")}</div>`
    : `<div class="empty">Nenhum projeto ainda. Crie o primeiro ou carregue um exemplo demonstrativo.</div>`;

  view.innerHTML = `
    <h1>Início — seus projetos</h1>
    <div class="banner info">Tudo é salvo localmente no seu computador. Nenhuma conta ou nuvem é obrigatória. Provedores de IA ficam <b>desligados</b> e simulados até você conectar (fora desta alpha).</div>
    <div class="row" style="margin:14px 0">
      <button onclick="showNewProject()">+ Novo projeto</button>
      <a class="btn" href="#/skills">Explorar Skills</a>
      <button class="ghost" onclick="loadExample()">Carregar exemplo demonstrativo</button>
    </div>
    <div id="newproj" hidden>
      <div class="card">
        <h3>Criar projeto</h3>
        <label>Nome</label><input id="np-name" type="text" placeholder="Ex.: Minha aventura" />
        <label>Pasta local (opcional — deixe em branco para usar a pasta padrão)</label><input id="np-loc" type="text" placeholder="deixe em branco para a pasta configurada" />
        <div class="row" style="margin-top:12px">
          <button onclick="createProject()">Criar</button>
          <button class="ghost" onclick="hideNewProject()">Cancelar</button>
        </div>
      </div>
    </div>
    <h2>Projetos</h2>
    ${cards}
  `;
}

function projectCard(p) {
  return `<div class="card">
    <h3>${esc(p.name)}</h3>
    <div class="meta">${pill(p.status)} · etapa: ${esc(STAGE_LABELS[p.stage] || "Preparação")}</div>
    <div class="meta">Próximo passo: ${esc(p.next_step || "—")}</div>
    <div class="actions">
      <a class="btn small" href="#/project/${esc(p.id)}">Abrir</a>
      <button class="ghost small" onclick="archiveProject('${esc(p.id)}')">${p.archived ? "Reabrir" : "Arquivar"}</button>
      <button class="danger small" onclick="deleteProject('${esc(p.id)}')">Excluir</button>
    </div>
  </div>`;
}
function showNewProject() { document.getElementById("newproj").hidden = false; }
function hideNewProject() { document.getElementById("newproj").hidden = true; }
async function createProject() {
  const name = document.getElementById("np-name").value.trim();
  const loc = document.getElementById("np-loc").value.trim();
  if (!name) return toast("Informe um nome.");
  try {
    const p = await api("POST", "/api/projects", { name, location: loc || undefined });
    toast("Projeto criado.");
    location.hash = `#/project/${p.id}/bootstrap`;
  } catch (e) { toast("Erro: " + e.message); }
}
async function loadExample() {
  try { const p = await api("POST", "/api/example", {}); toast("Exemplo carregado."); location.hash = `#/project/${p.id}/overview`; }
  catch (e) { toast("Erro: " + e.message); }
}
async function archiveProject(id) {
  try { await api("POST", `/api/projects/${id}/archive`); renderHome(); } catch (e) { toast(e.message); }
}
async function deleteProject(id) {
  if (!confirm("Excluir este projeto e todos os seus documentos? Esta ação é destrutiva e não pode ser desfeita.")) return;
  try { await api("DELETE", `/api/projects/${id}?confirm=true`); toast("Projeto excluído."); renderHome(); }
  catch (e) { toast(e.message); }
}

/* ----------------------- SKILLS (workspace global, independente do projeto) ----------------------- */
async function renderSkills(selected) {
  try {
    const { skills } = await api("GET", "/api/skills");
    const active = selected || (skills.length && skills[0].id);
    const item = active ? await api("GET", `/api/skills/${encodeURIComponent(active)}`) : null;
    const nav = skills.map(skill => `<a href="#/skills/${esc(skill.id)}" class="${skill.id===active ? "active" : ""}">${esc(skill.title)}</a>`).join("");
    view.innerHTML = `<h1>Biblioteca de Skills</h1>
      <div class="banner info">Conhecimento reutilizável do Studio — não são projetos de jogo. Instruções locais, sem agente ou serviço conectado.</div>
      <div class="layout"><nav class="side" aria-label="Skills"><b>Biblioteca</b>${nav || "<p>Nenhuma skill instalada.</p>"}</nav>
      <section><h2>${item ? esc(item.title) : "Selecione uma skill"}</h2>
      <p class="muted">${item ? esc(item.id) : ""} · leitura local · aplicar requer revisão humana</p>
      ${item ? `<pre class="skill-content">${esc(item.content)}</pre>` : ""}</section></div>`;
  } catch (e) { view.innerHTML = `<div class="banner danger">Erro ao carregar Skills: ${esc(e.message)}</div>`; }
}

/* ----------------------- INTEGRIDADE DE DADOS ----------------------- */
async function renderRecovery() {
  try {
    const { issues } = await api("GET", "/api/storage/health");
    const items = issues.length ? issues.map((issue, i) => `<div class="card">
      <h3>${esc(issue.name)} ${issue.project_id ? `(projeto ${esc(issue.project_id)})` : "(global)"}</h3>
      <p>${esc(issue.message)}</p>
      <p>Backup válido: <b>${issue.backup_available ? "disponível" : "não disponível"}</b>.</p>
      ${issue.backup_available ? `<button class="recover-btn" data-i="${i}">Restaurar backup</button>`
        : '<p class="muted">Não altere este arquivo pelo app; faça uma cópia e revise manualmente.</p>'}
    </div>`).join("") : '<div class="banner ok">Nenhum problema de integridade JSON/Markdown detectado.</div>';
    view.innerHTML = `<h1>Integridade dos dados</h1>
      <div class="banner warn">Para JSON, backups contêm a versão anterior e podem perder a última alteração; restauração exige confirmação. Markdown inválido, links simbólicos ou pasta ausente exigem revisão manual — não há restauração automática desses itens. Backups não substituem cópia externa.</div>
      ${items}`;
    document.querySelectorAll("#view .recover-btn").forEach(button => {
      button.onclick = async () => {
        const issue = issues[Number(button.dataset.i)];
        if (!confirm(`Restaurar ${issue.name} a partir do backup? O arquivo danificado será preservado; alterações recentes podem ser perdidas.`)) return;
        try {
          await api("POST", "/api/storage/recover", {
            name: issue.name, project_id: issue.project_id, confirm: true,
          });
          toast("Backup restaurado. Revise os dados recuperados.");
          renderRecovery();
        } catch (e) { toast("Recuperação falhou: " + e.message); }
      };
    });
  } catch (e) { view.innerHTML = `<div class="banner danger">Não foi possível verificar dados: ${esc(e.message)}</div>`; }
}

/* ----------------------- PROJECT ----------------------- */
const STAGE_LABELS = { preparation: "Preparação", mvp: "MVP jogável", production: "Produção", delivery: "Entrega" };
const STAGE_ORDER = Object.keys(STAGE_LABELS);

const SECTIONS = [
  ["overview", "Visão geral"],
  ["bootstrap", "Etapa 0"],
  ["decisions", "Decisões"],
  ["docs", "Documentos"],
  ["plan", "Plano"],
  ["handoff", "Handoff"],
  ["execute", "Execução"],
  ["qa", "QA / Playtest"],
  ["evidence", "Evidências"],
  ["release", "Release"],
  ["config", "Configuração"],
];

async function renderProject(pid, section) {
  let data;
  try { data = await api("GET", `/api/projects/${pid}`); }
  catch (e) { view.innerHTML = `<div class="banner danger">Erro ao abrir projeto: ${esc(e.message)}</div><a class="btn" href="#/recovery">Verificar integridade dos dados</a>`; return; }
  const entry = data.entry;
  const side = `<div class="side">
    <div class="proj-name">${esc(entry.name)}</div>
    <div class="meta">${pill(entry.status)} · ${esc(data.stage_gate.stage_label)} · saúde: ${esc(data.health)}</div>
    ${SECTIONS.map(([s, label]) => `<a href="#/project/${esc(pid)}/${s}" class="${section === s ? "active" : ""}">${label}</a>`).join("")}
    <hr/>
    <a class="ghost btn small" href="#/home">← Início</a>
  </div>`;

  let content = "";
  if (section === "overview") content = await projectOverview(pid, data);
  else if (section === "bootstrap") content = await projectBootstrap(pid, data);
  else if (section === "docs") content = await projectDocs(pid, data);
  else if (section === "decisions") content = projectDecisions(pid, data);
  else if (section === "plan") content = await projectPlan(pid, data);
  else if (section === "handoff") content = await projectHandoff(pid, data);
  else if (section === "execute") content = await projectExecute(pid, data);
  else if (section === "qa") content = await projectQa(pid, data);
  else if (section === "evidence") content = await projectEvidence(pid, data);
  else if (section === "release") content = await projectRelease(pid, data);
  else if (section === "config") content = await projectConfig(pid, data);

  view.innerHTML = `<div class="layout">${side}<div>${renderStagePipeline(data.stage_gate)}${content}</div></div>`;
  if (section === "docs") wireDocs(pid, data.docs);
  if (section === "decisions") wireDecisions(pid, data);
  if (section === "plan") wirePlan(pid, data.modules);
  if (section === "handoff") wireHandoff(pid, data.modules, data.resume?.handoff);
  if (section === "execute") wireExecute(pid, data.modules);
  if (section === "qa") wireQa(pid);
  if (section === "evidence") wireEvidence(pid);
  if (section === "release") wireRelease(pid, data.release);
  if (section === "config") wireConfig(pid, data);
}

/* ----- overview ----- */
function renderStagePipeline(gate) {
  const stageIndex = STAGE_ORDER.indexOf(gate.stage);
  const pipeline = STAGE_ORDER.map((stage, index) =>
    `<span class="stage-step ${index===stageIndex ? "current" : index<stageIndex ? "completed" : "future"}" ${index===stageIndex ? 'aria-current="step"' : ""}>${index + 1}. ${esc(STAGE_LABELS[stage])}</span>`
  ).join("");
  return `<nav class="stage-pipeline" aria-label="Etapas do projeto">${pipeline}</nav>`;
}

function projectOverview(pid, data) {
  const r = data.resume || {};
  const gate = data.stage_gate;
  const blockers = gate.blockers.length
    ? `<ul class="clean">${gate.blockers.map(b => `<li>${esc(b.message)}</li>`).join("")}</ul>`
    : "";
  const approval = gate.status === "ready"
    ? `<label for="stage-note">Motivo da aprovação do Dev</label>
       <input id="stage-note" type="text" placeholder="Por que esta etapa pode avançar?" />
       <button onclick="advanceStage('${esc(pid)}','${esc(gate.next_stage)}')">Revisar e aprovar avanço para ${esc(gate.next_stage_label)}</button>`
    : gate.status === "complete" ? `<p class="muted">Última etapa. Publicação externa nunca é automática.</p>`
      : `<p class="muted">Gate bloqueado: resolva as pendências acima. Simulações não contam como implementação.</p>`;
  const history = gate.history.length
    ? `<h3>Decisões de avanço</h3><ul class="clean">${gate.history.map(h =>
        `<li>${esc(STAGE_LABELS[h.from])} → ${esc(STAGE_LABELS[h.to])}: ${esc(h.note)} <span class="muted">(${esc(h.at)})</span></li>`
      ).join("")}</ul>` : "";
  const conflicts = data.conflicts || [];
  const depRows = Object.entries(data.module_blockers||{}).flatMap(([id, items]) =>
    items.filter(b=>b.code === "DEPENDENCY_NOT_READY" || b.code === "DEPENDENCY_INVALID")
      .map(b=>`<li>${esc(id)}: ${esc(b.message)}</li>`));
  const dependencyBanner = depRows.length ? `<div class="banner warn"><b>Dependências de módulos:</b><ul class="clean">${depRows.join("")}</ul></div>` : "";
  const conflictBanner = conflicts.length
    ? `<div class="banner danger"><b>Conflito detectado:</b> há decisão confirmada em desacordo com suposição/em-aberto. O produto NÃO escolheu silenciosamente — revise na aba <a href="#/project/${esc(pid)}/decisions">Decisões</a>.</div>`
    : "";
  return `
    <h1>${esc(data.entry.name)}</h1>
    <div class="card"><h2>Gate: ${esc(gate.stage_label)} → ${esc(gate.next_stage_label || "fim")}</h2>
      <p>Estado: ${pill(gate.status)} · saúde: ${esc(data.health)}. O avanço precisa de aprovação explícita do Dev.</p>
      ${blockers}${approval}${history}</div>
    ${conflictBanner}${dependencyBanner}
    <div class="card"><h3>Backup manual</h3><p>Copie este projeto e o estado atual do índice para uma nova pasta no computador que executa o Studio.</p>
      <label for="export-dest">Pasta de destino absoluta no computador que executa o Studio</label>
      <input id="export-dest" type="text" autocomplete="off" spellcheck="false" placeholder="Ex.: C:/Backup/LiaStudio ou /home/user/backup" />
      <button class="ghost" onclick="exportProject('${esc(pid)}')">Exportar projeto</button>
      <p id="export-result" class="muted" aria-live="polite"></p></div>
    <div class="banner info"><b>Próximo passo:</b> ${esc(data.entry.next_step || "—")}</div>
    <div class="card"><h3>Resumo ativo</h3><p>${esc(r.summary || "—")}</p>
      <p class="muted">Atividade atual: ${esc(r.phase || "?")}</p>
      <p>Handoff: ${r.handoff && r.handoff.exists ? r.handoff.stale === true ? "desatualizado — revise antes de usar" : r.handoff.stale === false ? "gerado e sem mudanças detectadas nas fontes" : "manual; atualidade não verificada" : "não gerado"}. <a href="#/project/${esc(pid)}/handoff">Abrir Handoff</a></p></div>
    <h2>Tarefas abertas (${ (r.open_tasks||[]).length })</h2>
    ${ (r.open_tasks||[]).length ? `<ul class="clean">${r.open_tasks.map(t=>`<li>${pill(t.status)} ${esc(t.name)}</li>`).join("")}</ul>` : `<div class="empty">Nenhuma tarefa aberta.</div>` }
    <h2>Decisões em aberto/suposição (${ (r.pending_decisions||[]).length })</h2>
    ${ (r.pending_decisions||[]).length ? `<ul class="clean">${r.pending_decisions.map(d=>`<li>${pill(d.label)} <b>${esc(d.topic)}</b>: ${esc(d.value)}</li>`).join("")}</ul>` : `<div class="empty">Nenhuma.</div>` }
    <h2>Journal (cauda)</h2>
    <pre class="card" style="white-space:pre-wrap">${esc(r.journal_tail || "vazio")}</pre>
  `;
}

async function exportProject(pid) {
  const dest = document.getElementById("export-dest").value.trim();
  if (!dest) return toast("Informe uma pasta de destino absoluta antes de exportar.");
  try {
    const result = await api("POST", `/api/projects/${pid}/export`, { dest_dir: dest });
    document.getElementById("export-result").textContent = `Cópia criada em: ${result.path}. Guarde-a em local seguro.`;
    toast("Projeto exportado.");
  } catch (e) { toast("Falha na exportação: " + e.message); }
}

async function advanceStage(pid, target) {
  const note = document.getElementById("stage-note").value.trim();
  if (!note) return toast("O motivo da aprovação é obrigatório.");
  if (!confirm(`Avançar para ${STAGE_LABELS[target]}? Confirme apenas após revisar os documentos e critérios do gate.`)) return;
  try {
    await api("POST", `/api/projects/${pid}/stage`, { target, approved: true, note });
    toast("Etapa aprovada e registrada.");
    await renderProject(pid, "overview");
  } catch (e) { toast("Gate bloqueado: " + e.message); }
}

/* ----- bootstrap ----- */
function projectBootstrap(pid, data) {
  const hasBrief = data.docs.includes("PROJECT_BRIEF.md");
  if (hasBrief) {
    return `<h1>Etapa 0 — preparação do jogo</h1>
      <div class="banner ok">Etapa 0 já iniciada. Os documentos foram gerados (veja em <b>Documentos</b>). Você pode editá-los livremente.</div>
      <div class="card"><h3>Próximo</h3><p>Vá para <b>Plano</b> para transformar os documentos aprovados em módulos/tarefas.</p>
      <a class="btn" href="#/project/${esc(pid)}/plan">Ir para Plano →</a></div>`;
  }
  return `<h1>Etapa 0 — preparação do jogo</h1>
    <div class="banner info">Conversa guiada. Não exigimos vocabulário técnico e não reduzimos sua ambição. Campos não preenchidos viram <b>[em aberto]</b>. Nenhum código de jogo é escrito aqui.</div>
    <div class="card">
      <label>Ideia em uma frase *</label><input id="b-idea" type="text" placeholder="Ex.: um jogo calmo onde você cultiva ilhas flutuantes" />
      <label>Experiência pretendida (como o jogador deve se sentir)</label><input id="b-exp" type="text" placeholder="Ex.: paz, curiosidade" />
      <div class="row">
        <div><label>Público</label><input id="b-aud" type="text" placeholder="Ex.: casuais, 12+" /></div>
        <div><label>Plataforma</label><input id="b-plat" type="text" placeholder="Ex.: PC (Windows)" /></div>
      </div>
      <label>Pilares (um por linha — o que define o jogo)</label><textarea id="b-pillars" style="min-height:90px" placeholder="Exploração calma\nMistérios leves"></textarea>
      <label>Restrições conhecidas</label><input id="b-rest" type="text" placeholder="Ex.: time de 1 pessoa" />
      <label>Referências (opcional — uma por linha: nome | origem | uso)</label><textarea id="b-ref" style="min-height:70px" placeholder="Stardew Valley | ConcernedApe | loop calmo"></textarea>
      <label>Vertical slice sugerida (opcional)</label><input id="b-vs" type="text" placeholder="Demo: uma ilha, colher, um mistério" />
      <label>Engine/perfil (opcional — núcleo é agnóstico)</label><input id="b-eng" type="text" placeholder="deixe em branco" />
      <div class="row" style="margin-top:12px"><button onclick="runBootstrap('${esc(pid)}')">Gerar documentos da Etapa 0</button></div>
    </div>`;
}
async function runBootstrap(pid) {
  const refs = document.getElementById("b-ref").value.split("\n").map(l => {
    const p = l.split("|").map(s => s.trim());
    return p[0] ? { name: p[0], origin: p[1] || "", use: p[2] || "" } : null;
  }).filter(Boolean);
  const answers = {
    idea: document.getElementById("b-idea").value,
    experience: document.getElementById("b-exp").value,
    audience: document.getElementById("b-aud").value,
    platform: document.getElementById("b-plat").value,
    pillars: document.getElementById("b-pillars").value.split("\n").map(s => s.trim()).filter(Boolean),
    restrictions: document.getElementById("b-rest").value,
    references: refs,
    vertical_slice: document.getElementById("b-vs").value,
    engine: document.getElementById("b-eng").value,
  };
  if (!answers.idea.trim()) return toast("Descreva a ideia em uma frase.");
  try {
    await api("POST", `/api/projects/${pid}/bootstrap`, { answers });
    toast("Documentos gerados.");
    location.hash = `#/project/${pid}/docs`;
  } catch (e) { toast("Erro: " + e.message); }
}

/* ----- decisions ----- */
function projectDecisions(pid, data) {
  const entries = data.decisions || [];
  const conflicts = data.conflicts || [];
  return `<h1>Decisões do projeto</h1>
    <div class="banner info">Registre o que foi decidido pelo Dev; “confirmado” não é inferido pelo Studio. O JSON é a fonte estruturada e DECISIONS.md é regenerado ao salvar aqui. Edições manuais desse Markdown podem ser substituídas: revise antes.</div>
    ${data.decisions_projection_modified ? `<div class="banner warn">DECISIONS.md difere do registro estruturado. Revise o documento antes de confirmar uma substituição aqui.</div>` : ""}
    ${conflicts.length ? `<div class="banner danger"><b>Conflitos a revisar:</b><ul class="clean">${conflicts.map(c =>
      `<li>${esc(c.topic)}: ${esc(c.confirmed.value)} (confirmado) × ${esc(c.conflicting.value)} (${esc(c.conflicting.label)})</li>`).join("")}</ul></div>` : ""}
    <div class="card"><h2>Registro (${entries.length})</h2>
      ${entries.length ? `<ul class="clean">${entries.map((d, i) => `<li>${i + 1}. ${pill(d.label)} <b>${esc(d.topic)}</b>: ${esc(d.value)} ${d.note ? `— ${esc(d.note)}` : ""}</li>`).join("")}</ul>` : "<p>Nenhuma decisão registrada.</p>"}</div>
    <div class="card"><h2>Adicionar ou revisar</h2>
      <label for="dec-select">Registro existente (ou nova decisão)</label>
      <select id="dec-select"><option value="">Nova decisão</option>${entries.map((d, i) =>
        `<option value="${i}">${i + 1}. ${esc(d.topic)} — ${esc(d.label)}</option>`).join("")}</select>
      <label for="dec-topic">Assunto *</label><input id="dec-topic" type="text" />
      <label for="dec-label">Rótulo — escolhido pelo Dev</label>
      <select id="dec-label">${["em aberto", "suposição", "proposto", "confirmado"].map(label =>
        `<option value="${label}">${label}</option>`).join("")}</select>
      <label for="dec-value">Valor</label><textarea id="dec-value"></textarea>
      <label for="dec-note">Nota / motivo da revisão</label><textarea id="dec-note"></textarea>
      <div class="row"><button onclick="saveDecision('${esc(pid)}')">Salvar decisão</button></div>
      <p class="muted">Se outra janela alterou o registro, recarregue antes de editar. A resolução de conflito é uma decisão humana.</p></div>`;
}
function wireDecisions(pid, data) {
  const entries = data.decisions || [];
  const byId = id => document.getElementById(id);
  byId("dec-select").onchange = () => {
    const index = byId("dec-select").value;
    const selected = index === "" ? null : entries[Number(index)];
    byId("dec-topic").value = selected?.topic || "";
    byId("dec-label").value = selected?.label || "em aberto";
    byId("dec-value").value = selected?.value || "";
    byId("dec-note").value = selected?.note || "";
  };
  window.saveDecision = async function () {
    const index = byId("dec-select").value;
    const topic = byId("dec-topic").value.trim();
    if (!topic) return toast("Informe o assunto da decisão.");
    const body = { topic, label: byId("dec-label").value,
      value: byId("dec-value").value, note: byId("dec-note").value,
      revision: data.decisions_revision };
    if (data.decisions_projection_modified) {
      if (!confirm("DECISIONS.md foi alterado fora deste registro. Você revisou o documento e autoriza substituir seu conteúdo pela projeção das decisões estruturadas?")) return;
      body.replace_projection = true;
    }
    try {
      await api(index === "" ? "POST" : "PUT",
        `/api/projects/${pid}/decisions${index === "" ? "" : "/" + index}`, body);
      toast("Decisão registrada. Revise o gate atualizado.");
      await renderProject(pid, "decisions");
    } catch (e) { toast("Não foi possível salvar: " + e.message); }
  };
}

/* ----- docs ----- */
function projectDocs(pid, data) {
  const docs = data.docs.length ? data.docs : ["PROJECT_BRIEF.md","GDD.md","SCOPE.md","DECISIONS.md","REFERENCIAS.md"];
  return `<h1>Documentos do projeto</h1>
    <div class="row"><div><label>Documento</label><select id="doc-sel">${docs.map(d=>`<option>${esc(d)}</option>`).join("")}</select></div></div>
    <label>Conteúdo (Markdown editável)</label>
    <textarea id="doc-content"></textarea>
    <div class="row" style="margin-top:10px"><button onclick="saveDoc('${esc(pid)}')">Salvar</button><span class="tag" id="doc-status"></span></div>`;
}
async function wireDocs(pid, docs) {
  const sel = document.getElementById("doc-sel");
  const load = async () => {
    const doc = sel.value;
    const d = await api("GET", `/api/projects/${pid}/docs/${encodeURIComponent(doc)}`);
    document.getElementById("doc-content").value = d.content || "";
    document.getElementById("doc-status").textContent = "";
  };
  sel.onchange = load;
  sel._load = load;
  await load();
  window.saveDoc = async function (pid) {
    const doc = document.getElementById("doc-sel").value;
    const content = document.getElementById("doc-content").value;
    await api("PUT", `/api/projects/${pid}/docs/${encodeURIComponent(doc)}`, { content });
    document.getElementById("doc-status").textContent = "salvo ✓";
    toast("Documento salvo.");
  };
}
async function saveDocDelegated() { /* no-op: real impl em wireDocs */ }

/* ----- plan ----- */
function projectPlan(pid, data) {
  const modules = data.modules || [];
  const modHtml = modules.length ? modules.map(m => moduleCard(m, modules, (data.module_blockers||{})[m.id]||[])).join("") :
    `<div class="empty">Nenhum módulo ainda. Crie o primeiro plano abaixo.</div>`;
  return `<h1>Plano — módulos e tarefas</h1>
    <div class="banner info">Converta os documentos aprovados em módulos/tarefas com critérios de aceite. Nada é implementado aqui.</div>
    ${modHtml}
    <div class="card"><h3>Novo módulo</h3>
      <label>Nome</label><input id="m-name" type="text" />
      <label>Descrição</label><textarea id="m-desc" style="min-height:60px"></textarea>
      <label>Critérios de aceite (um por linha)</label><textarea id="m-acc" style="min-height:60px"></textarea>
      <label>Depende dos módulos (opcional; Ctrl/Cmd para vários)</label>
      <select id="m-deps" multiple size="${Math.max(2, Math.min(6, modules.length))}">${modules.map(x=>`<option value="${esc(x.id)}">${esc(x.name)} (${esc(x.id)})</option>`).join("")}</select>
      <div class="row" style="margin-top:10px"><button onclick="addModule('${esc(pid)}')">Adicionar módulo</button></div>
    </div>`;
}
function moduleCard(m, modules = [], blockers = []) {
  const deps = modules.filter(x => x.id !== m.id);
  const depProblems = blockers.filter(b => b.code === "DEPENDENCY_NOT_READY" || b.code === "DEPENDENCY_INVALID");
  const completable = (m.tasks||[]).length && (m.acceptance||[]).length &&
    m.tasks.every(t => t.status === "concluído" && t.validation_status === "passed" && t.review_status === "approved");
  const tasks = (m.tasks||[]).map(t => `<li>${pill(t.status)} ${esc(t.name)} — ${esc(t.objective||"")} <button class="ghost small" onclick="resetTask('${m.id}','${t.id}')">↺ pendente</button></li>`).join("") || "<li class='muted'>sem tarefas</li>";
  return `<div class="card"><h3>${esc(m.name)} ${pill(m.status)}</h3>
    <div class="muted">${esc(m.description||"")} · ID: ${esc(m.id)}</div>
    ${blockers.length ? `<div class="banner warn">${blockers.map(b=>esc(b.message)).join(" · ")}</div>` : ""}
    <label>Dependências (Ctrl/Cmd para várias; identificadas por ID)</label>
    <select id="md-${esc(m.id)}" multiple size="${Math.max(2, Math.min(6, deps.length))}">${deps.map(x=>`<option value="${esc(x.id)}" ${(m.depends_on||[]).includes(x.id)?"selected":""}>${esc(x.name)} (${esc(x.id)})</option>`).join("")}</select>
    <button class="ghost small" onclick="setModuleDeps('${esc(m.id)}')">Salvar dependências</button>
    <div class="row" style="margin-top:8px">
      <select id="ms-${m.id}">${["pendente","em andamento","concluído","bloqueado","não verificado"].map(s=>`<option ${s===m.status?"selected":""} ${s==="concluído" && (!completable || depProblems.length) || s==="em andamento" && depProblems.length ? "disabled" : ""}>${s}</option>`).join("")}</select>
      <button class="small" onclick="setModuleStatus('${m.id}')">Status</button>
    </div>
    ${!completable ? '<p class="muted">“Concluído” exige tarefas executadas de verdade, validadas e revisadas.</p>' : ""}
    <h4 style="margin:10px 0 4px">Tarefas</h4><ul class="clean">${tasks}</ul>
    <div class="row">
      <input id="t-name-${m.id}" type="text" placeholder="nome da tarefa" />
      <input id="t-obj-${m.id}" type="text" placeholder="objetivo" />
      <button class="small" onclick="addTask('${m.id}')">+ tarefa</button>
    </div>
  </div>`;
}
async function wirePlan(pid, modules) {
  window.addModule = async function (pid) {
    const name = document.getElementById("m-name").value.trim();
    if (!name) return toast("Nome do módulo obrigatório.");
    const acc = document.getElementById("m-acc").value.split("\n").map(s=>s.trim()).filter(Boolean);
    try {
      await api("POST", `/api/projects/${pid}/modules`, { name, description: document.getElementById("m-desc").value, acceptance: acc,
        depends_on: Array.from(document.getElementById("m-deps").selectedOptions, o => o.value) });
    } catch(e) { return toast("Não foi possível criar o módulo: " + e.message); }
    toast("Módulo adicionado."); renderProject(pid, "plan");
  };
  window.addTask = async function (mid) {
    const name = document.getElementById(`t-name-${mid}`).value.trim();
    if (!name) return toast("Nome da tarefa obrigatório.");
    await api("POST", `/api/projects/${pid}/modules/${mid}/tasks`, { name, objective: document.getElementById(`t-obj-${mid}`).value });
    renderProject(pid, "plan");
  };
  window.setModuleDeps = async function (mid) {
    try {
      const depends_on = Array.from(document.getElementById(`md-${mid}`).selectedOptions, o => o.value);
      await api("PUT", `/api/projects/${pid}/modules/${mid}`, { depends_on });
      toast("Dependências salvas."); renderProject(pid, "plan");
    } catch(e) { toast("Não foi possível salvar dependências: " + e.message); }
  };
  window.setModuleStatus = async function (mid) {
    const st = document.getElementById(`ms-${mid}`).value;
    try {
      await api("PUT", `/api/projects/${pid}/modules/${mid}`, { status: st });
      renderProject(pid, "plan");
    } catch (e) { toast("Não foi possível alterar o módulo: " + e.message); }
  };
  window.resetTask = async function (mid, tid) {
    try {
      await api("PUT", `/api/projects/${pid}/modules/${mid}/tasks/${tid}`, { status: "pendente" });
      toast("Tarefa redefinida como pendente.");
      renderProject(pid, "plan");
    } catch (e) { toast("Não foi possível redefinir a tarefa: " + e.message); }
  };
}

/* ----- handoff (snapshot local, sem agente ou envio) ----- */
async function projectHandoff(pid, data) {
  let saved;
  try { saved = await api("GET", `/api/projects/${pid}/handoff`); }
  catch (e) { return `<h1>Handoff</h1><div class="banner danger">Erro ao ler HANDOFF.md: ${esc(e.message)}</div>`; }
  const tasks = (data.modules || []).flatMap(m => (m.tasks || []).map(t => ({m, t})));
  const options = tasks.map(({m, t}, i) => `<option value="${i}">${esc(m.name)} (${esc(m.id)}) → ${esc(t.name)} (${esc(t.id)})</option>`).join("");
  const state = saved.exists ? saved.stale === true ? "Desatualizado — fontes alteradas, refaça a prévia." :
    saved.stale === false ? "Sem mudanças detectadas nas fontes; revisão humana ainda necessária." :
    "Documento manual ou sem marcador; atualidade não verificável." : "Nenhum HANDOFF.md salvo.";
  return `<h1>Handoff de tarefa</h1>
    <div class="banner warn">Prévia local e revisão humana obrigatórias. O arquivo pode conter texto do projeto: confira e remova credenciais e dados pessoais antes de compartilhar. Não executa comandos nem envia dados. QA é registro manual; simulações não provam implementação.</div>
    <div class="card"><h3>Arquivo atual</h3><p>${esc(state)}</p>
      <pre class="skill-content">${esc(saved.content || "(nenhum arquivo)")}</pre></div>
    <div class="card"><h3>Gerar nova prévia</h3>
      <label>Tarefa (ID estável)</label><select id="handoff-task" onchange="resetHandoffPreview()">${options || '<option value="">Nenhuma tarefa</option>'}</select>
      <div class="row" style="margin-top:10px"><button onclick="previewHandoff('${esc(pid)}')" ${tasks.length ? "" : "disabled"}>Ver prévia</button>
      <button id="handoff-save" onclick="saveHandoff('${esc(pid)}')" disabled>Confirmar e salvar HANDOFF.md</button></div>
      <p id="handoff-status" class="muted" aria-live="polite"></p>
      <pre id="handoff-preview" class="skill-content" style="display:none"></pre></div>`;
}
function wireHandoff(pid, modules, existing = {}) {
  const tasks = (modules || []).flatMap(m => (m.tasks || []).map(t => ({m, t})));
  let pending = null;
  let generation = 0;
  window.resetHandoffPreview = function () {
    generation++;
    pending = null;
    document.getElementById("handoff-save").disabled = true;
    document.getElementById("handoff-preview").style.display = "none";
  };
  window.previewHandoff = async function () {
    window.resetHandoffPreview();
    const requestGeneration = generation;
    const selected = tasks[Number(document.getElementById("handoff-task").value)];
    if (!selected) return toast("Escolha uma tarefa para o handoff.");
    try {
      const {m, t} = selected;
      const r = await api("POST", `/api/projects/${pid}/handoff/preview`, {module_id: m.id, task_id: t.id});
      if (requestGeneration !== generation) return; // seleção mudou durante a requisição
      pending = {module_id: m.id, task_id: t.id, digest: r.digest};
      const pre = document.getElementById("handoff-preview");
      pre.textContent = r.content;
      pre.style.display = "block";
      document.getElementById("handoff-status").textContent = r.warning;
      document.getElementById("handoff-save").disabled = false;
    } catch (e) { toast("Falha ao gerar prévia: " + e.message); }
  };
  window.saveHandoff = async function () {
    if (!pending) return toast("Revise a prévia antes de salvar.");
    const replace = Boolean(existing && existing.exists);
    if (!confirm(replace ? "Substituir HANDOFF.md atual pelo snapshot revisado? Verifique segredos e dados pessoais antes de compartilhar." :
      "Salvar este handoff revisado no projeto? Verifique segredos e dados pessoais antes de compartilhar.")) return;
    const request = {...pending, confirm: true, replace};
    window.resetHandoffPreview();
    try {
      await api("POST", `/api/projects/${pid}/handoff`, request);
      toast("HANDOFF.md salvo no projeto; não enviado a terceiros.");
      await renderProject(pid, "handoff");
    } catch (e) { toast("Handoff não salvo: " + e.message + " Gere outra prévia."); }
  };
}

/* ----- execute ----- */
function projectExecute(pid, data) {
  const modules = data.modules || [];
  const tasks = [];
  modules.forEach(m => (m.tasks||[]).forEach(t => {
    previewedTasks.delete(previewKey(pid, m.id, t.id));
    tasks.push({ m, t, blockers: (data.module_blockers||{})[m.id]||[] });
  }));
  const html = tasks.length ? tasks.map(({m,t,blockers}) => `
    <div class="card"><h3>${pill(t.status)} ${esc(t.name)}</h3>
      <div class="muted">Módulo: ${esc(m.name)}</div>
      ${blockers.length ? `<div class="banner warn">Execução bloqueada: ${blockers.map(b=>esc(b.message)).join(" · ")}</div>` : ""}
      <div><b>Objetivo:</b> ${esc(t.objective||"—")}</div>
      <div><b>Verificar:</b> ${esc(t.verify||"—")}</div>
      <div class="row" style="margin-top:10px">
        <button onclick="previewTask('${esc(pid)}','${m.id}','${t.id}')">Ver proposta</button>
        <button id="approve-${esc(t.id)}" disabled onclick="execTask('${esc(pid)}','${m.id}','${t.id}')">Aprovar e simular</button>
      </div>
      <pre id="exec-${t.id}" class="card" style="white-space:pre-wrap;margin-top:8px;display:none"></pre>
    </div>`).join("") : `<div class="empty">Nenhuma tarefa para executar. Crie tarefas no Plano.</div>`;
  const history = (data.recent_sessions || []).slice().reverse();
  const sessionsHtml = history.length ? `<ul class="clean">${history.map(s =>
    `<li><code>${esc(s.id)}</code> · tarefa ${esc(s.task_id)} · ${esc(s.finished_at)} ·
    ${esc(s.runtime_id)}: <b>SIMULADO</b> · validação não realizada · nenhuma evidência verificada.</li>`
  ).join("")}</ul>` : `<p class="muted">Nenhuma Session registrada nesta versão. Simulações anteriores não são reconstruídas automaticamente.</p>`;
  return `<h1>Execução assistida (simulada)</h1>
    <div class="banner warn"><b>Simulado:</b> não há agente de código nem engine conectados. A execução mostra a proposta e um resultado SIMULADO, claramente rotulado. Nenhum código é escrito e nenhum serviço é chamado.</div>
    ${html}
    <div class="card"><h2>Sessions recentes (somente leitura)</h2>${sessionsHtml}</div>`;
}
async function wireExecute(pid) {}
const previewedTasks = new Map();
function previewKey(pid, mid, tid) { return `${pid}:${mid}:${tid}`; }
async function previewTask(pid, mid, tid) {
  const key = previewKey(pid, mid, tid);
  previewedTasks.delete(key);
  const button = document.getElementById(`approve-${tid}`);
  button.disabled = true;
  try {
    const r = await api("POST", `/api/projects/${pid}/tasks/${mid}/${tid}/execute`, { approved: false });
    const pre = document.getElementById(`exec-${tid}`);
    pre.style.display = "block";
    pre.textContent = `${r.proposal}\n\n${r.blockers.length ? "Bloqueios: " + r.blockers.map(b=>b.message).join("; ") : "Aguardando aprovação explícita."}\n\n[${r.warning}]`;
    if (!r.blockers.length && r.preview_digest) {
      previewedTasks.set(key, r.preview_digest);
      button.disabled = false;
    }
  } catch (e) { toast("Não foi possível obter a proposta: " + e.message); }
}
async function execTask(pid, mid, tid) {
  const key = previewKey(pid, mid, tid);
  if (!previewedTasks.has(key)) return toast("Leia a proposta antes de aprovar.");
  if (!confirm("Aprova registrar uma execução SIMULADA desta tarefa? Nenhum código será escrito.")) return;
  const preview_digest = previewedTasks.get(key);
  previewedTasks.delete(key);
  document.getElementById(`approve-${tid}`).disabled = true;
  try {
    const r = await api("POST", `/api/projects/${pid}/tasks/${mid}/${tid}/execute`, { approved: true, preview_digest });
    const pre = document.getElementById(`exec-${tid}`);
    pre.style.display = "block";
    pre.textContent = `${r.proposal}\n\n${r.simulated_result}\n\n[${r.warning}]${r.session ? `\n\nSession ${r.session.id}: fluxo simulado encerrado; validação não realizada e nenhuma evidência verificada.` : ""}`;
    toast("Execução simulada registrada.");
  } catch (e) { toast("Erro: " + e.message + " Revise a proposta e tente novamente."); }
}

/* ----- qa ----- */
function projectQa(pid, data) {
  const qa = data.qa || [];
  const targets = (data.modules||[]).flatMap(m => [
    { ref: `module:${m.id}`, label: `Módulo: ${m.name} (${m.id})` },
    ...(m.tasks||[]).map(t => ({ref: `task:${t.id}`, label: `Tarefa: ${t.name} (${t.id})`}))
  ]);
  const rows = qa.length ? `<table><tr><th>ID</th><th>Alvo</th><th>Critério</th><th>Ferramenta</th><th>Comando</th><th>Data</th><th>Evidência (relato)</th><th>Resultado</th></tr>${
    qa.map(q=>`<tr><td><code>${esc(q.id)}</code></td><td>${esc(q.target)} ${q.target_ref ? `<small>(${esc(q.target_ref)})</small>` : ""}</td><td>${esc(q.criteria)}</td><td>${esc(q.tool)}</td><td><code>${esc(q.command)}</code></td><td>${esc(q.date)}</td><td>${esc(q.evidence)}</td><td>${pill(q.result)}</td></tr>`).join("")}</table>` :
    `<div class="empty">Nenhuma verificação registrada.</div>`;
  return `<h1>QA / Playtest</h1>
    <div class="banner info">Registre resultados reais feitos pelo Dev: executado, aprovado e falhou exigem critério, ferramenta e evidência. O Studio não executa nem confere o teste; não marque como aprovado sem revisar o resultado.</div>
    ${rows}
    <p><a href="#/project/${esc(pid)}/evidence">Ver arquivos de evidência locais</a> (hash de bytes não equivale a teste aprovado).</p>
    <div class="card"><h3>Nova verificação</h3>
      <label>Alvo (descrição livre/critério)</label><input id="q-target" />
      <label>Vincular a módulo ou tarefa por ID estável (opcional)</label>
      <select id="q-target-ref"><option value="">Sem vínculo (critério livre)</option>${targets.map(x=>`<option value="${esc(x.ref)}">${esc(x.label)}</option>`).join("")}</select>
      <label>Critério</label><input id="q-crit" />
      <div class="row">
        <div><label>Ferramenta</label><input id="q-tool" placeholder="ex.: Unity Test, pytest" /></div>
        <div><label>Comando</label><input id="q-cmd" placeholder="ex.: pytest -k slice" /></div>
      </div>
      <label>Evidência / saída</label><textarea id="q-ev" style="min-height:60px"></textarea>
      <label>Resultado</label><select id="q-res">${["planejado","executado","aprovado_dev","falhou"].map(s=>`<option>${s}</option>`).join("")}</select>
      <div class="row" style="margin-top:10px"><button onclick="addQa('${esc(pid)}')">Registrar</button></div>
    </div>`;
}
async function wireQa(pid) {
  window.addQa = async function (pid) {
    const result = document.getElementById("q-res").value;
    if (result === "aprovado_dev" && !confirm("Você revisou a evidência e aprova este resultado de QA? O Studio não executou o teste.")) return;
    try {
      await api("POST", `/api/projects/${pid}/qa`, {
        target: document.getElementById("q-target").value,
        target_ref: document.getElementById("q-target-ref").value,
        criteria: document.getElementById("q-crit").value,
        tool: document.getElementById("q-tool").value,
        command: document.getElementById("q-cmd").value,
        evidence: document.getElementById("q-ev").value,
        result,
      });
      renderProject(pid, "qa");
    } catch (e) { toast("Não foi possível registrar QA: " + e.message); }
  };
}

/* ----- evidence: arquivos locais, sem executar testes ----- */
async function projectEvidence(pid, data) {
  let records;
  try { records = (await api("GET", `/api/projects/${pid}/evidence`)).evidence || []; }
  catch(e) { return `<h1>Evidências</h1><div class="banner danger">Não foi possível ler evidências: ${esc(e.message)}</div>`; }
  const targets = (data.modules||[]).flatMap(m => [
    {ref: `module:${m.id}`, label: `Módulo ${m.name} (${m.id})`},
    ...(m.tasks||[]).map(t => ({ref: `task:${t.id}`, label: `Tarefa ${t.name} (${t.id})`})),
  ]);
  const checks = (data.qa||[]).filter(q => q.target_ref);
  const list = records.length ? `<table><tr><th>ID</th><th>Alvo</th><th>Arquivo relativo</th><th>Bytes</th><th>SHA-256</th><th>QA</th><th>Integridade atual</th></tr>${records.map(r=>
    `<tr><td><code>${esc(r.id)}</code></td><td>${esc(r.target_ref)}</td><td>${esc(r.path)}</td>
      <td>${esc(r.bytes)}</td><td><code>${esc(r.sha256)}</code></td><td>${esc(r.qa_id||"—")}</td>
      <td>${esc(r.integrity)} (não valida o resultado)</td></tr>`).join("")}</table>` :
    `<div class="empty">Nenhum arquivo registrado. Crie um arquivo dentro da pasta do projeto antes de vinculá-lo.</div>`;
  return `<h1>Arquivos de evidência</h1>
    <div class="banner warn">Registro manual de arquivos existentes na pasta do projeto no computador que executa o Studio (no preview remoto, é o servidor, não o seu navegador). O Studio calcula o hash dos bytes, mas não executa comandos, não verifica critérios e nunca muda tarefa ou QA automaticamente. Não envia o arquivo ao navegador nem a terceiros; revise seu conteúdo antes de exportar/compartilhar.</div>
    ${list}
    <div class="card"><h3>Registrar arquivo local</h3>
      <label>Alvo por ID</label><select id="ev-target">${targets.map(x=>`<option value="${esc(x.ref)}">${esc(x.label)}</option>`).join("")}</select>
      <label>ID de verificação QA (opcional, deve ter o mesmo alvo)</label><select id="ev-qa"><option value="">Sem vínculo QA</option>${checks.map(q=>`<option value="${esc(q.id)}">${esc(q.id)} — ${esc(q.target_ref)} (${esc(q.result)})</option>`).join("")}</select>
      <label>Caminho relativo à pasta do projeto (ex.: logs/teste.txt; não aceita links simbólicos)</label><input id="ev-path" type="text" />
      <label>Nota de origem (não comprova aprovação)</label><input id="ev-note" type="text" />
      <p class="muted">Limite por arquivo: 50 MB. O arquivo permanece na pasta do projeto; não há upload nesta tela.</p>
      <button onclick="registerEvidence('${esc(pid)}')" ${targets.length ? "" : "disabled"}>Registrar hash do arquivo</button>
    </div>`;
}
function wireEvidence(pid) {
  window.registerEvidence = async function () {
    const path = document.getElementById("ev-path").value.trim();
    if (!path) return toast("Informe um arquivo relativo dentro do projeto.");
    try {
      await api("POST", `/api/projects/${pid}/evidence`, {
        target_ref: document.getElementById("ev-target").value,
        qa_id: document.getElementById("ev-qa").value, path,
        note: document.getElementById("ev-note").value,
      });
      toast("Hash registrado (não é validação de teste).");
      await renderProject(pid, "evidence");
    } catch(e) { toast("Não foi possível registrar evidência: " + e.message); }
  };
}

/* ----- release ----- */
function projectRelease(pid, data) {
  const rel = data.release || {};
  const oldClaim = rel.unverified_claim ? `<div class="banner danger">Há uma declaração anterior de build/verificação/publicação sem artefato verificado pelo Studio. Ela não comprova publicação: revise e reclassifique explicitamente antes de salvar.</div>` : "";
  const checklist = (rel.checklist||[]).map((c,i)=>`<label style="display:flex;gap:8px;align-items:center;color:var(--ink)"><input type="checkbox" data-i="${i}" ${c.done?"checked":""}/> ${esc(c.item)}</label>`).join("");
  return `<h1>Preparação de build / release</h1>
    <div class="banner warn">Nada é publicado, enviado ou comprado aqui. Marque itens somente se realizados pelo Dev: o Studio não verifica o checklist. O caminho básico não depende de serviço pago.</div>
    ${oldClaim}
    <div class="card"><h3>Checklist</h3>${checklist||"<div class='muted'>vazio</div>"}</div>
    <div class="card"><h3>Créditos e licenças</h3><textarea id="rel-cred">${esc(rel.credits||"")}</textarea></div>
    <div class="card"><h3>Notas de versão</h3><textarea id="rel-notes">${esc(rel.version_notes||"")}</textarea>
      <label>Estado documental (nenhum build verificado)</label><select id="rel-state">${rel.unverified_claim ? `<option value="" selected disabled>Reclassificar declaração anterior: ${esc(rel.state)}</option>` : ""}${["preparando","pronto_para_build"].map(s=>`<option ${!rel.unverified_claim && s===rel.state?"selected":""}>${s}</option>`).join("")}</select>
      <div class="row" style="margin-top:10px"><button onclick="saveRelease('${esc(pid)}')">Salvar</button></div>
    </div>
    <div class="banner info">Publicação pelo Studio: <b>não disponível</b>. ${rel.unverified_claim ? "Declaração antiga não verificada." : "Nenhum artefato de build registrado pelo Studio."}</div>`;
}
async function wireRelease(pid, rel) {
  window.saveRelease = async function (pid) {
    const state = document.getElementById("rel-state").value;
    if (!state) return toast("Escolha um estado documental antes de salvar.");
    if (rel.unverified_claim && !confirm("Retirar a declaração antiga de publicação/build verificado? O Studio não possui artefato que a comprove.")) return;
    const checks = [...document.querySelectorAll("#view input[type=checkbox]")].map(c => ({ item: rel.checklist[+c.dataset.i].item, done: c.checked }));
    try {
      await api("PUT", `/api/projects/${pid}/release`, {
        checklist: checks,
        credits: document.getElementById("rel-cred").value,
        version_notes: document.getElementById("rel-notes").value,
        state, published: false,
      });
      toast("Preparação salva (sem publicação).");
      renderProject(pid, "release");
    } catch (e) { toast("Não foi possível salvar release: " + e.message); }
  };
}

/* ----- config (project: engines + providers) ----- */
function projectConfig(pid, data) {
  const eng = data.engine || {};
  const prov = data.providers || {};
  const engOpts = (data.engine_catalog || []).map(item =>
    `<option value="${esc(item.id)}" ${eng.id===item.id?"selected":""}>${esc(item.name)} — ${item.verified ? "perfil genérico" : "não verificado"}</option>`).join("");
  return `<h1>Configuração do projeto</h1>
    <div class="card"><h3>Perfil de engine</h3>
      <p class="muted">Perfil não é adapter. Unreal, Godot, Unity e MonoGame não detectam instalação nem abrem o editor nesta alpha.</p>
      <select id="eng-sel">${engOpts}</select>
      <div class="row" style="margin-top:10px"><button onclick="setEngine('${esc(pid)}')">Salvar perfil</button></div>
      <div class="tag">Atual: ${esc(eng.name||"—")} · verificado: ${eng.verified? "sim":"não"}</div>
    </div>
    <div class="card"><h3>Provedores de IA (offline / simulado)</h3>
      <div class="banner warn">${esc(prov.message||"Sem conexão.")}</div>
      <p class="muted">Modo: <b>${esc(prov.mode||"offline")}</b> · conectado: <b>${prov.connected?"sim":"não"}</b> · simulado: <b>${prov.simulated?"sim":"não"}</b></p>
      <p>Veja e configure provedores em <a href="#/config">Configurações globais</a>.</p>
    </div>`;
}
async function wireConfig(pid, data) {
  window.setEngine = async function (pid) {
    const id = document.getElementById("eng-sel").value;
    if (!id) return toast("Nenhum perfil disponível; revise o catálogo.");
    try {
      await api("POST", `/api/projects/${pid}/engines`, { engine_id: id });
      toast("Perfil de engine salvo (adapter não conectado).");
      await renderProject(pid, "config");
    } catch (e) { toast("Não foi possível salvar o perfil: " + e.message); }
  };
}

/* ----- global config ----- */
async function renderGlobalConfig() {
  let settings, catalog;
  try {
    settings = await api("GET", "/api/providers/settings");
    catalog = (await api("GET", "/api/providers")).catalog;
  } catch (e) { view.innerHTML = `<div class="banner danger">Erro: ${esc(e.message)}</div><a class="btn" href="#/recovery">Verificar integridade dos dados</a>`; return; }
  const cat = catalog.map(c => `<div class="card">
    <h3>${esc(c.name)} ${pill(c.kind)}</h3>
    <p class="muted">Status: ${esc(c.status)} · simulado: ${c.simulated?"sim":"não"}</p>
    <ul class="clean">
      <li><b>Requer:</b> ${esc(c.requires)}</li>
      <li><b>Custo:</b> ${esc(c.cost)}</li>
      <li><b>Dados:</b> ${esc(c.data_egress)}</li>
      <li><b>Fonte:</b> <span class="tag">${esc(c.source)}</span></li>
      <li>${esc(c.note)}</li>
    </ul></div>`).join("");
  view.innerHTML = `<h1>Configurações — provedores de IA</h1>
    <div class="banner warn">Tudo é <b>offline e simulado</b> nesta alpha. Nenhuma chave é armazenada e nenhuma chamada paga é feita. Conectar um provedor real fica fora desta entrega.</div>
    <div class="card"><h3>Modo de IA</h3>
      <select id="mode-sel">${["offline","local","cloud","combined"].map(m=>`<option ${m===settings.mode?"selected":""}>${m}</option>`).join("")}</select>
      <p class="muted">offline (padrão, sem inferência) · local (Ollama, guia) · cloud (Gemini/OpenRouter, guia) · combined (ambas, com cuidado de não duplicar dados).</p>
      <div class="row" style="margin-top:10px"><button onclick="saveMode()">Salvar modo</button></div>
    </div>
    <h2>Catálogo (não conectado)</h2>
    <div class="grid">${cat}</div>`;
  window.saveMode = async function () {
    const mode = document.getElementById("mode-sel").value;
    try {
      await api("PUT", "/api/providers/settings", { mode });
      toast("Preferência salva; nenhum provedor foi conectado.");
    } catch (e) { toast("Não foi possível salvar a preferência: " + e.message); }
  };
}

/* ----------------------- boot ----------------------- */
navigate();
