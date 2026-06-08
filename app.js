/* ===========================================================
   Painel de Marketing · CCAA Pelotas
   Tudo client-side, persistido em localStorage.
   =========================================================== */

const STORE_KEY = 'ccaa_mkt_v2';
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const STATUSES = [
  { key: 'todo',  label: 'Planejado',   ico: '○' },
  { key: 'doing', label: 'Em Produção', ico: '◐' },
  { key: 'done',  label: 'Concluído',   ico: '●' },
];
const CATEGORIES = ['Social Media','Conteúdo','Campanhas','Captação','Eventos','Parcerias','Branding','Operacional'];

/* ---------- estado ---------- */
let db = load();
let calDate = new Date();
save(); // garante que os dados iniciais fiquem persistidos

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return seed();
}
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(db)); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

/* ---------- dados de exemplo (primeira abertura) ---------- */
function seed() {
  const t = new Date();
  const d = (offset) => {
    const x = new Date(t); x.setDate(t.getDate() + offset);
    return x.toISOString().slice(0, 10);
  };
  return {
    tasks: [],
    ideas: [
      { id: uid(), title: 'Quadro fixo: Tradutor de Pelotês → English', desc: 'Série recorrente traduzindo gírias gaúchas. Hiperlocal e difícil de copiar. Risco baixo, alcance alto.', cat: 'Social Media', votes: 5 },
      { id: uid(), title: 'Minidocumentário "30 Dias Destravando"', desc: 'Acompanhar um aluno real do zero à primeira conversa. Prova social máxima. Risco alto, retorno alto.', cat: 'Conteúdo', votes: 4 },
      { id: uid(), title: 'Ação de rua na FENADOCE', desc: 'Desafio de inglês na feira com brinde. Potencial viral, exige cuidado com imagem e tom.', cat: 'Eventos', votes: 4 },
      { id: uid(), title: 'Collab "Cardápio em Inglês"', desc: 'Traduzir cardápio de negócio local e cruzar audiências. Parceria de baixo risco.', cat: 'Parcerias', votes: 3 },
      { id: uid(), title: 'Provocação: "Decorar verbo não te faz falar inglês"', desc: 'Reel de quebra de padrão que vira o diferencial do método. Gera debate; exige payoff impecável.', cat: 'Branding', votes: 2 },
    ],
    results: [
      { id: uid(), title: 'Reels da metodologia CCAA', desc: 'Vídeo curto explicando o método de conversação.', metric: 'Alcance', result: '12 mil contas · 38 leads', date: d(-15) },
      { id: uid(), title: 'Parceria com a Sunset Run', desc: 'Post colaborativo no evento de corrida da cidade.', metric: 'Crescimento', result: '+220 seguidores em 3 dias', date: d(-2) },
    ],
    foco: 'Captação para o 2º semestre',
  };
}

/* ===========================================================
   NAVEGAÇÃO
   =========================================================== */
const TITLES = {
  painel:     ['Dashboard', 'Visão geral do mês para o alinhamento da equipe'],
  calendario: ['Planejamento Editorial', 'Planejamento das ações de marketing por data'],
  tarefas:    ['Plano de Ação', 'Acompanhamento das entregas do mês'],
  ideias:     ['Pipeline de Ideias', 'Backlog criativo para validação e priorização'],
  resultados: ['Analytics', 'Indicadores e resultados que comprovam valor'],
};

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});
function switchView(v) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  document.querySelectorAll('.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + v));
  document.getElementById('viewTitle').textContent = TITLES[v][0];
  document.getElementById('viewSub').textContent = TITLES[v][1];
  if (v === 'painel') renderPainel();
  if (v === 'calendario') renderCalendar();
  if (v === 'tarefas') renderBoard();
  if (v === 'ideias') renderIdeas();
  if (v === 'resultados') { renderResults(); renderInstagram(); }
}

/* ===========================================================
   PAINEL INSTAGRAM — dados reais do @ccaa.pelotas (Analytics)
   =========================================================== */
async function renderInstagram() {
  const el = document.getElementById('igPanel');
  if (!el) return;
  el.innerHTML = '<div class="ig-loading">Carregando dados do Instagram…</div>';
  let data;
  try {
    const r = await fetch('data/instagram.json?cb=' + Date.now());
    if (!r.ok) throw new Error('http');
    data = await r.json();
  } catch (e) {
    el.innerHTML = '<div class="ig-empty">Dados do Instagram indisponíveis aqui (abra pelo site publicado). Para atualizar os números, peça uma nova coleta.</div>';
    return;
  }
  const p = data.profile || {}, posts = data.posts || [];
  const inter = x => (x.likes || 0) + (x.comments || 0);
  const reels = posts.filter(x => x.kind === 'Reel'), est = posts.filter(x => x.kind !== 'Reel');
  const avg = a => a.length ? Math.round(a.reduce((s, x) => s + inter(x), 0) / a.length) : 0;
  const avgReel = avg(reels), avgEst = avg(est);
  const mult = avgEst ? (avgReel / avgEst).toFixed(1) : '—';
  const totalInter = posts.reduce((s, x) => s + inter(x), 0);
  const engRate = (p.followers && posts.length) ? ((totalInter / posts.length / p.followers) * 100).toFixed(2) : '—';
  const fmt = d => { if (!d) return '—'; const [y, m, dd] = d.split('-'); return `${dd}/${m}`; };
  const upd = data.updatedAt ? fmt(data.updatedAt) + '/' + data.updatedAt.slice(0, 4) : '';

  const rows = posts.map(x => `
    <tr class="${x.kind === 'Reel' ? 'reel' : ''}">
      <td><span class="ig-badge ${x.kind === 'Reel' ? 'reel' : 'est'}">${x.kind}</span></td>
      <td>${fmt(x.date)}</td>
      <td class="num">${(x.likes || 0).toLocaleString('pt-BR')}</td>
      <td class="num">${(x.comments || 0).toLocaleString('pt-BR')}</td>
      <td class="num">${x.views != null ? x.views.toLocaleString('pt-BR') : '—'}</td>
      <td class="ig-cap"><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.caption || '(sem legenda)')}</a></td>
    </tr>`).join('');

  el.innerHTML = `
    <div class="ig-head">
      <h2><span class="ig-dot"></span> Instagram · @${esc(p.username || 'ccaa.pelotas')}</h2>
      <span class="ig-meta">Atualizado em ${upd} · <a href="https://www.instagram.com/${esc(p.username || 'ccaa.pelotas')}/" target="_blank" rel="noopener">ver perfil</a></span>
    </div>
    <div class="ig-kpis">
      <div class="ig-kpi"><div class="v">${(p.followers || 0).toLocaleString('pt-BR')}</div><div class="l">Seguidores</div></div>
      <div class="ig-kpi"><div class="v">${(p.posts || 0).toLocaleString('pt-BR')}</div><div class="l">Publicações</div></div>
      <div class="ig-kpi"><div class="v">${Math.round(totalInter / (posts.length || 1))}</div><div class="l">Interações/post (média)</div></div>
      <div class="ig-kpi"><div class="v">${engRate}%</div><div class="l">Taxa de engajamento</div></div>
    </div>
    ${avgEst ? `<div class="ig-insight">⚡ <span>Seus <strong>Reels</strong> engajam <strong>${mult}x mais</strong> que posts estáticos (média de <strong>${avgReel}</strong> vs <strong>${avgEst}</strong> interações). Nos últimos ${posts.length} posts, só ${reels.length} foram Reels — <strong>priorizar Reels</strong> é a alavanca mais rápida de alcance.</span></div>` : ''}
    <div class="ig-table-wrap">
      <table class="ig-table">
        <thead><tr><th>Tipo</th><th>Data</th><th class="num">Curtidas</th><th class="num">Coment.</th><th class="num">Views</th><th>Publicação</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/* ===========================================================
   PAINEL
   =========================================================== */
function thisMonthTasks() {
  const y = calDate.getFullYear(), m = calDate.getMonth();
  return db.tasks.filter(t => {
    if (!t.date) return false;
    const dt = new Date(t.date + 'T00:00');
    return dt.getFullYear() === y && dt.getMonth() === m;
  });
}
function renderPainel() {
  const all = db.tasks;
  const done = all.filter(t => t.status === 'done').length;
  const doing = all.filter(t => t.status === 'doing').length;
  const todo = all.filter(t => t.status === 'todo').length;
  const total = all.length || 1;

  document.getElementById('kpis').innerHTML = `
    ${kpi('', all.length, 'Entregas no mês')}
    ${kpi('amber', doing, 'Em produção')}
    ${kpi('green', done, 'Concluídas')}
    ${kpi('blue', db.ideas.length, 'Ideias no pipeline')}
  `;
  animateCounts();

  const pct = Math.round((done / total) * 100);
  document.getElementById('focoMes').textContent = db.foco || '';
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressLabel').textContent = pct + '% concluído';
  document.getElementById('statusBreak').innerHTML = `
    <span><i class="dot todo"></i> ${todo} planejadas</span>
    <span><i class="dot doing"></i> ${doing} em produção</span>
    <span><i class="dot done"></i> ${done} concluídas</span>
  `;

  // próximas ações (futuras, não concluídas, ordenadas)
  const today = new Date().toISOString().slice(0, 10);
  const up = db.tasks
    .filter(t => t.date && t.date >= today && t.status !== 'done')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);
  document.getElementById('upcoming').innerHTML = up.length ? up.map(t => {
    const dt = new Date(t.date + 'T00:00');
    return `<li>
      <span class="date-badge">${dt.getDate()}<small>${MONTHS[dt.getMonth()].slice(0,3)}</small></span>
      <span style="flex:1">${esc(t.title)}</span>
      <span class="muted">${esc(t.resp || '')}</span>
    </li>`;
  }).join('') : `<li class="empty">Nenhuma ação futura agendada.</li>`;

  // resultados em destaque
  const res = [...db.results].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 3);
  document.getElementById('painelResultados').innerHTML = res.length ? res.map(r =>
    `<li><span style="flex:1">${esc(r.title)}</span><span class="badge-num">${esc(r.result || '✓')}</span></li>`
  ).join('') : `<li class="empty">Registre o que deu certo.</li>`;

  // ideias mais votadas
  const ideas = [...db.ideas].sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 3);
  document.getElementById('painelIdeias').innerHTML = ideas.length ? ideas.map(i =>
    `<li><span style="flex:1">${esc(i.title)}</span><span class="badge-num">▲ ${i.votes || 0}</span></li>`
  ).join('') : `<li class="empty">Sem ideias ainda.</li>`;
}
function kpi(cls, val, label) {
  return `<div class="kpi ${cls}"><div class="kpi-val" data-to="${val}">${val}</div><div class="kpi-label">${label}</div></div>`;
}
function animateCounts() {
  document.querySelectorAll('.kpi-val[data-to]').forEach(el => {
    const to = +el.dataset.to || 0;
    if (to === 0) { el.textContent = '0'; return; }
    let cur = 0; const step = Math.max(1, Math.ceil(to / 16));
    el.textContent = '0';
    const tick = () => { cur += step; if (cur >= to) el.textContent = to; else { el.textContent = cur; requestAnimationFrame(tick); } };
    requestAnimationFrame(tick);
  });
}

/* ===========================================================
   CALENDÁRIO
   =========================================================== */
function renderCalendar() {
  const y = calDate.getFullYear(), m = calDate.getMonth();
  document.getElementById('calMonthLabel').textContent = `${MONTHS[m]} ${y}`;
  const first = new Date(y, m, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);

  const cells = [];
  // dias do mês anterior (preenchimento)
  const prevDays = new Date(y, m, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) cells.push({ day: prevDays - i, muted: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, muted: false, y, m });
  while (cells.length % 7 !== 0) cells.push({ day: cells.length, muted: true, filler: true });

  const grid = document.getElementById('calGrid');
  grid.innerHTML = cells.map(c => {
    if (c.muted) return `<div class="cal-cell muted-cell"><span class="cal-daynum">${c.filler ? '' : c.day}</span></div>`;
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(c.day).padStart(2, '0')}`;
    const evs = db.tasks.filter(t => t.date === dateStr);
    const isToday = dateStr === todayStr;
    const shown = evs.slice(0, 3).map(t =>
      `<div class="cal-event ${t.status}" data-id="${t.id}" title="${esc(t.title)}">${esc(t.title)}</div>`
    ).join('');
    const more = evs.length > 3 ? `<span class="cal-more">+${evs.length - 3} mais</span>` : '';
    return `<div class="cal-cell ${isToday ? 'today' : ''}" data-date="${dateStr}">
      <span class="cal-daynum">${c.day}</span>${shown}${more}
    </div>`;
  }).join('');

  // clique em célula -> nova tarefa naquele dia; clique em evento -> editar
  grid.querySelectorAll('.cal-cell[data-date]').forEach(cell => {
    cell.addEventListener('click', e => {
      const evEl = e.target.closest('.cal-event');
      if (evEl) { openTaskModal(evEl.dataset.id); e.stopPropagation(); }
      else openTaskModal(null, cell.dataset.date);
    });
  });
}
document.getElementById('prevMonth').onclick = () => { calDate.setMonth(calDate.getMonth() - 1); renderCalendar(); };
document.getElementById('nextMonth').onclick = () => { calDate.setMonth(calDate.getMonth() + 1); renderCalendar(); };
document.getElementById('todayBtn').onclick = () => { calDate = new Date(); renderCalendar(); };
document.getElementById('printBtn').onclick = () => { buildPrintSheet(); window.print(); };

/* ---- Folha de impressão: agenda de papel sempre sincronizada ---- */
function buildPrintSheet() {
  const y = calDate.getFullYear(), m = calDate.getMonth();
  const todayStr = new Date().toISOString().slice(0, 10);
  const startDow = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  // grade do mês em semanas
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  let rows = '';
  for (let w = 0; w < cells.length / 7; w++) {
    rows += '<tr>' + cells.slice(w * 7, w * 7 + 7).map(d => {
      if (!d) return '<td class="off"></td>';
      const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const evs = db.tasks.filter(t => t.date === ds);
      const evHtml = evs.slice(0, 4).map(t => `<span class="ps-ev ${t.status}">${esc(t.title)}</span>`).join('');
      const more = evs.length > 4 ? `<span class="ps-ev">+${evs.length - 4}…</span>` : '';
      return `<td><span class="pd-num ${ds === todayStr ? 'today' : ''}">${d}</span>${evHtml}${more}</td>`;
    }).join('') + '</tr>';
  }

  // checklist do mês
  const monthTasks = thisMonthTasks().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const checklist = monthTasks.map(t => {
    const dt = new Date(t.date + 'T00:00');
    return `<li class="${t.status === 'done' ? 'done' : ''}">
      <span>${esc(t.title)}</span>
      <span class="pc-meta">${esc(t.resp || '')} · ${dt.getDate()}/${dt.getMonth() + 1}</span>
    </li>`;
  }).join('') || '<li style="border:none">Sem tarefas neste mês.</li>';

  const notesLines = Array.from({ length: 7 }, () => '<div class="ps-notes-line"></div>').join('');
  const printed = `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`;

  document.getElementById('printSheet').innerHTML = `
    <div class="ps-head">
      <img class="ps-mark-img" src="assets/ccaa-logo.png" alt="CCAA" />
      <div>
        <div class="ps-title">Agenda de Marketing</div>
        <div class="ps-sub">CCAA Pelotas</div>
      </div>
      <div class="ps-month"><strong>${MONTHS[m]}</strong><span class="ps-sub">${y}</span></div>
    </div>
    ${db.foco ? `<div class="ps-foco">🎯 Foco do mês: <strong>${esc(db.foco)}</strong></div>` : ''}
    <table class="ps-cal">
      <thead><tr><th>Dom</th><th>Seg</th><th>Ter</th><th>Qua</th><th>Qui</th><th>Sex</th><th>Sáb</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="ps-cols">
      <div class="ps-section">
        <h3>✓ Tarefas do mês</h3>
        <ul class="ps-check">${checklist}</ul>
      </div>
      <div class="ps-section">
        <h3>✎ Anotações da reunião</h3>
        ${notesLines}
      </div>
    </div>
    <div class="ps-foot">
      <span>Gerado pelo Painel de Marketing · CCAA Pelotas</span>
      <span>Impresso em ${printed}</span>
    </div>`;
}

/* ===========================================================
   KANBAN
   =========================================================== */
function renderBoard() {
  const search = (document.getElementById('taskSearch').value || '').toLowerCase();
  const catF = document.getElementById('catFilter').value;
  const board = document.getElementById('board');

  board.innerHTML = STATUSES.map(s => {
    const items = db.tasks.filter(t =>
      t.status === s.key &&
      (!search || t.title.toLowerCase().includes(search) || (t.desc || '').toLowerCase().includes(search)) &&
      (!catF || t.cat === catF)
    ).sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));

    return `<div class="column" data-status="${s.key}">
      <div class="column-head"><span class="dot ${s.key}"></span> ${s.label} <span class="count">${items.length}</span></div>
      ${items.map(taskCard).join('') || '<div class="empty">Sem tarefas</div>'}
    </div>`;
  }).join('');

  setupDragDrop();
  board.querySelectorAll('.task-card').forEach(card => {
    card.querySelector('.tc-edit').onclick = e => { e.stopPropagation(); openTaskModal(card.dataset.id); };
    card.querySelector('.tc-del').onclick = e => {
      e.stopPropagation();
      if (confirm('Excluir esta entrega definitivamente?')) {
        db.tasks = db.tasks.filter(x => x.id !== card.dataset.id);
        save(); toast('Entrega excluída'); renderBoard();
      }
    };
  });
}
function taskCard(t) {
  const dt = t.date ? new Date(t.date + 'T00:00') : null;
  const dateStr = dt ? `${dt.getDate()}/${dt.getMonth() + 1}` : '';
  const initials = (t.resp || '?').slice(0, 2).toUpperCase();
  return `<div class="task-card" draggable="true" data-id="${t.id}">
    ${t.cat ? `<span class="tc-cat">${esc(t.cat)}</span>` : ''}
    <h4>${esc(t.title)}</h4>
    ${t.desc ? `<p>${esc(t.desc)}</p>` : ''}
    <div class="tc-foot">
      <span class="tc-resp" title="${esc(t.resp || '')}">${esc(initials)}</span>
      ${dateStr ? `<span class="tc-date">${dateStr}</span>` : ''}
      <span class="tc-actions">
        <button class="tc-mini tc-edit">Editar</button>
        <button class="tc-mini tc-del">Excluir</button>
      </span>
    </div>
  </div>`;
}
function setupDragDrop() {
  let dragId = null;
  document.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('dragstart', () => { dragId = card.dataset.id; card.classList.add('dragging'); });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });
  document.querySelectorAll('.column').forEach(col => {
    col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('drag-over'); });
    col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
    col.addEventListener('drop', e => {
      e.preventDefault(); col.classList.remove('drag-over');
      const t = db.tasks.find(x => x.id === dragId);
      if (t && t.status !== col.dataset.status) {
        const becameDone = col.dataset.status === 'done' && t.status !== 'done';
        t.status = col.dataset.status; save(); renderBoard();
        if (becameDone) confetti();
      }
    });
  });
}
document.getElementById('taskSearch').oninput = renderBoard;
document.getElementById('catFilter').onchange = renderBoard;

/* ===========================================================
   IDEIAS
   =========================================================== */
function renderIdeas() {
  const grid = document.getElementById('ideasGrid');
  const ideas = [...db.ideas].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  grid.innerHTML = ideas.length ? ideas.map(i => `
    <div class="idea-card">
      ${i.cat ? `<span class="ic-cat">${esc(i.cat)}</span>` : ''}
      <h3>${esc(i.title)}</h3>
      <p>${esc(i.desc || '')}</p>
      <div class="ic-foot">
        <button class="vote-btn" data-vote="${i.id}">▲ ${i.votes || 0}</button>
        <span class="card-actions">
          <button class="tc-mini" data-edit-idea="${i.id}">Editar</button>
        </span>
      </div>
    </div>`).join('') : `<div class="empty">Nenhuma ideia ainda. Clique em "+ Nova ideia".</div>`;

  grid.querySelectorAll('[data-vote]').forEach(b => b.onclick = () => {
    const i = db.ideas.find(x => x.id === b.dataset.vote);
    i.votes = (i.votes || 0) + 1; save(); renderIdeas();
  });
  grid.querySelectorAll('[data-edit-idea]').forEach(b => b.onclick = () => openIdeaModal(b.dataset.editIdea));
}

/* ===========================================================
   RESULTADOS
   =========================================================== */
function renderResults() {
  const grid = document.getElementById('resultsGrid');
  const res = [...db.results].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  grid.innerHTML = res.length ? res.map(r => {
    const dt = r.date ? new Date(r.date + 'T00:00') : null;
    const dateStr = dt ? `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}` : '';
    return `<div class="result-card">
      ${r.metric ? `<span class="rc-metric">📈 ${esc(r.metric)}</span>` : ''}
      <h3>${esc(r.title)}</h3>
      <p>${esc(r.desc || '')}</p>
      ${r.result ? `<div class="rc-result">✓ ${esc(r.result)}</div>` : ''}
      <div class="rc-foot">
        <span class="muted">${dateStr}</span>
        <span class="card-actions"><button class="tc-mini" data-edit-res="${r.id}">Editar</button></span>
      </div>
    </div>`;
  }).join('') : `<div class="empty">Nenhum resultado registrado ainda.</div>`;

  grid.querySelectorAll('[data-edit-res]').forEach(b => b.onclick = () => openResultModal(b.dataset.editRes));
}

/* ===========================================================
   MODAL (genérico)
   =========================================================== */
const overlay = document.getElementById('modalOverlay');
const modalForm = document.getElementById('modalForm');
const modalTitle = document.getElementById('modalTitle');
document.getElementById('modalClose').onclick = closeModal;
overlay.onclick = e => { if (e.target === overlay) closeModal(); };
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
function closeModal() { overlay.hidden = true; modalForm.innerHTML = ''; }

function field(label, name, type = 'text', value = '', opts = null) {
  const v = esc(value ?? '');
  if (type === 'textarea') return `<div class="field"><label>${label}</label><textarea name="${name}">${v}</textarea></div>`;
  if (type === 'select') {
    const options = opts.map(o => `<option ${o === value ? 'selected' : ''}>${esc(o)}</option>`).join('');
    return `<div class="field"><label>${label}</label><select name="${name}"><option value=""></option>${options}</select></div>`;
  }
  return `<div class="field"><label>${label}</label><input type="${type}" name="${name}" value="${v}" /></div>`;
}

/* ---- Tarefa ---- */
function openTaskModal(id, presetDate) {
  const t = id ? db.tasks.find(x => x.id === id) : null;
  modalTitle.textContent = t ? 'Editar tarefa' : 'Nova tarefa';
  modalForm.innerHTML = `
    ${field('Título', 'title', 'text', t?.title || '')}
    ${field('Descrição', 'desc', 'textarea', t?.desc || '')}
    <div class="field-row">
      ${field('Categoria', 'cat', 'select', t?.cat || '', CATEGORIES)}
      ${field('Responsável', 'resp', 'text', t?.resp || '')}
    </div>
    <div class="field-row">
      ${field('Data', 'date', 'date', t?.date || presetDate || '')}
      ${field('Status', 'status', 'select', t?.status ? STATUSES.find(s=>s.key===t.status).label : 'Planejado', STATUSES.map(s=>s.label))}
    </div>
    <div class="modal-actions">
      ${t ? '<button type="button" class="btn-del" data-del>Excluir</button>' : ''}
      <button type="button" class="btn-ghost" data-cancel>Cancelar</button>
      <button type="submit" class="btn-primary">${t ? 'Salvar' : 'Criar'}</button>
    </div>`;
  wireModal(data => {
    const statusKey = STATUSES.find(s => s.label === data.status)?.key || 'todo';
    const becameDone = statusKey === 'done' && (!t || t.status !== 'done');
    if (t) Object.assign(t, { ...data, status: statusKey });
    else db.tasks.push({ id: uid(), ...data, status: statusKey });
    save(); toast(t ? 'Entrega atualizada' : 'Entrega criada'); refreshAll();
    if (becameDone) confetti();
  }, t && (() => { db.tasks = db.tasks.filter(x => x.id !== id); save(); toast('Entrega excluída'); refreshAll(); }));
}

/* ---- Ideia ---- */
function openIdeaModal(id) {
  const i = id ? db.ideas.find(x => x.id === id) : null;
  modalTitle.textContent = i ? 'Editar ideia' : 'Nova ideia';
  modalForm.innerHTML = `
    ${field('Título da ideia', 'title', 'text', i?.title || '')}
    ${field('Descrição', 'desc', 'textarea', i?.desc || '')}
    ${field('Categoria', 'cat', 'select', i?.cat || '', CATEGORIES)}
    <div class="modal-actions">
      ${i ? '<button type="button" class="btn-del" data-del>Excluir</button>' : ''}
      <button type="button" class="btn-ghost" data-cancel>Cancelar</button>
      <button type="submit" class="btn-primary">${i ? 'Salvar' : 'Criar'}</button>
    </div>`;
  wireModal(data => {
    if (i) Object.assign(i, data);
    else db.ideas.push({ id: uid(), ...data, votes: 0 });
    save(); toast(i ? 'Ideia atualizada' : 'Ideia adicionada'); refreshAll();
  }, i && (() => { db.ideas = db.ideas.filter(x => x.id !== id); save(); toast('Ideia excluída'); refreshAll(); }));
}

/* ---- Resultado ---- */
function openResultModal(id) {
  const r = id ? db.results.find(x => x.id === id) : null;
  modalTitle.textContent = r ? 'Editar resultado' : 'Novo resultado';
  modalForm.innerHTML = `
    ${field('O que foi feito', 'title', 'text', r?.title || '')}
    ${field('Descrição', 'desc', 'textarea', r?.desc || '')}
    <div class="field-row">
      ${field('Métrica', 'metric', 'text', r?.metric || '')}
      ${field('Data', 'date', 'date', r?.date || '')}
    </div>
    ${field('Resultado (número/impacto)', 'result', 'text', r?.result || '')}
    <div class="modal-actions">
      ${r ? '<button type="button" class="btn-del" data-del>Excluir</button>' : ''}
      <button type="button" class="btn-ghost" data-cancel>Cancelar</button>
      <button type="submit" class="btn-primary">${r ? 'Salvar' : 'Criar'}</button>
    </div>`;
  wireModal(data => {
    if (r) Object.assign(r, data);
    else db.results.push({ id: uid(), ...data });
    save(); toast(r ? 'Resultado atualizado' : 'Resultado registrado'); refreshAll();
  }, r && (() => { db.results = db.results.filter(x => x.id !== id); save(); toast('Resultado excluído'); refreshAll(); }));
}

function wireModal(onSubmit, onDelete) {
  overlay.hidden = false;
  modalForm.onsubmit = e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(modalForm).entries());
    if (!data.title || !data.title.trim()) { toast('Dê um título primeiro 🙂'); return; }
    onSubmit(data); closeModal();
  };
  modalForm.querySelector('[data-cancel]').onclick = closeModal;
  const del = modalForm.querySelector('[data-del]');
  if (del && onDelete) del.onclick = () => { if (confirm('Excluir definitivamente?')) { onDelete(); closeModal(); } };
}

/* ===========================================================
   AÇÕES GLOBAIS
   =========================================================== */
document.getElementById('quickAddBtn').onclick = () => openTaskModal();
document.getElementById('addIdeaBtn').onclick = () => openIdeaModal();
document.getElementById('addResultBtn').onclick = () => openResultModal();

function refreshAll() {
  const active = document.querySelector('.view.active').id.replace('view-', '');
  switchView(active);
  if (!document.getElementById('manageOverlay').hidden) renderManage();
}

/* ---- Exportar / Importar ---- */
document.getElementById('exportBtn').onclick = () => {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `marketing-ccaa-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  toast('Backup exportado');
};
document.getElementById('importBtn').onclick = () => document.getElementById('importFile').click();
document.getElementById('importFile').onchange = e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data.tasks) throw new Error();
      db = data; save(); toast('Dados importados'); refreshAll();
    } catch { toast('Arquivo inválido'); }
  };
  reader.readAsText(file);
};

/* ---- Toast ---- */
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.hidden = true, 2400);
}

/* ---- util ---- */
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

/* ===========================================================
   MODO APRESENTAÇÃO — deck para a reunião de alinhamento
   =========================================================== */
const PRES = { i: 0, slides: [] };
function openPresent() {
  PRES.slides = buildSlides(); PRES.i = 0;
  document.getElementById('presentMode').hidden = false;
  renderPresent();
  document.addEventListener('keydown', presentKeys);
}
function closePresent() {
  document.getElementById('presentMode').hidden = true;
  document.removeEventListener('keydown', presentKeys);
}
function presentKeys(e) {
  if (e.key === 'Escape') closePresent();
  else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); presentGo(1); }
  else if (e.key === 'ArrowLeft') presentGo(-1);
}
function presentGo(d) { PRES.i = Math.max(0, Math.min(PRES.slides.length - 1, PRES.i + d)); renderPresent(); }
function renderPresent() {
  document.getElementById('presentStage').innerHTML = PRES.slides[PRES.i];
  document.getElementById('presentDots').innerHTML =
    PRES.slides.map((_, i) => `<i class="${i === PRES.i ? 'on' : ''}" data-i="${i}"></i>`).join('');
  document.querySelectorAll('#presentDots i').forEach(d => d.onclick = () => { PRES.i = +d.dataset.i; renderPresent(); });
}
function buildSlides() {
  const all = db.tasks;
  const done = all.filter(t => t.status === 'done'), doing = all.filter(t => t.status === 'doing');
  const pct = Math.round(done.length / (all.length || 1) * 100);
  const now = new Date(), today = now.toISOString().slice(0, 10);
  const wk = new Date(); wk.setDate(wk.getDate() - 7); const wkStr = wk.toISOString().slice(0, 10);
  const week = db.tasks.filter(t => t.status === 'done' && t.date >= wkStr);
  const up = db.tasks.filter(t => t.date && t.date >= today && t.status !== 'done').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const res = [...db.results].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 3);
  const ideas = [...db.ideas].sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 4);
  const S = [];
  S.push(`<div class="present-slide">
    <div class="present-eyebrow">Reunião de Marketing · CCAA Pelotas</div>
    <h1>${MONTHS[now.getMonth()]} de ${now.getFullYear()}</h1>
    <div class="present-foco-bar"><div class="present-foco-fill" style="width:${pct}%"></div></div>
    <p class="present-sub">Foco do mês: <strong>${esc(db.foco || '—')}</strong> · ${pct}% concluído</p>
  </div>`);
  S.push(`<div class="present-slide">
    <div class="present-eyebrow">Visão geral</div><h1>O mês em números</h1>
    <div class="present-grid">
      <div class="present-stat"><div class="n">${all.length}</div><div class="l">Entregas no mês</div></div>
      <div class="present-stat"><div class="n">${done.length}</div><div class="l">Concluídas</div></div>
      <div class="present-stat"><div class="n">${doing.length}</div><div class="l">Em produção</div></div>
      <div class="present-stat"><div class="n">${db.ideas.length}</div><div class="l">Ideias no pipeline</div></div>
    </div></div>`);
  S.push(`<div class="present-slide">
    <div class="present-eyebrow">Entregue na última semana</div><h1>O que saiu do papel</h1>
    <ul class="present-list">${week.length ? week.map(t => `<li>✓ ${esc(t.title)}<span class="tag">${esc(t.cat || '')}</span></li>`).join('') : '<li>—</li>'}</ul></div>`);
  S.push(`<div class="present-slide">
    <div class="present-eyebrow">A seguir</div><h1>Próximas entregas</h1>
    <ul class="present-list">${up.length ? up.map(t => { const dt = new Date(t.date + 'T00:00'); return `<li><strong>${dt.getDate()}/${dt.getMonth() + 1}</strong> · ${esc(t.title)}<span class="tag">${esc(t.resp || '')}</span></li>`; }).join('') : '<li>—</li>'}</ul></div>`);
  S.push(`<div class="present-slide">
    <div class="present-eyebrow">Prova de valor</div><h1>Destaques de performance</h1>
    <ul class="present-list">${res.length ? res.map(r => `<li>${esc(r.title)}<span class="tag">${esc(r.result || '')}</span></li>`).join('') : '<li>—</li>'}</ul></div>`);
  S.push(`<div class="present-slide">
    <div class="present-eyebrow">Em avaliação</div><h1>Ideias prioritárias</h1>
    <ul class="present-list">${ideas.length ? ideas.map(i => `<li>${esc(i.title)}<span class="tag">▲ ${i.votes || 0}</span></li>`).join('') : '<li>—</li>'}</ul></div>`);
  return S;
}

/* ===========================================================
   COMMAND PALETTE — Ctrl/Cmd + K
   =========================================================== */
let cmdkSel = 0, cmdkFiltered = [];
function cmdkActions() {
  const a = [
    { g: 'Navegar', ico: '◧', label: 'Dashboard', run: () => switchView('painel') },
    { g: 'Navegar', ico: '◧', label: 'Planejamento', run: () => switchView('calendario') },
    { g: 'Navegar', ico: '◧', label: 'Plano de Ação', run: () => switchView('tarefas') },
    { g: 'Navegar', ico: '◧', label: 'Pipeline', run: () => switchView('ideias') },
    { g: 'Navegar', ico: '◧', label: 'Analytics', run: () => switchView('resultados') },
    { g: 'Criar', ico: '+', label: 'Nova entrega', run: () => openTaskModal() },
    { g: 'Criar', ico: '+', label: 'Nova ideia', run: () => openIdeaModal() },
    { g: 'Criar', ico: '+', label: 'Novo resultado', run: () => openResultModal() },
    { g: 'Ações', ico: '⚙', label: 'Gerenciar entregas', run: openManage },
    { g: 'Ações', ico: '▶', label: 'Iniciar apresentação', run: openPresent },
    { g: 'Ações', ico: '≣', label: 'Gerar resumo da reunião', run: openSummary },
  ];
  db.tasks.forEach(t => a.push({ g: 'Entregas', ico: '•', label: t.title, sub: 'abrir', run: () => openTaskModal(t.id) }));
  return a;
}
function openCmdk() {
  document.getElementById('cmdk').hidden = false;
  const inp = document.getElementById('cmdkInput');
  inp.value = ''; renderCmdk(''); inp.focus();
}
function closeCmdk() { document.getElementById('cmdk').hidden = true; }
function renderCmdk(q) {
  const ql = q.toLowerCase().trim();
  cmdkFiltered = cmdkActions().filter(a => !ql || a.label.toLowerCase().includes(ql) || a.g.toLowerCase().includes(ql));
  cmdkSel = 0;
  let html = '', lastG = null;
  cmdkFiltered.forEach((a, i) => {
    if (a.g !== lastG) { html += `<li class="k-group">${a.g}</li>`; lastG = a.g; }
    html += `<li data-i="${i}" class="${i === 0 ? 'sel' : ''}"><span class="k-ico">${a.ico}</span> ${esc(a.label)} ${a.sub ? `<span class="k-sub">${a.sub}</span>` : ''}</li>`;
  });
  const list = document.getElementById('cmdkList');
  list.innerHTML = html || '<li class="k-group">Nada encontrado</li>';
  list.querySelectorAll('li[data-i]').forEach(li => li.onclick = () => runCmdk(+li.dataset.i));
}
function runCmdk(i) { const a = cmdkFiltered[i]; if (a) { closeCmdk(); a.run(); } }
function cmdkMove(d) {
  const items = [...document.querySelectorAll('#cmdkList li[data-i]')];
  if (!items.length) return;
  cmdkSel = Math.max(0, Math.min(items.length - 1, cmdkSel + d));
  items.forEach((li, i) => li.classList.toggle('sel', i === cmdkSel));
  items[cmdkSel].scrollIntoView({ block: 'nearest' });
}

/* ===========================================================
   RESUMO DA REUNIÃO — texto pronto para copiar
   =========================================================== */
function buildSummaryText() {
  const all = db.tasks;
  const done = all.filter(t => t.status === 'done'), doing = all.filter(t => t.status === 'doing'), todo = all.filter(t => t.status === 'todo');
  const pct = Math.round(done.length / (all.length || 1) * 100);
  const now = new Date(), today = now.toISOString().slice(0, 10);
  const up = db.tasks.filter(t => t.date && t.date >= today && t.status !== 'done').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
  const res = [...db.results].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 3);
  const L = [];
  L.push(`RESUMO DE MARKETING — CCAA PELOTAS`);
  L.push(`${MONTHS[now.getMonth()]} de ${now.getFullYear()}`);
  L.push(`--------------------------------------`);
  L.push(`Foco do mes: ${db.foco || '—'}  (${pct}% concluido)`);
  L.push(`Entregas: ${all.length} no total | ${done.length} concluidas | ${doing.length} em producao | ${todo.length} planejadas`);
  L.push(``);
  L.push(`CONCLUIDAS:`);
  done.forEach(t => L.push(`  - ${t.title}`));
  L.push(``);
  L.push(`PROXIMAS ENTREGAS:`);
  up.forEach(t => { const dt = new Date(t.date + 'T00:00'); L.push(`  - ${dt.getDate()}/${dt.getMonth() + 1} ${t.title} (${t.resp || '—'})`); });
  L.push(``);
  L.push(`DESTAQUES DE PERFORMANCE:`);
  res.forEach(r => L.push(`  - ${r.title}: ${r.result || ''}`));
  return L.join('\n');
}
function openSummary() {
  modalTitle.textContent = 'Resumo da reunião';
  modalForm.innerHTML = `
    <div class="field">
      <label>Pronto para copiar e colar no WhatsApp ou e-mail 👇</label>
      <textarea id="summaryText" style="min-height:300px;font-family:ui-monospace,monospace;font-size:12.5px;line-height:1.55">${esc(buildSummaryText())}</textarea>
    </div>
    <div class="modal-actions">
      <button type="button" class="btn-ghost" data-cancel>Fechar</button>
      <button type="button" class="btn-primary" id="copySummary">Copiar resumo</button>
    </div>`;
  overlay.hidden = false;
  modalForm.onsubmit = e => e.preventDefault();
  modalForm.querySelector('[data-cancel]').onclick = closeModal;
  document.getElementById('copySummary').onclick = () => {
    const ta = document.getElementById('summaryText'); ta.select();
    const ok = () => toast('Resumo copiado!');
    if (navigator.clipboard) navigator.clipboard.writeText(ta.value).then(ok).catch(() => { document.execCommand('copy'); ok(); });
    else { document.execCommand('copy'); ok(); }
  };
}

/* ===========================================================
   CONFETTI — celebra entrega concluída
   =========================================================== */
function confetti() {
  const canvas = document.getElementById('confettiCanvas');
  canvas.hidden = false;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const colors = ['#DA251D', '#1B3A8B', '#F0C419', '#16a34a', '#ffffff'];
  const parts = Array.from({ length: 140 }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * 120,
    y: canvas.height / 3,
    vx: (Math.random() - 0.5) * 14,
    vy: Math.random() * -14 - 4,
    g: 0.28 + Math.random() * 0.12,
    c: colors[Math.floor(Math.random() * colors.length)],
    s: 5 + Math.random() * 6,
    rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
  }));
  let frame = 0;
  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); frame++;
    parts.forEach(p => {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); ctx.restore();
    });
    if (frame < 130) requestAnimationFrame(draw);
    else { ctx.clearRect(0, 0, canvas.width, canvas.height); canvas.hidden = true; }
  })();
}

/* ===========================================================
   WIRING das funções novas
   =========================================================== */
document.getElementById('presentBtn').onclick = openPresent;
document.getElementById('presentClose').onclick = closePresent;
document.getElementById('presentPrev').onclick = () => presentGo(-1);
document.getElementById('presentNext').onclick = () => presentGo(1);
document.getElementById('summaryBtn').onclick = openSummary;
document.getElementById('cmdkBtn').onclick = openCmdk;
const _cmdkInput = document.getElementById('cmdkInput');
_cmdkInput.oninput = () => renderCmdk(_cmdkInput.value);
_cmdkInput.onkeydown = e => {
  if (e.key === 'ArrowDown') { e.preventDefault(); cmdkMove(1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); cmdkMove(-1); }
  else if (e.key === 'Enter') { e.preventDefault(); runCmdk(cmdkSel); }
};
document.getElementById('cmdk').onclick = e => { if (e.target.id === 'cmdk') closeCmdk(); };
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    document.getElementById('cmdk').hidden ? openCmdk() : closeCmdk();
  } else if (e.key === 'Escape' && !document.getElementById('cmdk').hidden) closeCmdk();
});

/* ===========================================================
   GERENCIAR ENTREGAS — central tipo planilha
   =========================================================== */
const manageState = { sort: 'date', dir: 1 };
const manageSel = new Set();
let manageWired = false;

function openManage() {
  document.getElementById('manageOverlay').hidden = false;
  // popular filtro de categorias (uma vez)
  const cf = document.getElementById('manageCatF');
  if (!cf.dataset.filled) { CATEGORIES.forEach(c => cf.innerHTML += `<option value="${c}">${c}</option>`); cf.dataset.filled = '1'; }
  if (!manageWired) wireManage();
  renderManage();
}
function closeManage() { document.getElementById('manageOverlay').hidden = true; refreshAll(); }

function getManageTasks() {
  const q = (document.getElementById('manageSearch').value || '').toLowerCase();
  const sf = document.getElementById('manageStatusF').value;
  const cf = document.getElementById('manageCatF').value;
  const r = db.tasks.filter(t =>
    (!q || t.title.toLowerCase().includes(q) || (t.desc || '').toLowerCase().includes(q) || (t.resp || '').toLowerCase().includes(q)) &&
    (!sf || t.status === sf) && (!cf || t.cat === cf));
  const k = manageState.sort, d = manageState.dir, order = { todo: 0, doing: 1, done: 2 };
  r.sort((a, b) => {
    let va, vb;
    if (k === 'status') { va = order[a.status]; vb = order[b.status]; }
    else { va = (a[k] || '').toString().toLowerCase(); vb = (b[k] || '').toString().toLowerCase(); }
    return va < vb ? -d : va > vb ? d : 0;
  });
  return r;
}
function manageCatOptions(sel) { return `<option value=""></option>` + CATEGORIES.map(c => `<option ${c === sel ? 'selected' : ''}>${c}</option>`).join(''); }
function manageStatusOptions(key) { return STATUSES.map(s => `<option value="${s.label}" ${s.key === key ? 'selected' : ''}>${s.label}</option>`).join(''); }

function renderManage() {
  const rows = getManageTasks();
  document.getElementById('manageBody').innerHTML = rows.length ? rows.map(t => `
    <tr data-id="${t.id}">
      <td class="col-check"><input type="checkbox" class="row-check" ${manageSel.has(t.id) ? 'checked' : ''} /></td>
      <td class="col-title"><input data-field="title" value="${esc(t.title)}" /></td>
      <td><select data-field="cat">${manageCatOptions(t.cat)}</select></td>
      <td><input data-field="resp" value="${esc(t.resp || '')}" placeholder="—" /></td>
      <td><input type="date" data-field="date" value="${t.date || ''}" /></td>
      <td><select data-field="status">${manageStatusOptions(t.status)}</select></td>
      <td><button class="row-del">Excluir</button></td>
    </tr>`).join('') : `<tr><td colspan="7" class="manage-empty">Nenhuma entrega encontrada.</td></tr>`;
  document.querySelectorAll('.manage-table th[data-sort]').forEach(th => {
    th.querySelector('.arr').textContent = th.dataset.sort === manageState.sort ? (manageState.dir > 0 ? '▲' : '▼') : '';
  });
  document.getElementById('manageAll').checked = rows.length > 0 && rows.every(t => manageSel.has(t.id));
  document.getElementById('manageFoot').innerHTML =
    `<span>Mostrando ${rows.length} de ${db.tasks.length} entregas</span><span>Edite direto na tabela · clique no cabeçalho para ordenar</span>`;
  updateManageBulk();
}
function updateManageBulk() {
  const bar = document.getElementById('manageBulk'), n = manageSel.size;
  bar.hidden = n === 0;
  if (n) document.getElementById('manageBulkCount').textContent = `${n} selecionada(s)`;
}
function wireManage() {
  manageWired = true;
  document.getElementById('manageClose').onclick = closeManage;
  document.getElementById('manageOverlay').addEventListener('click', e => { if (e.target.id === 'manageOverlay') closeManage(); });
  document.getElementById('manageAdd').onclick = () => openTaskModal();
  document.getElementById('manageSearch').oninput = renderManage;
  document.getElementById('manageStatusF').onchange = renderManage;
  document.getElementById('manageCatF').onchange = renderManage;
  document.getElementById('manageAll').onchange = e => {
    const rows = getManageTasks();
    rows.forEach(t => e.target.checked ? manageSel.add(t.id) : manageSel.delete(t.id));
    renderManage();
  };
  document.querySelectorAll('.manage-table th[data-sort]').forEach(th => th.onclick = () => {
    if (manageState.sort === th.dataset.sort) manageState.dir *= -1;
    else { manageState.sort = th.dataset.sort; manageState.dir = 1; }
    renderManage();
  });
  document.getElementById('manageBulkDel').onclick = () => {
    if (manageSel.size && confirm(`Excluir ${manageSel.size} entrega(s) definitivamente?`)) {
      db.tasks = db.tasks.filter(t => !manageSel.has(t.id)); manageSel.clear(); save(); renderManage(); toast('Entregas excluídas');
    }
  };
  document.getElementById('manageBulkStatus').onchange = e => {
    const key = STATUSES.find(s => s.label === e.target.value)?.key;
    if (key && manageSel.size) {
      db.tasks.forEach(t => { if (manageSel.has(t.id)) t.status = key; });
      save(); manageSel.clear(); renderManage(); toast('Status atualizado em massa');
    }
    e.target.selectedIndex = 0;
  };
  document.getElementById('manageBulkClear').onclick = () => { manageSel.clear(); renderManage(); };
  const body = document.getElementById('manageBody');
  body.addEventListener('change', e => {
    const tr = e.target.closest('tr'); if (!tr) return; const id = tr.dataset.id;
    if (e.target.classList.contains('row-check')) {
      e.target.checked ? manageSel.add(id) : manageSel.delete(id);
      document.getElementById('manageAll').checked = getManageTasks().every(t => manageSel.has(t.id));
      updateManageBulk(); return;
    }
    const t = db.tasks.find(x => x.id === id); if (!t) return;
    const f = e.target.dataset.field;
    if (f === 'status') t.status = STATUSES.find(s => s.label === e.target.value)?.key || t.status;
    else if (f) t[f] = e.target.value;
    save();
  });
  body.addEventListener('click', e => {
    if (!e.target.classList.contains('row-del')) return;
    const id = e.target.closest('tr').dataset.id;
    if (confirm('Excluir esta entrega?')) { db.tasks = db.tasks.filter(x => x.id !== id); manageSel.delete(id); save(); renderManage(); toast('Entrega excluída'); }
  });
}
document.getElementById('manageBtn').onclick = openManage;
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !document.getElementById('manageOverlay').hidden && document.getElementById('modalOverlay').hidden) closeManage();
});

/* ===========================================================
   BOOT
   =========================================================== */
(function init() {
  // tema claro/escuro (lembra a preferência)
  if (localStorage.getItem('ccaa_theme') === 'dark') document.documentElement.dataset.theme = 'dark';
  const tBtn = document.getElementById('themeToggle');
  const setThemeLabel = () => tBtn.textContent = document.documentElement.dataset.theme === 'dark' ? '☀ Modo claro' : '🌙 Modo escuro';
  setThemeLabel();
  tBtn.onclick = () => {
    if (document.documentElement.dataset.theme === 'dark') {
      delete document.documentElement.dataset.theme; localStorage.setItem('ccaa_theme', 'light');
    } else {
      document.documentElement.dataset.theme = 'dark'; localStorage.setItem('ccaa_theme', 'dark');
    }
    setThemeLabel();
  };

  // popular filtro de categorias
  const catF = document.getElementById('catFilter');
  CATEGORIES.forEach(c => catF.innerHTML += `<option value="${c}">${c}</option>`);
  // chip de hoje
  const now = new Date();
  document.getElementById('todayChip').textContent =
    `${now.getDate()} de ${MONTHS[now.getMonth()]} de ${now.getFullYear()}`;
  renderPainel();
})();
