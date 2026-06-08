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
if (db.foco === 'Captação para o 2º semestre') db.foco = ''; // limpa foco antigo
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
    foco: '',
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
  motor:      ['Motor Semanal de Crescimento', 'Sistema semanal para transformar buscas locais em matrículas'],
  gamefik:    ['Gamefik · Missões e Engajamento', 'Transforme a gamificação dos alunos em conteúdo e indicações'],
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
  if (v === 'motor') renderMotor();
  if (v === 'gamefik') renderGamefik();
}

/* ===========================================================
   PAINEL INSTAGRAM -dados reais do @ccaa.pelotas (Analytics)
   =========================================================== */
let IG = null;
const igState = { fType: '', fTopic: '', sort: 'inter', dir: -1 };
const IG_WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const IG_TOPICS = [
  { key: 'Inclusão', re: /autismo|neurodiverg|acolhedor|conscientiza/i, angle: 'Diferencial humano raro no nicho. Vale virar série/depoimento real (com consentimento). Gera conexão e diferenciação que nenhum concorrente local tem.' },
  { key: 'Kids/Infantil', re: /filho|crian[çc]a|kids|infantil|pequenos|livros infantis|p[áa]scoa/i, angle: 'O TOPO de engajamento de vocês. Criança real em ação (cantando, brincando) + marcar os pais. Emoção converte pais. Repetir toda semana.' },
  { key: 'Captação/Oferta', re: /matr[íi]cul|vaga|aula experimental|desconto|link na bio|garanta|primeiro passo|consumidor|gratuita/i, angle: 'CTA direto + urgência. Converte melhor em VÍDEO com prova (aluno/resultado) do que em card. Sempre fechar com "link na bio / agende".' },
  { key: 'Cultura pop/Teen', re: /game|s[ée]rie|meme|call gringa|main character|hype|[áa]lbum|aura/i, angle: 'Linguagem teen forte. Levar pro Reel com humor/POV e áudio em alta. É o que esse público compartilha e salva.' },
  { key: 'Inglês & Carreira/IA', re: /mercado|profissional|carreira|oportunidade|trabalho|\bia\b|intelig[êe]ncia|tecnologia/i, angle: 'Ângulo atual e relevante (inglês + IA/carreira). Transformar em Reel falado com 1 exemplo prático + CTA de aula experimental.' },
  { key: 'Espanhol', re: /espanhol|jos[ée] luis|natividad|l[íi]ngua espanhola/i, angle: 'Tem personagens próprios (José Luis/Natividad). Virar quadro de Reels curtos com 1 frase útil em espanhol por episódio.' },
  { key: 'Intercâmbio', re: /houston|ccls|interc[âa]mbio|texas|networking/i, angle: 'Aspiracional para teens/universitários. Depoimento de quem foi + condição exclusiva pra aluno CCAA puxa lead qualificado.' },
  { key: 'Método/Diferenciais', re: /h[íi]brid|online|presencial|material|digital|assistente|no seu ritmo|flexib|metodologia|autonomia/i, angle: 'Pare de explicar o método em card. MOSTRAR (bastidor de aula, professor, app na tela) gera mais confiança e engajamento.' },
  { key: 'Institucional/Prêmios', re: /bicampe[ãa]o|experience awards|formatura|orgulho|refer[êe]ncia/i, angle: 'Autoridade/prova social. Reforça a marca, mas não puxa alcance novo. Usar com moderação e sempre com rosto de aluno.' },
  { key: 'Posicionamento/Marca', re: /mentiras|de verdade/i, angle: 'Reel curto e direto de posicionamento (CCAA x concorrência) teve ótimo alcance. Formato a repetir: 1 frase forte + corte rápido + áudio em alta.' },
  { key: 'Datas comemorativas', re: /dia (mundial|nacional|da|do|internacional)|m[ãa]es|mother/i, angle: 'Data garante alcance fácil. Ganha muito quando vira cena real (ex: apresentação das crianças), não só arte comemorativa.' },
];
function igTopicOf(c) { for (const t of IG_TOPICS) if (t.re.test(c || '')) return t.key; return 'Outros'; }
function igAngleOf(k) { const t = IG_TOPICS.find(x => x.key === k); return t ? t.angle : 'Conteúdo de marca/posicionamento. Testar como Reel falado pra ganhar alcance.'; }
function igFmtD(d) { if (!d) return '-'; const a = d.split('-'); return `${a[2]}/${a[1]}`; }

async function renderInstagram() {
  const el = document.getElementById('igPanel');
  if (!el) return;
  if (!IG) {
    el.innerHTML = '<div class="ig-loading">Carregando dados do Instagram…</div>';
    try {
      const r = await fetch('data/instagram.json?cb=' + Date.now());
      if (!r.ok) throw new Error('http');
      const data = await r.json();
      const followers = data.profile?.followers || 1;
      const posts = (data.postsData || []).map(x => {
        const inter = (x.likes || 0) + (x.comments || 0);
        return { ...x, inter, eng: inter / followers * 100, topic: igTopicOf(x.caption), wd: new Date(x.date + 'T12:00:00').getDay() };
      });
      IG = { profile: data.profile || {}, updatedAt: data.updatedAt, posts };
    } catch (e) {
      el.innerHTML = '<div class="ig-empty">Dados do Instagram indisponíveis aqui (abra pelo site publicado). Para atualizar, peça uma nova coleta.</div>';
      return;
    }
  }
  const p = IG.profile, posts = IG.posts;
  const avgOf = a => a.length ? Math.round(a.reduce((s, x) => s + x.inter, 0) / a.length) : 0;
  const KINDS = ['Reel', 'Carrossel', 'Imagem'];
  const byKind = KINDS.map(k => ({ k, n: posts.filter(x => x.kind === k).length, avg: avgOf(posts.filter(x => x.kind === k)) }));
  const maxKind = Math.max(1, ...byKind.map(x => x.avg));
  const avgReel = avgOf(posts.filter(x => x.kind === 'Reel')), avgEst = avgOf(posts.filter(x => x.kind !== 'Reel'));
  const mult = avgEst ? (avgReel / avgEst).toFixed(1) : '-';

  // tópicos
  const topicMap = {};
  posts.forEach(x => { (topicMap[x.topic] ||= []).push(x); });
  const topics = Object.entries(topicMap).map(([k, arr]) => ({ k, n: arr.length, avg: avgOf(arr) })).sort((a, b) => b.avg - a.avg);
  const maxTopic = Math.max(1, ...topics.map(t => t.avg));

  // frequência por dia
  const freq = IG_WD.map((w, i) => ({ w, n: posts.filter(x => x.wd === i).length, avg: avgOf(posts.filter(x => x.wd === i)) }));
  const maxFreq = Math.max(1, ...freq.map(f => f.n));
  const bestDay = [...freq].filter(f => f.n).sort((a, b) => b.avg - a.avg)[0];
  const mostDay = [...freq].sort((a, b) => b.n - a.n)[0];

  const totalInter = posts.reduce((s, x) => s + x.inter, 0);
  const engRate = (totalInter / posts.length / (p.followers || 1) * 100).toFixed(2);
  const bestFmt = [...byKind].sort((a, b) => b.avg - a.avg)[0];

  const top10 = [...posts].sort((a, b) => b.inter - a.inter).slice(0, 10);
  const bestTopic = topics.filter(t => t.n >= 2)[0] || topics[0];

  const bar = (label, val, max, sub, cls, data) => `<div class="ig-bar ${data ? 'clk' : ''}" ${data || ''}><span class="ig-bar-l">${esc(label)}</span><span class="ig-bar-track"><span class="ig-bar-fill ${cls || ''}" style="width:${Math.round(val / max * 100)}%"></span></span><span class="ig-bar-v">${val}${sub || ''}</span></div>`;

  el.innerHTML = `
    <div class="ig-head">
      <h2><span class="ig-dot"></span> Inteligência de Conteúdo · @${esc(p.username || 'ccaa.pelotas')}</h2>
      <span class="ig-meta">${posts.length} posts analisados · atualizado em ${igFmtD(IG.updatedAt)}/${(IG.updatedAt||'').slice(0,4)} · <a href="https://www.instagram.com/${esc(p.username||'ccaa.pelotas')}/" target="_blank" rel="noopener">ver perfil</a></span>
    </div>
    <div class="ig-kpis">
      <div class="ig-kpi"><div class="v">${(p.followers||0).toLocaleString('pt-BR')}</div><div class="l">Seguidores</div></div>
      <div class="ig-kpi"><div class="v">${Math.round(totalInter/posts.length)}</div><div class="l">Interações/post (média)</div></div>
      <div class="ig-kpi"><div class="v">${engRate}%</div><div class="l">Taxa de engajamento</div></div>
      <div class="ig-kpi"><div class="v">${bestFmt.k}</div><div class="l">Formato campeão</div></div>
    </div>
    <div class="ig-insight">⚡ <span>Os <strong>Reels engajam ${mult}x mais</strong> que posts estáticos (${avgReel} vs ${avgEst} interações). Melhor tópico: <strong>${esc(bestTopic?.k||'-')}</strong> (${bestTopic?.avg||0}/post). Vocês postam mais na <strong>${mostDay.w}</strong>, mas a <strong>${bestDay?bestDay.w:'-'}</strong> rende mais engajamento.</span></div>

    <div class="ig-grid2">
      <div class="ig-section"><h3>Engajamento por tipo de conteúdo</h3>
        ${byKind.map(x => bar(`${x.k} (${x.n})`, x.avg, maxKind, ' int.', '', `data-ftype="${x.k}"`)).join('')}
      </div>
      <div class="ig-section"><h3>Frequência de postagem (dia da semana)</h3>
        ${freq.map(f => bar(f.w, f.n, maxFreq, ` post${f.n===1?'':'s'}`, 'blue')).join('')}
      </div>
    </div>

    <div class="ig-section"><h3>Tópicos com melhor desempenho (média de interações)</h3>
      ${topics.map(t => bar(t.k, t.avg, maxTopic, ` · ${t.n} post${t.n===1?'':'s'}`, '', `data-ftopic="${esc(t.k)}"`)).join('')}
    </div>

    <div class="ig-section"><h3>🏆 Top 10 postagens</h3>
      <ul class="ig-top">${top10.map((x, i) => `<li>
        <span class="rk">${i+1}</span>
        <span class="tp"><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.caption)}</a><small>${x.kind} · ${esc(x.topic)} · ${igFmtD(x.date)}</small></span>
        <span class="mt"><b>${x.inter}</b> int.<br>${x.likes}❤ ${x.comments}💬${x.plays?` · ${x.plays.toLocaleString('pt-BR')} plays`:''}</span>
      </li>`).join('')}</ul>
    </div>

    <div class="ig-section"><h3>🎯 Ângulos recomendados (o que a equipe pode aprender)</h3>
      <div class="ig-angles">${topics.slice(0,6).map(t => `<div class="ig-angle">
        <div class="ig-angle-stat">${t.k.toUpperCase()} · ${t.avg} int./post</div>
        <p>${esc(igAngleOf(t.k))}</p>
      </div>`).join('')}</div>
    </div>

    <div class="ig-section"><h3>Todas as ${posts.length} postagens</h3>
      <div class="ig-filters">
        <select id="igFType"><option value="">Todos os tipos</option>${KINDS.map(k=>`<option value="${k}">${k}</option>`).join('')}</select>
        <select id="igFTopic"><option value="">Todos os tópicos</option>${topics.map(t=>`<option value="${esc(t.k)}">${esc(t.k)}</option>`).join('')}</select>
        <button class="ig-reset" id="igReset">limpar filtros</button>
      </div>
      <div class="ig-table-wrap">
        <table class="ig-table">
          <thead><tr>
            <th>Tipo</th>
            <th class="srt" data-s="date">Data <span class="ar"></span></th>
            <th>Tópico</th>
            <th class="num srt" data-s="likes">Curtidas <span class="ar"></span></th>
            <th class="num srt" data-s="comments">Coment. <span class="ar"></span></th>
            <th class="num srt" data-s="plays">Alcance <span class="ar"></span></th>
            <th class="num srt" data-s="eng">Eng. <span class="ar"></span></th>
            <th>Publicação</th>
          </tr></thead>
          <tbody id="igTableBody"></tbody>
        </table>
      </div>
    </div>`;

  // wiring
  el.querySelectorAll('[data-ftype]').forEach(b => b.onclick = () => { igState.fType = b.dataset.ftype; igState.fTopic = ''; syncIgFilters(); renderIgTable(); });
  el.querySelectorAll('[data-ftopic]').forEach(b => b.onclick = () => { igState.fTopic = b.dataset.ftopic; igState.fType = ''; syncIgFilters(); renderIgTable(); });
  el.querySelector('#igFType').onchange = e => { igState.fType = e.target.value; renderIgTable(); };
  el.querySelector('#igFTopic').onchange = e => { igState.fTopic = e.target.value; renderIgTable(); };
  el.querySelector('#igReset').onclick = () => { igState.fType = ''; igState.fTopic = ''; syncIgFilters(); renderIgTable(); };
  el.querySelectorAll('.ig-table th.srt').forEach(th => th.onclick = () => {
    const s = th.dataset.s; if (igState.sort === s) igState.dir *= -1; else { igState.sort = s; igState.dir = (s === 'date') ? -1 : -1; }
    renderIgTable();
  });
  renderIgTable();
}
function syncIgFilters() {
  const a = document.getElementById('igFType'), b = document.getElementById('igFTopic');
  if (a) a.value = igState.fType; if (b) b.value = igState.fTopic;
}
function renderIgTable() {
  if (!IG) return;
  const body = document.getElementById('igTableBody'); if (!body) return;
  let rows = IG.posts.filter(x => (!igState.fType || x.kind === igState.fType) && (!igState.fTopic || x.topic === igState.fTopic));
  const k = igState.sort, d = igState.dir;
  rows.sort((a, b) => {
    let va = k === 'date' ? a.date : (a[k] ?? 0), vb = k === 'date' ? b.date : (b[k] ?? 0);
    return va < vb ? -d : va > vb ? d : 0;
  });
  body.innerHTML = rows.map(x => `
    <tr class="${x.kind === 'Reel' ? 'reel' : ''}">
      <td><span class="ig-badge ${x.kind === 'Reel' ? 'reel' : 'est'}">${x.kind}</span></td>
      <td>${igFmtD(x.date)}</td>
      <td><span class="ig-chip" title="${esc(igAngleOf(x.topic))}">${esc(x.topic)}</span></td>
      <td class="num">${x.likes}</td>
      <td class="num">${x.comments}</td>
      <td class="num">${x.plays != null ? x.plays.toLocaleString('pt-BR') : '-'}</td>
      <td class="num">${x.eng.toFixed(2)}%</td>
      <td class="ig-cap"><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.caption)}</a></td>
    </tr>`).join('') || `<tr><td colspan="8" class="ig-empty">Nenhum post com esse filtro.</td></tr>`;
  document.querySelectorAll('.ig-table th.srt').forEach(th => {
    th.querySelector('.ar').textContent = th.dataset.s === igState.sort ? (igState.dir > 0 ? '▲' : '▼') : '';
  });
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
   MODO APRESENTAÇÃO -deck para a reunião de alinhamento
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
    <p class="present-sub">Foco do mês: <strong>${esc(db.foco || '-')}</strong> · ${pct}% concluído</p>
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
    <ul class="present-list">${week.length ? week.map(t => `<li>✓ ${esc(t.title)}<span class="tag">${esc(t.cat || '')}</span></li>`).join('') : '<li>-</li>'}</ul></div>`);
  S.push(`<div class="present-slide">
    <div class="present-eyebrow">A seguir</div><h1>Próximas entregas</h1>
    <ul class="present-list">${up.length ? up.map(t => { const dt = new Date(t.date + 'T00:00'); return `<li><strong>${dt.getDate()}/${dt.getMonth() + 1}</strong> · ${esc(t.title)}<span class="tag">${esc(t.resp || '')}</span></li>`; }).join('') : '<li>-</li>'}</ul></div>`);
  S.push(`<div class="present-slide">
    <div class="present-eyebrow">Prova de valor</div><h1>Destaques de performance</h1>
    <ul class="present-list">${res.length ? res.map(r => `<li>${esc(r.title)}<span class="tag">${esc(r.result || '')}</span></li>`).join('') : '<li>-</li>'}</ul></div>`);
  S.push(`<div class="present-slide">
    <div class="present-eyebrow">Em avaliação</div><h1>Ideias prioritárias</h1>
    <ul class="present-list">${ideas.length ? ideas.map(i => `<li>${esc(i.title)}<span class="tag">▲ ${i.votes || 0}</span></li>`).join('') : '<li>-</li>'}</ul></div>`);
  return S;
}

/* ===========================================================
   COMMAND PALETTE -Ctrl/Cmd + K
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
   RESUMO DA REUNIÃO -texto pronto para copiar
   =========================================================== */
function buildSummaryText() {
  const all = db.tasks;
  const done = all.filter(t => t.status === 'done'), doing = all.filter(t => t.status === 'doing'), todo = all.filter(t => t.status === 'todo');
  const pct = Math.round(done.length / (all.length || 1) * 100);
  const now = new Date(), today = now.toISOString().slice(0, 10);
  const up = db.tasks.filter(t => t.date && t.date >= today && t.status !== 'done').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
  const res = [...db.results].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 3);
  const L = [];
  L.push(`RESUMO DE MARKETING · CCAA PELOTAS`);
  L.push(`${MONTHS[now.getMonth()]} de ${now.getFullYear()}`);
  L.push(`--------------------------------------`);
  L.push(`Foco do mes: ${db.foco || '-'}  (${pct}% concluido)`);
  L.push(`Entregas: ${all.length} no total | ${done.length} concluidas | ${doing.length} em producao | ${todo.length} planejadas`);
  L.push(``);
  L.push(`CONCLUIDAS:`);
  done.forEach(t => L.push(`  - ${t.title}`));
  L.push(``);
  L.push(`PROXIMAS ENTREGAS:`);
  up.forEach(t => { const dt = new Date(t.date + 'T00:00'); L.push(`  - ${dt.getDate()}/${dt.getMonth() + 1} ${t.title} (${t.resp || '-'})`); });
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
   CONFETTI -celebra entrega concluída
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
   GERENCIAR ENTREGAS -central tipo planilha
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
      <td><input data-field="resp" value="${esc(t.resp || '')}" placeholder="-" /></td>
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
   MOTOR SEMANAL DE CRESCIMENTO
   =========================================================== */
const MOTOR_KEY = 'ccaa_motor_v1';
let MOTOR = null;
function motorLoad() { try { const r = localStorage.getItem(MOTOR_KEY); if (r) return JSON.parse(r); } catch (e) {} return motorSeed(); }
function motorSave() { try { localStorage.setItem(MOTOR_KEY, JSON.stringify(MOTOR)); } catch (e) {} }
function motorSeed() {
  return {
    week: '02/06 a 08/06', prevScore: 40, target: 12, realResults: 5, projectionCtr: 3.7, executed: [],
    risk: 'Concorrente assumiu o topo de "melhor escola de inglês em Pelotas" com avaliações recentes. Reforce a prova social e peça avaliações dos alunos.',
    quickWins: [
      { id: 'qw1', query: 'curso de inglês em Pelotas', pos: 6, vol: 320, intent: 'matrícula', ease: 8, action: 'Criar/otimizar a landing "Curso de Inglês em Pelotas" com oferta de aula experimental grátis e botão de WhatsApp direto no topo.' },
      { id: 'qw2', query: 'aula experimental de inglês Pelotas', pos: 9, vol: 90, intent: 'avaliação', ease: 9, action: 'Página de captura dedicada: formulário curto, WhatsApp direto e prova social (Experience Awards).' },
      { id: 'qw3', query: 'escola de idiomas em Pelotas', pos: 5, vol: 210, intent: 'matrícula', ease: 7, action: 'Reforçar o Google Meu Negócio (fotos, avaliações) e a página institucional com diferenciais e provas.' },
      { id: 'qw4', query: 'curso de espanhol em Pelotas', pos: 7, vol: 140, intent: 'matrícula', ease: 7, action: 'Landing de espanhol com os personagens (José Luis) e CTA de aula grátis.' },
      { id: 'qw5', query: 'inglês para crianças Pelotas', pos: 8, vol: 110, intent: 'matrícula', ease: 7, action: 'Landing CCAA Kids com vídeo de aula real e depoimento de pais.' },
      { id: 'qw6', query: 'inglês para viagem Pelotas', pos: 12, vol: 70, intent: 'avaliação', ease: 6, action: 'Lead magnet "Mini guia: inglês para viagem" capturando WhatsApp e e-mail.' },
    ],
    longTail: [
      { id: 'lt1', query: 'quanto custa curso de inglês em Pelotas', vol: 50, ctrFrom: 3.1, ctrTo: 1.4, why: 'Resposta de IA e snippet de concorrente assumiram o topo.', fix: 'Tabela de planos + schema FAQ respondendo preço, duração e condições.' },
      { id: 'lt2', query: 'melhor escola de inglês em Pelotas', vol: 80, ctrFrom: 4.2, ctrTo: 2.0, why: 'Título genérico, sem prova social no snippet.', fix: 'Reescrever title/meta com "bicampeão Experience Awards" e ativar review schema (estrelas).' },
      { id: 'lt3', query: 'curso de inglês online ao vivo Pelotas', vol: 45, ctrFrom: 2.8, ctrTo: 1.1, why: 'A página não deixa claro que é "ao vivo com professor".', fix: 'Bloco "aulas ao vivo híbridas" + FAQ schema sobre o formato.' },
    ],
    bets: [
      { id: 'bet1', query: 'intercâmbio de inglês para universitários Pelotas', evals: 6, season: 'Pré-temporada de intercâmbio', action: 'Landing de intercâmbio (CCLS Houston) + parceria com UFPel e UCPel.' },
      { id: 'bet2', query: 'inglês para ENEM Pelotas', evals: 5, season: 'Sobe no 2º semestre', action: 'Post + página "inglês para ENEM: 5 palavras que mais caem".' },
      { id: 'bet3', query: 'aula de inglês perto de mim', evals: 8, season: 'Busca mobile o ano todo', action: 'Otimizar Google Meu Negócio + página de localização + avaliações recentes.' },
      { id: 'bet4', query: 'espanhol para viagem', evals: 4, season: 'Alta no inverno (férias)', action: 'Reel "espanhol pra viagem" + landing simples com CTA.' },
    ],
    trend: [
      { wk: 'S1', ctr: 1.6, sov: 19, ai: 8 }, { wk: 'S2', ctr: 1.8, sov: 20, ai: 9 }, { wk: 'S3', ctr: 1.7, sov: 21, ai: 11 },
      { wk: 'S4', ctr: 2.0, sov: 22, ai: 12 }, { wk: 'S5', ctr: 2.2, sov: 24, ai: 14 }, { wk: 'S6', ctr: 2.1, sov: 25, ai: 16 },
      { wk: 'S7', ctr: 2.5, sov: 26, ai: 18 }, { wk: 'S8', ctr: 2.7, sov: 27, ai: 19 }, { wk: 'S9', ctr: 2.9, sov: 29, ai: 21 }, { wk: 'S10', ctr: 3.0, sov: 30, ai: 23 },
    ],
  };
}
function motorAllActions() { return [...MOTOR.quickWins, ...MOTOR.longTail, ...MOTOR.bets]; }
function motorFind(id) { return motorAllActions().find(a => a.id === id); }
function motorScore() {
  const t = MOTOR.trend[MOTOR.trend.length - 1] || { ctr: 0, sov: 0 };
  const visibility = Math.min(100, Math.round(t.sov * 2 + t.ctr * 3));
  const total = motorAllActions().length;
  const velocity = total ? Math.round(MOTOR.executed.length / total * 100) : 0;
  const projection = Math.min(100, Math.round(MOTOR.realResults / (MOTOR.target || 12) * 100));
  const score = Math.round(visibility * 0.45 + velocity * 0.30 + projection * 0.25);
  const capture = Math.min(100, Math.round(t.sov + t.ctr * 1.4));
  return { score, delta: score - (MOTOR.prevScore || 0), visibility, velocity, projection, capture };
}
const moPct = v => Number(v).toFixed(1).replace('.', ',') + '%';

function renderMotor() {
  if (!MOTOR) MOTOR = motorLoad();
  const root = document.getElementById('motorRoot'); if (!root) return;
  const s = motorScore();
  const ins = [];
  const lt = [...MOTOR.longTail].sort((a, b) => (b.ctrFrom - b.ctrTo) - (a.ctrFrom - a.ctrTo))[0];
  if (lt) ins.push(`🤖 Perdendo cliques para IA e snippets em <b>"${esc(lt.query)}"</b>: CTR caiu de ${moPct(lt.ctrFrom)} para ${moPct(lt.ctrTo)}. ${esc(lt.fix)}`);
  const qws = [...MOTOR.quickWins].sort((a, b) => (b.vol * b.ease) - (a.vol * a.ease));
  if (qws[0]) ins.push(`⚡ Quick win de maior ROI: <b>"${esc(qws[0].query)}"</b> (posição ${qws[0].pos}, ${qws[0].vol}/mês). ${esc(qws[0].action)}`);
  if (qws[1]) ins.push(`⚡ Segundo quick win: <b>"${esc(qws[1].query)}"</b> (posição ${qws[1].pos}, ${qws[1].vol}/mês).`);
  if (MOTOR.risk) ins.push(`🛡️ Risco de defesa: ${esc(MOTOR.risk)}`);
  const insights = ins.slice(0, 4);

  const btns = id => { const ex = MOTOR.executed.includes(id); return `<div class="mo-btns"><button data-mo="idea" data-id="${id}">+ Ideia</button><button data-mo="task" data-id="${id}">+ Entrega</button><button class="exec ${ex ? 'on' : ''}" data-mo="exec" data-id="${id}">${ex ? '✓ Executado' : 'Executar'}</button></div>`; };
  const qwCard = a => { const ex = MOTOR.executed.includes(a.id); const ic = a.intent === 'matrícula' ? 'matricula' : 'avaliacao'; return `<div class="mo-card ${ex ? 'done' : ''}"><div class="mo-card-top"><span class="mo-q">${esc(a.query)}</span><span class="mo-ease">facilidade ${a.ease}/10</span></div><div class="mo-meta">posição ${a.pos} · ${a.vol}/mês · <span class="mo-intent ${ic}">${esc(a.intent)}</span></div><p class="mo-action">${esc(a.action)}</p>${btns(a.id)}</div>`; };
  const ltCard = a => { const ex = MOTOR.executed.includes(a.id); return `<div class="mo-card ${ex ? 'done' : ''}"><div class="mo-card-top"><span class="mo-q">${esc(a.query)}</span><span class="mo-ease">${a.vol}/mês</span></div><p class="mo-why">CTR caiu de <b>${moPct(a.ctrFrom)}</b> para <b>${moPct(a.ctrTo)}</b>. ${esc(a.why)}</p><p class="mo-action"><b>Correção:</b> ${esc(a.fix)}</p>${btns(a.id)}</div>`; };
  const betCard = a => { const ex = MOTOR.executed.includes(a.id); return `<div class="mo-card ${ex ? 'done' : ''}"><div class="mo-card-top"><span class="mo-q">${esc(a.query)}</span><span class="mo-evals">+${a.evals} avaliações/mês</span></div><div class="mo-meta">${esc(a.season)}</div><p class="mo-action">${esc(a.action)}</p>${btns(a.id)}</div>`; };

  root.innerHTML = `
    <div class="mo-header">
      <div class="mo-gauge" style="--p:${s.score}"><div class="g-in"><b>${s.score}</b><span>Growth Score</span></div></div>
      <div>
        <span class="mo-delta ${s.delta >= 0 ? 'up' : 'down'}">${s.delta >= 0 ? '▲' : '▼'} ${s.delta >= 0 ? '+' : ''}${s.delta} vs semana anterior</span>
        <div class="mo-diag">Você está capturando <b>${s.capture}%</b> do potencial de buscas de alta intenção em Pelotas esta semana.</div>
        <div class="mo-pillars">
          <div class="mo-pillar"><div class="pl"><span>Visibilidade</span><span>${s.visibility}</span></div><div class="track"><div class="fill" style="width:${s.visibility}%"></div></div></div>
          <div class="mo-pillar"><div class="pl"><span>Velocidade da equipe</span><span>${s.velocity}</span></div><div class="track"><div class="fill b" style="width:${s.velocity}%"></div></div></div>
          <div class="mo-pillar"><div class="pl"><span>Projeção de avaliações</span><span>${s.projection}</span></div><div class="track"><div class="fill g" style="width:${s.projection}%"></div></div></div>
        </div>
      </div>
      <div class="mo-toolbar">
        <button class="btn-soft" id="moPresent">Apresentação Rápida</button>
        <button class="btn-soft mo-hide-present" id="moPng">Exportar Resumo (PNG)</button>
        <button class="btn-soft mo-hide-present" id="moCsv">Exportar Plano (CSV)</button>
        <button class="btn-soft mo-hide-present" id="moGsc">Importar do Search Console</button>
        <div class="mo-real mo-hide-present">Avaliações por busca: <input type="number" id="moReal" value="${MOTOR.realResults}" min="0" /> / ${MOTOR.target}</div>
        <input type="file" id="moGscFile" accept=".csv" hidden />
      </div>
    </div>

    <div class="mo-insights"><h3>Resumo de insights da semana</h3><ul>${insights.map(t => `<li><span class="ic">›</span><span>${t}</span></li>`).join('')}</ul></div>

    <div class="mo-cols">
      <div class="mo-col">
        <div class="mo-col-head"><span class="pr hi">Prioridade alta</span> Quick Wins Imediatos</div>
        <div class="mo-col-sub">Posições 4 a 20 em buscas de alta intenção</div>
        ${MOTOR.quickWins.map(qwCard).join('')}
      </div>
      <div class="mo-col">
        <div class="mo-col-head"><span class="pr md">Prioridade média</span> Long-tail com queda de CTR</div>
        <div class="mo-col-sub">3+ palavras, volume alto, CTR caindo</div>
        ${MOTOR.longTail.map(ltCard).join('')}
      </div>
      <div class="mo-col">
        <div class="mo-col-head"><span class="pr bet">Aposta</span> Apostas da Semana</div>
        <div class="mo-col-sub">Queries em alta que ainda não ranqueamos</div>
        ${MOTOR.bets.map(betCard).join('')}
      </div>
    </div>

    <div class="mo-trend"><h3>Tendência de visibilidade (últimas ${MOTOR.trend.length} semanas)</h3>
      ${motorTrendSVG()}
      <div class="mo-legend">
        <span><i style="background:#DA251D"></i>CTR médio</span>
        <span><i style="background:#1B3A8B"></i>Share of voice</span>
        <span><i style="background:#D97706"></i>Tráfego perdido para IA</span>
        <span><i style="background:#DA251D"></i>Projeção com as ações (tracejado)</span>
      </div>
    </div>

    <div class="mo-gsc"><span>📋 <b>Toda segunda:</b> exporte as consultas do Google Search Console (Desempenho, Consultas, Exportar CSV) e clique em "Importar do Search Console" para atualizar os dados reais.</span><button class="btn-soft" id="moGsc2">Importar agora</button></div>`;

  root.querySelector('#moPresent').onclick = () => {
    const v = document.getElementById('view-motor'); const on = v.classList.toggle('mo-present');
    root.querySelector('#moPresent').textContent = on ? 'Sair da apresentação' : 'Apresentação Rápida';
  };
  root.querySelector('#moPng').onclick = motorPNG;
  root.querySelector('#moCsv').onclick = motorCSV;
  const gscFile = root.querySelector('#moGscFile');
  root.querySelector('#moGsc').onclick = () => gscFile.click();
  root.querySelector('#moGsc2').onclick = () => gscFile.click();
  gscFile.onchange = e => { const f = e.target.files[0]; if (f) { const rd = new FileReader(); rd.onload = () => motorImportGSC(rd.result); rd.readAsText(f); } };
  root.querySelector('#moReal').onchange = e => { MOTOR.realResults = Math.max(0, +e.target.value || 0); motorSave(); renderMotor(); };
  root.onclick = e => {
    const b = e.target.closest('[data-mo]'); if (!b) return;
    const a = motorFind(b.dataset.id); if (!a) return;
    if (b.dataset.mo === 'idea') { db.ideas.unshift({ id: uid(), title: a.query, desc: a.action || a.fix || '', cat: 'Captação', votes: 0 }); save(); toast('Adicionado ao Pipeline de Ideias'); }
    else if (b.dataset.mo === 'task') { const dt = new Date(); dt.setDate(dt.getDate() + 7); db.tasks.unshift({ id: uid(), title: (a.action || a.fix || a.query).slice(0, 90), desc: 'Motor Semanal · busca: ' + a.query, cat: 'Captação', resp: '', date: dt.toISOString().slice(0, 10), status: 'todo' }); save(); toast('Adicionado às entregas (sugerido em 7 dias)'); }
    else if (b.dataset.mo === 'exec') { const i = MOTOR.executed.indexOf(b.dataset.id); if (i >= 0) MOTOR.executed.splice(i, 1); else MOTOR.executed.push(b.dataset.id); motorSave(); renderMotor(); }
  };
}
function motorTrendSVG() {
  const t = MOTOR.trend, n = t.length, W = 720, H = 240, pl = 34, pr = 16, pt = 14, pb = 30;
  const projCtr = MOTOR.projectionCtr || t[n - 1].ctr * 1.2;
  const maxV = Math.max(...t.map(p => Math.max(p.ctr, p.sov, p.ai)), projCtr);
  const yMax = Math.max(10, Math.ceil(maxV / 10) * 10);
  const slots = n + 1, xAt = i => pl + (W - pl - pr) * (i / (slots - 1)), yAt = v => (H - pb) - (H - pb - pt) * (v / yMax);
  const poly = (key, color) => `<polyline points="${t.map((p, i) => xAt(i).toFixed(1) + ',' + yAt(p[key]).toFixed(1)).join(' ')}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
  let grid = ''; const step = yMax / 4;
  for (let g = 0; g <= yMax + 0.01; g += step) { const y = yAt(g); grid += `<line x1="${pl}" y1="${y.toFixed(1)}" x2="${W - pr}" y2="${y.toFixed(1)}" stroke="rgba(127,127,127,.16)" stroke-width="1"/><text x="${pl - 6}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="10" fill="rgba(127,127,127,.85)">${Math.round(g)}%</text>`; }
  let xl = ''; t.forEach((p, i) => { xl += `<text x="${xAt(i).toFixed(1)}" y="${H - 10}" text-anchor="middle" font-size="9.5" fill="rgba(127,127,127,.85)">${p.wk}</text>`; });
  xl += `<text x="${xAt(n).toFixed(1)}" y="${H - 10}" text-anchor="middle" font-size="9.5" fill="#DA251D">proj</text>`;
  const proj = `<polyline points="${xAt(n - 1).toFixed(1)},${yAt(t[n - 1].ctr).toFixed(1)} ${xAt(n).toFixed(1)},${yAt(projCtr).toFixed(1)}" fill="none" stroke="#DA251D" stroke-width="2.5" stroke-dasharray="5 4"/><circle cx="${xAt(n).toFixed(1)}" cy="${yAt(projCtr).toFixed(1)}" r="3.5" fill="#DA251D"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Tendência de visibilidade">${grid}${poly('sov', '#1B3A8B')}${poly('ai', '#D97706')}${poly('ctr', '#DA251D')}${proj}${xl}</svg>`;
}
function motorCSV() {
  const san = v => String(v == null ? '' : v).replace(/[;\n\r]+/g, ' ').trim();
  const ex = id => MOTOR.executed.includes(id) ? 'Sim' : 'Nao';
  const L = ['Coluna;Consulta;Metrica;Acao recomendada;Executado'];
  MOTOR.quickWins.forEach(a => L.push(['Quick Win', a.query, `pos ${a.pos} | ${a.vol}/mes | ${a.intent}`, a.action, ex(a.id)].map(san).join(';')));
  MOTOR.longTail.forEach(a => L.push(['Long-tail', a.query, `CTR ${a.ctrFrom}% para ${a.ctrTo}% | ${a.vol}/mes`, a.fix, ex(a.id)].map(san).join(';')));
  MOTOR.bets.forEach(a => L.push(['Aposta', a.query, `+${a.evals} avaliacoes/mes | ${a.season}`, a.action, ex(a.id)].map(san).join(';')));
  const blob = new Blob(['﻿' + L.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'motor-semanal-plano.csv'; a.click();
  toast('Plano exportado (CSV)');
}
function motorPNG() {
  const s = motorScore(), dark = document.documentElement.dataset.theme === 'dark';
  const bg = dark ? '#181B22' : '#ffffff', ink = dark ? '#E8E9ED' : '#15171C', soft = dark ? '#9AA0AD' : '#6A6F7B', red = '#DA251D', col = dark ? '#14161C' : '#F1F2F5';
  const W = 1040, H = 620, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const F = (w, sz) => `${w} ${sz}px "Plus Jakarta Sans", Arial, sans-serif`;
  x.fillStyle = bg; x.fillRect(0, 0, W, H); x.fillStyle = red; x.fillRect(0, 0, W, 8);
  x.fillStyle = ink; x.font = F(800, 32); x.fillText('Motor Semanal de Crescimento', 48, 72);
  x.fillStyle = soft; x.font = F(500, 18); x.fillText('CCAA Pelotas · Semana ' + MOTOR.week, 48, 102);
  const cx = 158, cy = 300, r = 96; x.lineWidth = 22; x.lineCap = 'round';
  x.strokeStyle = col; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke();
  x.strokeStyle = red; x.beginPath(); x.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (s.score / 100)); x.stroke();
  x.fillStyle = ink; x.font = F(800, 58); x.textAlign = 'center'; x.fillText(s.score, cx, cy + 12);
  x.fillStyle = soft; x.font = F(600, 15); x.fillText('GROWTH SCORE', cx, cy + 44); x.textAlign = 'left';
  x.fillStyle = s.delta >= 0 ? '#16a34a' : red; x.font = F(700, 21); x.fillText((s.delta >= 0 ? '+' : '') + s.delta + ' vs semana anterior', 300, 200);
  x.fillStyle = ink; x.font = F(600, 23); motorWrap(x, 'Capturando ' + s.capture + '% do potencial de buscas de alta intenção em Pelotas esta semana.', 300, 244, 700, 32);
  x.fillStyle = soft; x.font = F(800, 14); x.fillText('3 AÇÕES DESTA SEMANA', 300, 332);
  MOTOR.quickWins.slice(0, 3).forEach((a, i) => { const yy = 372 + i * 66; x.fillStyle = red; x.font = F(800, 20); x.fillText((i + 1) + '.', 300, yy); x.fillStyle = ink; x.font = F(700, 18); x.fillText(motorShort(a.query, 60), 332, yy); x.fillStyle = soft; x.font = F(400, 14); x.fillText(motorShort(a.action, 92), 332, yy + 22); });
  x.fillStyle = soft; x.font = F(400, 13); x.fillText('Painel de Marketing · ccaapel.github.io/mkt', 48, H - 26);
  const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = 'motor-semanal-ccaa.png'; a.click(); toast('Resumo exportado (PNG)');
}
function motorWrap(ctx, text, x0, y0, maxW, lh) { const ws = text.split(' '); let line = '', y = y0; for (const w of ws) { const test = line + w + ' '; if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line.trim(), x0, y); line = w + ' '; y += lh; } else line = test; } ctx.fillText(line.trim(), x0, y); }
function motorShort(t, n) { return t.length > n ? t.slice(0, n - 1).trim() + '…' : t; }
function motorImportGSC(text) {
  try {
    const lines = text.split(/\r?\n/).filter(l => l.trim()); if (lines.length < 2) throw 0;
    const sep = lines[0].includes(';') ? ';' : ','; const head = lines[0].split(sep).map(h => h.toLowerCase());
    const idx = keys => head.findIndex(h => keys.some(k => h.includes(k)));
    const qi = idx(['consulta', 'query']), pi = idx(['posi', 'position']), ii = idx(['impress']), ci = idx(['clic', 'click']); if (qi < 0) throw 0;
    const num = v => parseFloat(String(v || '').replace(/[%"]/g, '').replace(',', '.')) || 0;
    const out = [];
    lines.slice(1).map(l => l.split(sep)).filter(c => c[qi]).forEach((c, k) => {
      const pos = pi >= 0 ? Math.round(num(c[pi])) : 0; if (pi >= 0 && (pos < 4 || pos > 20)) return;
      const q = c[qi].replace(/"/g, '').trim(); const vol = ii >= 0 ? Math.round(num(c[ii])) : (ci >= 0 ? Math.round(num(c[ci])) : 0);
      const intent = /experiment|gr[áa]tis|gratuit|pre[çc]o|quanto custa/.test(q.toLowerCase()) ? 'avaliação' : 'matrícula';
      out.push({ id: 'qw_' + k, query: q, pos: pos || 10, vol, intent, ease: pos <= 8 ? 9 : pos <= 12 ? 7 : 5, action: 'Otimizar a página de "' + q + '": título com Pelotas, oferta de aula experimental e WhatsApp direto.' });
    });
    if (!out.length) throw 0;
    MOTOR.quickWins = out.slice(0, 8); motorSave(); renderMotor(); toast(out.length + ' consultas importadas do Search Console');
  } catch (e) { toast('CSV não reconhecido. Use o export de Consultas do Search Console.'); }
}

/* ===========================================================
   GAMEFIK - missões, vitrine e motor de indicação
   =========================================================== */
const GMF_MISSIONS = [
  { id: 'copa', emoji: '⚽', name: 'Missão Copa do Mundo 2026', coins: 500, status: 'ativa', period: 'Junho a Julho de 2026', hero: true,
    angle: 'Timing perfeito: a Copa 2026 começa agora e a vitrine do Gamefik já está toda temática (figurinhas, álbum, bola, bandeirinha). É a maior onda do ano para surfar com missão e conteúdo de inglês do futebol.',
    ideas: ['Série "inglês do futebol": termos, países e narração durante a Copa', 'Reel mostrando os prêmios de Copa do Gamefik (álbum, bola, figurinhas) e como ganhar coins', 'Story: bolão da Copa em inglês valendo coins extras'] },
  { id: 'junina', emoji: '🎉', name: 'Missão Festa Junina', coins: 300, status: 'ativa', period: 'Junho de 2026',
    angle: 'Sazonal e bem gaúcha. Vira conteúdo de comunidade e bastidor com alto engajamento (Kids e teens, que é o público que mais engaja no seu Instagram).',
    ideas: ['Reel da festa junina na escola com inglês temático', 'Carrossel: vocabulário de festa junina em inglês', 'Story da missão junina valendo coins'] },
  { id: 'indica', emoji: '🎯', name: 'Missão Indique um Amigo (Influencer)', coins: 4000, status: 'ativa', period: 'Sempre ativa',
    angle: 'É um programa de indicação que já roda dentro da escola valendo 4000 coins. Marketing deve torná-lo público e aspiracional: cada aluno vira um micro-influenciador. A aquisição de matrícula mais barata que vocês têm.',
    ideas: ['Reel: aluno mostrando o que trocou com os 4000 coins da indicação', 'Post "Traga um amigo e ganhe 4000 coins" com a vitrine de prêmios', 'Story com enquete "quem você traria pro CCAA?"'] },
  { id: 'hall', emoji: '🎃', name: 'Missão Halloween', coins: 400, status: 'futura', period: 'Outubro de 2026',
    angle: 'Vocês já mandam bem no Halloween. Antecipar a missão cria expectativa e conteúdo divertido com fantasias.',
    ideas: ['Reel de fantasias com vocabulário de Halloween em inglês', 'Missão Halloween com coins extras para quem vier fantasiado'] },
  { id: 'aniv', emoji: '🎂', name: 'Missão 65 anos do CCAA', coins: 100, status: 'encerrada', period: 'Encerrada',
    angle: 'Prova social e afeto. Reaproveitar os vídeos dos alunos cantando parabéns na recepção como conteúdo institucional.',
    ideas: ['Compilado dos alunos cantando parabéns (prova social)', 'Post de retrospectiva dos 65 anos do CCAA'] },
];
const GMF_VITRINE = [
  { n: 'Álbum da Copa do Mundo 2026', c: 9000, tag: 'Copa' },
  { n: 'Bola de futebol estampa do Brasil', c: 10000, tag: 'Copa' },
  { n: 'Pacote com 7 figurinhas da Copa', c: 4000, tag: 'Copa' },
  { n: 'Bandeirinha do Brasil para o carro', c: 8000, tag: 'Copa' },
  { n: 'Chaveiro Huntr/x', c: 2000, tag: 'Teen' },
  { n: 'Hidratante Labial Carmed Glitter', c: 10500, tag: 'Teen' },
  { n: 'Jogo de cartas Uno (mini)', c: 4000, tag: 'Jogos' },
  { n: 'Vale Cineflix (um filme)', c: 6800, tag: 'Experiência' },
  { n: 'Vale: teacher corrige tarefa fora do prazo', c: 1500, tag: 'Perk escolar' },
  { n: 'Cafézinho ou chocolate na máquina', c: 1500, tag: 'Guloseima' },
  { n: 'Doritos 32g', c: 3200, tag: 'Guloseima' },
  { n: 'Necessaire CCAA', c: 7000, tag: 'CCAA' },
];
let gmfMap = {};
function renderGamefik() {
  const root = document.getElementById('gamefikRoot'); if (!root) return;
  gmfMap = {};
  GMF_MISSIONS.forEach(m => m.ideas.forEach((t, i) => { gmfMap[m.id + '_' + i] = { mission: m.name, text: t }; }));
  gmfMap['vitrine'] = { mission: 'Vitrine Gamefik', text: 'Reel "Os prêmios mais cobiçados do Gamefik" (bola da Copa, Carmed, Uno, vale-cineflix) com CTA de como ganhar coins.' };
  const hero = GMF_MISSIONS.find(m => m.hero) || GMF_MISSIONS[0];
  const order = { ativa: 0, futura: 1, encerrada: 2 };
  const list = GMF_MISSIONS.filter(m => m !== hero && m.id !== 'indica').sort((a, b) => order[a.status] - order[b.status]);
  const heroIdeas = hero.ideas.map((t, i) => `<div class="pt-idea"><span>${esc(t)}</span><span class="pt-ibtns"><button data-gmf="idea" data-id="${hero.id}_${i}">+ Ideia</button><button data-gmf="task" data-id="${hero.id}_${i}">+ Entrega</button></span></div>`).join('');
  const card = m => `<div class="pt-card"><div class="pt-card-top"><span class="pt-emoji">${m.emoji}</span><h3>${esc(m.name)}</h3><span class="pt-status ${m.status}">${esc(m.status)}</span></div><div class="pt-meta"><span class="pt-coin">${m.coins.toLocaleString('pt-BR')} coins</span><span>${esc(m.period)}</span></div><p class="pt-angle2">${esc(m.angle)}</p><ul class="pt-ilist">${m.ideas.map((t, i) => `<li><span>${esc(t)}</span><span class="pt-mini"><button data-gmf="idea" data-id="${m.id}_${i}">Ideia</button><button data-gmf="task" data-id="${m.id}_${i}">Entrega</button></span></li>`).join('')}</ul></div>`;
  const vit = GMF_VITRINE.map(p => `<div class="gv-item"><span class="gv-tag">${esc(p.tag)}</span><span class="gv-n">${esc(p.n)}</span><span class="gv-c">${p.c.toLocaleString('pt-BR')}</span></div>`).join('');
  const weekIdeas = [
    '<b>Segunda:</b> Story "Missão da Semana" mostrando a missão ativa e os coins em jogo.',
    '<b>Quarta:</b> Reel de um aluno mostrando um prêmio que trocou na vitrine do Gamefik (prova social).',
    '<b>Sexta:</b> Post das conquistas da semana + CTA "Traga um amigo e ganhe 4000 coins".',
  ];
  root.innerHTML = `
    <div class="pt-hero">
      <span class="pt-tag">⭐ Missão da Semana</span>
      <h2>${hero.emoji} ${esc(hero.name)}</h2>
      <span class="pt-coins">🪙 ${hero.coins.toLocaleString('pt-BR')} coins · ${esc(hero.period)}</span>
      <div class="pt-angle">${esc(hero.angle)}</div>
      <div class="pt-ideas">${heroIdeas}</div>
      <div class="pt-week"><button id="gmfWeek">Criar entregas desta semana</button></div>
    </div>

    <div class="pt-referral">
      <h3>🎯 Seu motor de indicação já existe</h3>
      <p>A missão <b>"Indique um Amigo" vale 4000 coins</b> e roda o ano todo. Cada aluno satisfeito é um vendedor. O papel do marketing é deixar isso <b>público e desejável</b>: mostrar os prêmios, os alunos ganhando e como é fácil indicar. É a matrícula mais barata que vocês conseguem.</p>
    </div>

    <div class="pt-section-h">Vitrine de prêmios (conteúdo pronto pra usar)</div>
    <div class="gv-grid">${vit}</div>
    <p class="gv-note">Mostrar a vitrine gera desejo. <b>Ideia de Reel:</b> "Os prêmios mais cobiçados do Gamefik" (bola da Copa, Carmed, Uno, vale-cineflix).<span class="pt-mini"><button data-gmf="idea" data-id="vitrine">Ideia</button><button data-gmf="task" data-id="vitrine">Entrega</button></span></p>

    <div class="pt-section-h">Calendário de missões e ângulos de conteúdo</div>
    <div class="pt-grid">${list.map(card).join('')}</div>

    <div class="pt-section-h">Rotina semanal recorrente (Gamefik no Instagram)</div>
    <ul class="pt-weekideas">${weekIdeas.map(t => `<li><span>›</span><span>${t}</span></li>`).join('')}</ul>`;

  root.querySelector('#gmfWeek').onclick = () => {
    hero.ideas.forEach((t, i) => { const dt = new Date(); dt.setDate(dt.getDate() + (i * 2 + 1)); db.tasks.unshift({ id: uid(), title: t.slice(0, 90), desc: 'Gamefik · ' + hero.name, cat: 'Conteúdo', resp: '', date: dt.toISOString().slice(0, 10), status: 'todo' }); });
    save(); toast('3 entregas da semana criadas no Plano de Ação');
  };
  root.onclick = e => {
    const b = e.target.closest('[data-gmf]'); if (!b) return; const a = gmfMap[b.dataset.id]; if (!a) return;
    if (b.dataset.gmf === 'idea') { db.ideas.unshift({ id: uid(), title: a.text.slice(0, 70), desc: 'Gamefik · ' + a.mission, cat: 'Conteúdo', votes: 0 }); save(); toast('Adicionado ao Pipeline de Ideias'); }
    else { const dt = new Date(); dt.setDate(dt.getDate() + 5); db.tasks.unshift({ id: uid(), title: a.text.slice(0, 90), desc: 'Gamefik · ' + a.mission, cat: 'Conteúdo', resp: '', date: dt.toISOString().slice(0, 10), status: 'todo' }); save(); toast('Adicionado às entregas'); }
  };
}

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
