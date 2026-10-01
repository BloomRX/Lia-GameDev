// Regression checks for the vanilla JS flow; no browser dependencies required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const pre = { style: {}, textContent: '' };
const approval = { disabled: true };
const exportResult = { textContent: '' };
const toast = { hidden: true, textContent: '' };
const view = { innerHTML: '' };
const requests = [];
const context = {
  document: { getElementById: id => ({ view, toast, 'exec-task': pre, 'approve-task': approval, 'export-result': exportResult })[id] },
  window: { addEventListener: () => {} },
  location: { hash: '#/home' },
  fetch: async (url, options) => {
    requests.push({ url, options });
    return { ok: true, json: async () => ({ proposal: 'Proposta', simulated_result: options.body && JSON.parse(options.body).approved ? 'SIMULADO' : null, blockers: [], warning: 'Aviso' }) };
  },
  clearTimeout, setTimeout: () => 1,
  confirm: () => true,
  prompt: () => 'Escopo revisado',
};
const source = fs.readFileSync(require('node:path').join(__dirname, '../app/static/app.js'), 'utf8');
vm.runInNewContext(source.replace(/navigate\(\);\s*$/, ''), context);
(async () => {
  const html = context.projectExecute('project-1', {
    modules: [{ id: 'module-1', name: 'Módulo', tasks: [{ id: 'task', status: 'pendente', name: 'Tarefa' }] }],
  });
  assert.match(html, /execTask\('project-1','module-1','task'\)/);
  await context.execTask('project-1', 'module-1', 'task');
  assert.equal(requests.length, 0); // sem prévia, não há aprovação
  await context.previewTask('project-1', 'module-1', 'task');
  assert.deepEqual(JSON.parse(requests[0].options.body), { approved: false });
  assert.doesNotMatch(pre.textContent, /SIMULADO/);
  assert.equal(approval.disabled, false);
  await context.execTask('project-1', 'module-1', 'task');
  assert.equal(requests[1].url, '/api/projects/project-1/tasks/module-1/task/execute');
  assert.deepEqual(JSON.parse(requests[1].options.body), { approved: true });
  assert.match(pre.textContent, /SIMULADO/);
  assert.equal(approval.disabled, true);
  assert.equal(pre.style.display, 'block');
  const blockedHtml = context.projectExecute('project-1', {
    modules: [{ id: 'module-1', name: 'M', tasks: [{ id: 'task', name: 'T' }] }],
    module_blockers: { 'module-1': [{ code: 'DEPENDENCY_NOT_READY', message: 'Falta a base' }] },
  });
  assert.match(blockedHtml, /Execução bloqueada: Falta a base/);
  assert.match(blockedHtml, /id="approve-task" disabled onclick="execTask/);
  assert.match(blockedHtml, /previewTask\('project-1','module-1','task'\)/);
  const planHtml = context.projectPlan('project-1', {
    modules: [{ id: 'base', name: 'Base', tasks: [] },
              { id: 'module-1', name: 'M', depends_on: ['base'], tasks: [] }],
    module_blockers: { 'module-1': [{ code: 'DEPENDENCY_NOT_READY', message: 'Falta a base' }] },
  });
  assert.match(planHtml, /option value="base" selected/);
  assert.match(planHtml, /Salvar dependências/);
  assert.match(planHtml, /Falta a base/);
  const qaHtml = context.projectQa('project-1', {
    modules: [{ id: 'base', name: 'Base', tasks: [{ id: 'task', name: 'T' }] }], qa: [],
  });
  assert.match(qaHtml, /value="task:task"/);
  const relHtml = context.projectRelease('project-1', {release: {state: 'preparando', published: false, checklist: []}});
  assert.match(relHtml, /pronto_para_build/);
  assert.doesNotMatch(relHtml, /<option[^>]*>publicada<\/option>/);
  const oldRelease = context.projectRelease('project-1', {release: {state: 'publicada', published: true, unverified_claim: true, checklist: []}});
  assert.match(oldRelease, /declaração anterior de build\/verificação\/publicação/);
  assert.match(oldRelease, /Reclassificar declaração anterior/);
  assert.doesNotMatch(oldRelease, /Publicado: <b>sim<\/b>/);
  const card = context.moduleCard({ id: 'module-1', name: 'M', status: 'pendente', tasks: [{ id: 'task', name: 'T', status: 'pendente' }] });
  assert.match(card, /resetTask\(/);
  assert.doesNotMatch(card, /delTask\(/);
  const project = {
    entry: { name: 'Jogo', next_step: 'Revisar ideia' }, health: 'needs_review',
    resume: {}, conflicts: [],
    stage_gate: { stage: 'preparation', stage_label: 'Preparação', next_stage: 'mvp',
      next_stage_label: 'MVP jogável', status: 'blocked', history: [],
      blockers: [{ code: 'IDEA_UNDEFINED', message: 'Descreva a ideia' }] },
  };
  const blocked = context.projectOverview('project-1', project);
  assert.match(blocked, /Descreva a ideia/);
  assert.doesNotMatch(blocked, /onclick="advanceStage/);
  project.stage_gate.status = 'ready';
  project.stage_gate.blockers = [];
  const ready = context.projectOverview('project-1', project);
  const pipeline = context.renderStagePipeline(project.stage_gate);
  assert.match(pipeline, /aria-current="step"/);
  assert.match(ready, /advanceStage\('project-1','mvp'\)/);
  assert.doesNotMatch(ready, /stage-pipeline/); // renderProject a desenha uma única vez
  const post = context.fetch;
  context.fetch = async () => ({ ok: true, json: async () => ({
    ...project, modules: [], docs: [], qa: [], release: {}, providers: {}, engine: {},
  }) });
  await context.renderProject('project-1', 'plan');
  assert.equal((view.innerHTML.match(/class="stage-pipeline"/g) || []).length, 1);
  context.fetch = post;
  context.renderProject = async () => {};
  await context.advanceStage('project-1', 'mvp');
  assert.equal(requests[2].url, '/api/projects/project-1/stage');
  assert.deepEqual(JSON.parse(requests[2].options.body), {
    target: 'mvp', approved: true, note: 'Escopo revisado',
  });
  context.document.querySelectorAll = () => [];
  context.fetch = async () => ({ ok: true, json: async () => ({
    issues: [{ name: 'modules.json', project_id: 'project-1',
      message: 'JSON inválido', backup_available: true }],
  }) });
  await context.renderRecovery();
  assert.match(view.innerHTML, /Restaurar backup/);
  assert.match(view.innerHTML, /modules\.json/);
  context.prompt = () => '/tmp/backup-lia';
  context.fetch = async (url, options) => {
    requests.push({ url, options });
    return { ok: true, json: async () => ({ path: '/tmp/backup-lia/jogo' }) };
  };
  await context.exportProject('project-1');
  assert.equal(requests[3].url, '/api/projects/project-1/export');
  assert.deepEqual(JSON.parse(requests[3].options.body), { dest_dir: '/tmp/backup-lia' });
  assert.match(exportResult.textContent, /backup-lia\/jogo/);
  const handoffTask = { value: '0' };
  const handoffButton = { disabled: true };
  const handoffPreview = { style: { display: 'none' }, textContent: '' };
  const handoffStatus = { textContent: '' };
  context.document.getElementById = id => ({view, toast, 'handoff-task': handoffTask,
    'handoff-save': handoffButton, 'handoff-preview': handoffPreview,
    'handoff-status': handoffStatus})[id];
  context.fetch = async (url, options) => {
    requests.push({ url, options });
    return { ok: true, json: async () => url.endsWith('/preview')
      ? {content: '# Handoff revisável', digest: 'a'.repeat(64), warning: 'Revisar antes de compartilhar'}
      : url.endsWith('/handoff') && options.method === 'GET'
        ? {exists: false, content: '', stale: null}
        : {exists: true, stale: false} };
  };
  const handoffHtml = await context.projectHandoff('project-1', {
    modules: [{id: 'module-1', name: 'Módulo', tasks: [{id: 'task', name: 'Tarefa'}]}],
  });
  assert.match(handoffHtml, /Nenhum HANDOFF.md salvo/);
  assert.match(handoffHtml, /Confirmar e salvar HANDOFF.md/);
  context.wireHandoff('project-1', [{id: 'module-1', tasks: [{id: 'task'}]}], {exists: false});
  await context.window.saveHandoff();
  assert.equal(handoffButton.disabled, true);
  await context.window.previewHandoff();
  assert.equal(handoffPreview.textContent, '# Handoff revisável');
  assert.equal(handoffButton.disabled, false);
  assert.deepEqual(JSON.parse(requests[5].options.body), {module_id: 'module-1', task_id: 'task'});
  await context.window.saveHandoff();
  assert.deepEqual(JSON.parse(requests[6].options.body), {
    module_id: 'module-1', task_id: 'task', digest: 'a'.repeat(64), confirm: true, replace: false,
  });
  assert.equal(handoffButton.disabled, true);
  const evidenceFields = {
    'ev-target': {value: 'task:task'}, 'ev-qa': {value: 'qa-1'},
    'ev-path': {value: 'logs/saida.txt'}, 'ev-note': {value: 'gerado manualmente'},
  };
  context.document.getElementById = id => ({view, toast, ...evidenceFields})[id];
  context.fetch = async (url, options) => {
    requests.push({url, options});
    return {ok: true, json: async () => options.method === 'GET' ? {evidence: [{
      id: 'e-1', target_ref: 'task:task', path: 'logs/saida.txt', bytes: 4,
      sha256: 'abc', qa_id: 'qa-1', integrity: 'changed', verified_result: false,
    }]} : {id: 'e-2', integrity: 'intact', verified_result: false}};
  };
  const evidenceHtml = await context.projectEvidence('project-1', {
    modules: [{id: 'module-1', name: 'Módulo', tasks: [{id: 'task', name: 'Tarefa'}]}],
    qa: [{id: 'qa-1', target_ref: 'task:task', result: 'planejado'}],
  });
  assert.match(evidenceHtml, /id="ev-target"/);
  assert.match(evidenceHtml, /changed \(não valida o resultado\)/);
  assert.match(evidenceHtml, /qa-1/);
  assert.doesNotMatch(evidenceHtml, /conteúdo privado/);
  context.wireEvidence('project-1');
  await context.window.registerEvidence();
  const last = requests.at(-1);
  assert.equal(last.url, '/api/projects/project-1/evidence');
  assert.deepEqual(JSON.parse(last.options.body), {
    target_ref: 'task:task', qa_id: 'qa-1', path: 'logs/saida.txt', note: 'gerado manualmente',
  });
  const decisionsData = { decisions: [
    {topic: 'Plataforma', label: 'confirmado', value: 'PC', note: ''},
    {topic: 'Plataforma', label: 'suposição', value: 'mobile', note: '<script>nao</script>'},
  ], decisions_revision: 'revision-1', conflicts: [{ topic: 'Plataforma',
    confirmed: {value: 'PC'}, conflicting: {value: 'mobile', label: 'suposição'} }] };
  const decisionsHtml = context.projectDecisions('project-1', decisionsData);
  assert.match(decisionsHtml, /Conflitos a revisar/);
  assert.match(decisionsHtml, /DECISIONS\.md é regenerado/);
  assert.doesNotMatch(decisionsHtml, /<script>/);
  const decisionFields = {
    'dec-select': {value: '', onchange: null}, 'dec-topic': {value: 'Plataforma'},
    'dec-label': {value: 'confirmado'}, 'dec-value': {value: 'PC'}, 'dec-note': {value: 'revisado'},
  };
  context.document.getElementById = id => ({view, toast, ...decisionFields})[id];
  context.fetch = async (url, options) => {
    requests.push({url, options});
    return {ok: true, json: async () => ({revision: 'revision-2'})};
  };
  context.wireDecisions('project-1', decisionsData);
  await context.window.saveDecision();
  assert.equal(requests.at(-1).options.method, 'POST');
  assert.equal(requests.at(-1).url, '/api/projects/project-1/decisions');
  assert.equal(JSON.parse(requests.at(-1).options.body).revision, 'revision-1');
  decisionFields['dec-select'].value = '1';
  decisionFields['dec-select'].onchange();
  assert.equal(decisionFields['dec-value'].value, 'mobile');
  decisionFields['dec-value'].value = 'PC';
  await context.window.saveDecision();
  assert.equal(requests.at(-1).options.method, 'PUT');
  assert.equal(requests.at(-1).url, '/api/projects/project-1/decisions/1');
  assert.equal(JSON.parse(requests.at(-1).options.body).value, 'PC');
  decisionsData.decisions_projection_modified = true;
  const pending = requests.length;
  context.confirm = () => false;
  await context.window.saveDecision();
  assert.equal(requests.length, pending);
  context.confirm = () => true;
  await context.window.saveDecision();
  assert.equal(JSON.parse(requests.at(-1).options.body).replace_projection, true);
  console.log('UI regression: OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
