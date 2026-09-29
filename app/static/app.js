"use strict";

/* ============================================================
   Lia GameDev — SPA local (vanilla JS, sem build)
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
  if (first === "project") return renderProject(rest[0], rest[1] || "overview");
  return renderHome();
}
window.addEventListener("hashchange", navigate);

/* ----------------------- HOME ----------------------- */
async function renderHome() {
  let projects = [];
  try { projects = (await api("GET", "/api/projects")).projects; }
  catch (e) { view.innerHTML = `<div class="banner danger">Erro: ${esc(e.message)}</div>`; return; }

  const cards = projects.length
    ? `<div class="grid">${projects.map(p => projectCard(p)).join("")}</div>`
    : `<div class="empty">Nenhum projeto ainda. Crie o primeiro ou carregue um exemplo demonstrativo.</div>`;

  view.innerHTML = `
    <h1>Início — seus projetos</h1>
    <div class="banner info">Tudo é salvo localmente no seu computador. Nenhuma conta ou nuvem é obrigatória. Provedores de IA ficam <b>desligados</b> e simulados até você conectar (fora desta alpha).</div>
    <div class="row" style="margin:14px 0">
      <button onclick="showNewProject()">+ Novo projeto</button>
      <button class="ghost" onclick="loadExample()">Carregar exemplo demonstrativo</button>
    </div>
    <div id="newproj" hidden>
      <div class="card">
        <h3>Criar projeto</h3>
        <label>Nome</label><input id="np-name" type="text" placeholder="Ex.: Minha aventura" />
        <label>Pasta local (opcional — padrão: ~/LiaGameDevProjects)</label><input id="np-loc" type="text" placeholder="deixe em branco para o padrão" />
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
    <div class="meta">${pill(p.status)} · fase: ${esc(p.phase || "?")}</div>
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

/* ----------------------- PROJECT ----------------------- */
const SECTIONS = [
  ["overview", "Visão geral"],
  ["bootstrap", "Etapa 0"],
  ["docs", "Documentos"],
  ["plan", "Plano"],
  ["execute", "Execução"],
  ["qa", "QA / Playtest"],
  ["release", "Release"],
  ["config", "Configuração"],
];

async function renderProject(pid, section) {
  let data;
  try { data = await api("GET", `/api/projects/${pid}`); }
  catch (e) { view.innerHTML = `<div class="banner danger">Erro: ${esc(e.message)}</div>`; return; }
  const entry = data.entry;
  const side = `<div class="side">
    <div class="proj-name">${esc(entry.name)}</div>
    <div class="meta">${pill(entry.status)} ${pill(entry.phase)}</div>
    ${SECTIONS.map(([s, label]) => `<a href="#/project/${esc(pid)}/${s}" class="${section === s ? "active" : ""}">${label}</a>`).join("")}
    <hr/>
    <a class="ghost btn small" href="#/home">← Início</a>
  </div>`;

  let content = "";
  if (section === "overview") content = await projectOverview(pid, data);
  else if (section === "bootstrap") content = await projectBootstrap(pid, data);
  else if (section === "docs") content = await projectDocs(pid, data);
  else if (section === "plan") content = await projectPlan(pid, data);
  else if (section === "execute") content = await projectExecute(pid, data);
  else if (section === "qa") content = await projectQa(pid, data);
  else if (section === "release") content = await projectRelease(pid, data);
  else if (section === "config") content = await projectConfig(pid, data);

  view.innerHTML = `<div class="layout">${side}<div>${content}</div></div>`;
  if (section === "docs") wireDocs(pid, data.docs);
  if (section === "plan") wirePlan(pid, data.modules);
  if (section === "execute") wireExecute(pid, data.modules);
  if (section === "qa") wireQa(pid);
  if (section === "release") wireRelease(pid, data.release);
  if (section === "config") wireConfig(pid, data);
}

/* ----- overview ----- */
function projectOverview(pid, data) {
  const r = data.resume || {};
  const conflicts = data.conflicts || [];
  const conflictBanner = conflicts.length
    ? `<div class="banner danger"><b>Conflito detectado:</b> há decisão confirmada em desacordo com suposição/em-aberto. O produto NÃO escolheu silenciosamente — revise em Documentos → DECISIONS.</div>`
    : "";
  return `
    <h1>${esc(data.entry.name)}</h1>
    ${conflictBanner}
    <div class="banner info"><b>Próximo passo:</b> ${esc(data.entry.next_step || "—")}</div>
    <div class="card"><h3>Resumo ativo</h3><p>${esc(r.summary || "—")}</p>
      <p class="muted">Fase: ${esc(r.phase || "?")}</p></div>
    <h2>Tarefas abertas (${ (r.open_tasks||[]).length })</h2>
    ${ (r.open_tasks||[]).length ? `<ul class="clean">${r.open_tasks.map(t=>`<li>${pill(t.status)} ${esc(t.name)}</li>`).join("")}</ul>` : `<div class="empty">Nenhuma tarefa aberta.</div>` }
    <h2>Decisões em aberto/suposição (${ (r.pending_decisions||[]).length })</h2>
    ${ (r.pending_decisions||[]).length ? `<ul class="clean">${r.pending_decisions.map(d=>`<li>${pill(d.label)} <b>${esc(d.topic)}</b>: ${esc(d.value)}</li>`).join("")}</ul>` : `<div class="empty">Nenhuma.</div>` }
    <h2>Journal (cauda)</h2>
    <pre class="card" style="white-space:pre-wrap">${esc(r.journal_tail || "vazio")}</pre>
  `;
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
  const modHtml = modules.length ? modules.map(m => moduleCard(m)).join("") :
    `<div class="empty">Nenhum módulo ainda. Crie o primeiro plano abaixo.</div>`;
  return `<h1>Plano — módulos e tarefas</h1>
    <div class="banner info">Converta os documentos aprovados em módulos/tarefas com critérios de aceite. Nada é implementado aqui.</div>
    ${modHtml}
    <div class="card"><h3>Novo módulo</h3>
      <label>Nome</label><input id="m-name" type="text" />
      <label>Descrição</label><textarea id="m-desc" style="min-height:60px"></textarea>
      <label>Critérios de aceite (um por linha)</label><textarea id="m-acc" style="min-height:60px"></textarea>
      <div class="row" style="margin-top:10px"><button onclick="addModule('${esc(pid)}')">Adicionar módulo</button></div>
    </div>`;
}
function moduleCard(m) {
  const tasks = (m.tasks||[]).map(t => `<li>${pill(t.status)} ${esc(t.name)} — ${esc(t.objective||"")} <button class="ghost small" onclick="delTask('${m.id}','${t.id}')">↺ pendente</button></li>`).join("") || "<li class='muted'>sem tarefas</li>";
  return `<div class="card"><h3>${esc(m.name)} ${pill(m.status)}</h3>
    <div class="muted">${esc(m.description||"")}</div>
    <div class="row" style="margin-top:8px">
      <select id="ms-${m.id}">${["pendente","em andamento","concluído","bloqueado","não verificado"].map(s=>`<option ${s===m.status?"selected":""}>${s}</option>`).join("")}</select>
      <button class="small" onclick="setModuleStatus('${m.id}')">Status</button>
    </div>
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
    await api("POST", `/api/projects/${pid}/modules`, { name, description: document.getElementById("m-desc").value, acceptance: acc });
    toast("Módulo adicionado."); renderProject(pid, "plan");
  };
  window.addTask = async function (mid) {
    const name = document.getElementById(`t-name-${mid}`).value.trim();
    if (!name) return toast("Nome da tarefa obrigatório.");
    await api("POST", `/api/projects/${pid}/modules/${mid}/tasks`, { name, objective: document.getElementById(`t-obj-${mid}`).value });
    renderProject(pid, "plan");
  };
  window.setModuleStatus = async function (mid) {
    const st = document.getElementById(`ms-${mid}`).value;
    await api("PUT", `/api/projects/${pid}/modules/${mid}`, { status: st });
    renderProject(pid, "plan");
  };
  window.delTask = async function (mid, tid) {
    await api("PUT", `/api/projects/${pid}/modules/${mid}/tasks/${tid}`, { status: "pendente" });
    // (remoção simples: marcamos como pendente; edição completa fica para refine)
    toast("Tarefa mantida como pendente.");
  };
}

/* ----- execute ----- */
function projectExecute(pid, data) {
  const modules = data.modules || [];
  const tasks = [];
  modules.forEach(m => (m.tasks||[]).forEach(t => tasks.push({ m, t })));
  const html = tasks.length ? tasks.map(({m,t}) => `
    <div class="card"><h3>${pill(t.status)} ${esc(t.name)}</h3>
      <div class="muted">Módulo: ${esc(m.name)}</div>
      <div><b>Objetivo:</b> ${esc(t.objective||"—")}</div>
      <div><b>Verificar:</b> ${esc(t.verify||"—")}</div>
      <div class="row" style="margin-top:10px">
        <button onclick="execTask('${m.id}','${t.id}')">Aprovar e simular execução</button>
      </div>
      <pre id="exec-${t.id}" class="card" style="white-space:pre-wrap;margin-top:8px;display:none"></pre>
    </div>`).join("") : `<div class="empty">Nenhuma tarefa para executar. Crie tarefas no Plano.</div>`;
  return `<h1>Execução assistida (simulada)</h1>
    <div class="banner warn"><b>Simulado:</b> não há agente de código nem engine conectados. A execução mostra a proposta e um resultado SIMULADO, claramente rotulado. Nenhum código é escrito e nenhum serviço é chamado.</div>
    ${html}`;
}
async function wireExecute(pid) {}
async function execTask(mid, tid) {
  const r = await api("POST", `/api/projects/${pid}/tasks/${mid}/${tid}/execute`, { approved: true });
  const pre = document.getElementById(`exec-${tid}`);
  pre.style.display = "block";
  pre.textContent = `${r.proposal}\n\n${r.simulated_result}\n\n[${r.warning}]`;
  toast("Execução simulada registrada.");
}

/* ----- qa ----- */
function projectQa(pid, data) {
  const qa = data.qa || [];
  const rows = qa.length ? `<table><tr><th>Alvo</th><th>Critério</th><th>Ferramenta</th><th>Comando</th><th>Data</th><th>Evidência</th><th>Resultado</th></tr>${
    qa.map(q=>`<tr><td>${esc(q.target)}</td><td>${esc(q.criteria)}</td><td>${esc(q.tool)}</td><td><code>${esc(q.command)}</code></td><td>${esc(q.date)}</td><td>${esc(q.evidence)}</td><td>${pill(q.result)}</td></tr>`).join("")}</table>` :
    `<div class="empty">Nenhuma verificação registrada.</div>`;
  return `<h1>QA / Playtest</h1>
    <div class="banner info">Registre verificações com ferramenta, comando, data, evidência e resultado. Distinguimos planejado · executado · aprovado pelo Dev. O produto não afirma que um teste passou se a ferramenta não foi executada.</div>
    ${rows}
    <div class="card"><h3>Nova verificação</h3>
      <label>Alvo (módulo/tarefa/critério)</label><input id="q-target" />
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
    await api("POST", `/api/projects/${pid}/qa`, {
      target: document.getElementById("q-target").value,
      criteria: document.getElementById("q-crit").value,
      tool: document.getElementById("q-tool").value,
      command: document.getElementById("q-cmd").value,
      evidence: document.getElementById("q-ev").value,
      result: document.getElementById("q-res").value,
    });
    renderProject(pid, "qa");
  };
}

/* ----- release ----- */
function projectRelease(pid, data) {
  const rel = data.release || {};
  const checklist = (rel.checklist||[]).map((c,i)=>`<label style="display:flex;gap:8px;align-items:center;color:var(--ink)"><input type="checkbox" data-i="${i}" ${c.done?"checked":""}/> ${esc(c.item)}</label>`).join("");
  return `<h1>Preparação de build / release</h1>
    <div class="banner warn">Nada é publicado, enviado ou comprado aqui. Apenas preparamos estado e documentação. O caminho básico não depende de serviço pago.</div>
    <div class="card"><h3>Checklist</h3>${checklist||"<div class='muted'>vazio</div>"}</div>
    <div class="card"><h3>Créditos e licenças</h3><textarea id="rel-cred">${esc(rel.credits||"")}</textarea></div>
    <div class="card"><h3>Notas de versão</h3><textarea id="rel-notes">${esc(rel.version_notes||"")}</textarea>
      <label>Estado</label><select id="rel-state">${["preparando","pronto_para_build","build_gerada","verificada","publicada"].map(s=>`<option ${s===rel.state?"selected":""}>${s}</option>`).join("")}</select>
      <div class="row" style="margin-top:10px"><button onclick="saveRelease('${esc(pid)}')">Salvar</button></div>
    </div>
    <div class="banner info">Publicado: <b>${rel.published?"sim":"não"}</b> (nunca automático).</div>`;
}
async function wireRelease(pid, rel) {
  window.saveRelease = async function (pid) {
    const checks = [...document.querySelectorAll("#view input[type=checkbox]")].map(c => ({ item: rel.checklist[+c.dataset.i].item, done: c.checked }));
    await api("PUT", `/api/projects/${pid}/release`, {
      checklist: checks,
      credits: document.getElementById("rel-cred").value,
      version_notes: document.getElementById("rel-notes").value,
      state: document.getElementById("rel-state").value,
    });
    toast("Release salvo (sem publicação).");
  };
}

/* ----- config (project: engines + providers) ----- */
function projectConfig(pid, data) {
  const eng = data.engine || {};
  const prov = data.providers || {};
  const engOpts = ["generic","godot","unity","monogame"].map(id => `<option value="${id}" ${eng.id===id?"selected":""}>${id}</option>`).join("");
  return `<h1>Configuração do projeto</h1>
    <div class="card"><h3>Perfil de engine</h3>
      <p class="muted">O núcleo é agnóstico a engine. Adaptadores reais (Godot/Unity/MonoGame) não foram verificados nesta alpha.</p>
      <select id="eng-sel">${engOpts}</select>
      <div class="row" style="margin-top:10px"><button onclick="setEngine('${esc(pid)}')">Salvar perfil</button></div>
      <div class="tag">Atual: ${esc(eng.name||"—")} · verificado: ${eng.verified? "sim":"não"}</div>
    </div>
    <div class="card"><h3>Provedores de IA (offline / simulado)</h3>
      <div class="banner warn">${esc((prov.message||"Sem conexão.").replace("Lia GameDev","Lia GameDev"))}</div>
      <p class="muted">Modo: <b>${esc(prov.mode||"offline")}</b> · conectado: <b>${prov.connected?"sim":"não"}</b> · simulado: <b>${prov.simulated?"sim":"não"}</b></p>
      <p>Veja e configure provedores em <a href="#/config">Configurações globais</a>.</p>
    </div>`;
}
async function wireConfig(pid, data) {
  window.setEngine = async function (pid) {
    const id = document.getElementById("eng-sel").value;
    await api("POST", `/api/projects/${pid}/engines`, { engine_id: id });
    toast("Perfil de engine salvo."); renderProject(pid, "config");
  };
}

/* ----- global config ----- */
async function renderGlobalConfig() {
  let settings, catalog;
  try {
    settings = await api("GET", "/api/providers/settings");
    catalog = (await api("GET", "/api/providers")).catalog;
  } catch (e) { view.innerHTML = `<div class="banner danger">Erro: ${esc(e.message)}</div>`; return; }
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
    await api("PUT", "/api/providers/settings", { mode });
    toast("Modo salvo.");
  };
}

/* ----------------------- boot ----------------------- */
navigate();
