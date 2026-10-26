/* Calendrier des événements – utilise EVENTS (data.js) ; modifiable en mode administrateur */
(() => {
  const root = document.getElementById('calendar');
  if (!root) return;
  const grid = root.querySelector('.cal-grid');
  const title = root.querySelector('.cal-title');
  const detail = document.getElementById('cal-detail');
  const upcomingEl = document.getElementById('cal-upcoming');
  const adminEl = document.getElementById('cal-admin');

  const pad = n => String(n).padStart(2, '0');
  const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
  const now = new Date();
  const todayIso = iso(now.getFullYear(), now.getMonth(), now.getDate());
  let byDate = {}, byMonth = {}, upcoming = [];
  let year = now.getFullYear(), month = now.getMonth(), selected = null, started = false;

  /* date « mois seulement » (e.approx) : pas de jour précis, l'événement est annoncé pour le mois entier ; sa clé de sélection est « AAAA-MM » */
  const keyOf = e => (e.approx ? e.date.slice(0, 7) : e.date);
  const eventsAt = key => (key && key.length === 7 ? byMonth[key] : byDate[key]);
  const when = e => (e.approx ? `${MOIS[+e.date.slice(5, 7) - 1]} ${e.date.slice(0, 4)} · date à confirmer` : fmtDate(e.date));

  function build() {
    byDate = {}; byMonth = {};
    EVENTS.forEach(e => { const t = e.approx ? byMonth : byDate, k = keyOf(e); (t[k] = t[k] || []).push(e); });
    upcoming = EVENTS.filter(e => keyOf(e) >= (e.approx ? todayIso.slice(0, 7) : todayIso)).sort((a, b) => a.date.localeCompare(b.date));
  }

  function renderGrid() {
    title.textContent = `${MOIS[month]} ${year}`;
    grid.querySelectorAll('.day').forEach(n => n.remove());
    const first = (new Date(year, month, 1).getDay() + 6) % 7;      // lundi = 0
    const days = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < first; i++) grid.insertAdjacentHTML('beforeend', '<span class="day empty"></span>');
    for (let d = 1; d <= days; d++) {
      const key = iso(year, month, d), evs = byDate[key];
      const el = document.createElement(evs ? 'button' : 'span');
      el.className = 'day' + (key === todayIso ? ' today' : '') + (evs ? ' has-event' : '') + (key === selected ? ' selected' : '');
      el.textContent = d;
      if (evs) {
        el.type = 'button';
        el.setAttribute('aria-label', `${d} ${MOIS[month]} : ${evs.map(e => e.title).join(', ')}`);
        el.insertAdjacentHTML('beforeend', `<i class="rune">●</i>`);
        el.addEventListener('click', () => select(key));
      }
      grid.appendChild(el);
    }
    renderMonthNote();
  }

  /* bandeau sous la grille : sorties prévues ce mois-ci sans jour précis */
  function renderMonthNote() {
    let note = root.querySelector('.cal-month');
    if (!note) { note = document.createElement('div'); note.className = 'cal-month'; grid.after(note); }
    const mk = `${year}-${pad(month + 1)}`, list = byMonth[mk] || [];
    note.innerHTML = ''; note.hidden = !list.length;
    list.forEach(e => {
      const b = document.createElement('button'); b.type = 'button';
      b.className = 'cal-month-chip' + (selected === mk ? ' selected' : '');
      b.innerHTML = `<i class="cal-month-rune">ᛟ</i><span>${esc(e.title)}</span><small>date à confirmer</small>`;
      b.addEventListener('click', () => select(mk));
      note.append(b);
    });
  }

  function eventEl(e) {
    const art = document.createElement('article');
    art.className = 'event';
    art.innerHTML = `
      <span class="rune ev-rune">●</span>
      <div><h4>${esc(e.title)}</h4>
      <p class="ev-meta">${esc(when(e))} ·${e.approx ? '' : esc(e.time) + ' ·'} ${esc(e.type)}</p>
      <p class="ev-meta">${esc(e.place)}</p>
      <p>${esc(e.desc)}</p></div>`;
    if (Admin.on) {
      const bar = Admin.el('div', 'adm-card-bar');
      const mk = (t, title, fn, cls) => { const b = Admin.el('button', 'adm-mini ' + (cls || ''), t); b.type = 'button'; b.title = title; b.onclick = fn; bar.append(b); };
      mk('✎', 'Modifier', () => eventForm(e));
      mk('✕', 'Supprimer', () => {
        Admin.confirm(`Supprimer « ${e.title} » ?`, () => { EVENTS.splice(EVENTS.indexOf(e), 1); saveEvents(); full(); });
      }, 'danger');
      art.append(bar);
    }
    return art;
  }

  function renderDetail() {
    detail.innerHTML = '';
    const list = eventsAt(selected);
    if (list) list.forEach(e => detail.append(eventEl(e)));
    else detail.innerHTML = `<p class="muted-note">${EVENTS.length ? 'Choisissez une date marquée d’une rune.' : 'Aucun événement pour le moment.'}</p>`;
  }

  function select(key) {
    selected = key;
    const [y, m] = key.split('-').map(Number);
    year = y; month = m - 1;
    renderGrid(); renderDetail();
  }

  function renderUpcoming() {
    upcomingEl.innerHTML = upcoming.slice(0, 8).map(e => `
      <li><button type="button" data-date="${esc(keyOf(e))}">
        <span class="rune">●</span>
        <span class="up-date">${esc(when(e))}</span>
        <span class="up-title">${esc(e.title)}</span>
      </button></li>`).join('') || '<li class="muted-note">Aucun événement à venir.</li>';
    upcomingEl.querySelectorAll('button').forEach(b => b.addEventListener('click', () => select(b.dataset.date)));
  }

  /* ---------- administration ---------- */
  const saveEvents = () => { EVENTS.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)); return Store.set('events', EVENTS); };
  function eventForm(e) {
    const PRECIS = 'Date précise', MOIS_SEUL = 'Mois seulement (date à confirmer)';
    const neuf = !e, base = Object.assign({ date: (selected && selected.length === 10 ? selected : todayIso), time: '10:00', title: '', type: 'Run', place: '', desc: '' }, e, { precision: e && e.approx ? MOIS_SEUL : PRECIS });
    Admin.form(neuf ? 'Ajouter un événement' : 'Modifier l’événement', [
      { name: 'precision', label: 'Précision de la date', type: 'select', options: [PRECIS, MOIS_SEUL] },
      { name: 'date', label: 'Date (si « mois seulement », choisissez n’importe quel jour du mois)', type: 'date', required: true },
      { name: 'time', label: 'Heure (ignorée si mois seulement)', type: 'time' },
      { name: 'title', label: 'Titre', required: true },
      { name: 'type', label: 'Type', type: 'select', options: Object.keys(EVENT_RUNES) },
      { name: 'place', label: 'Lieu' },
      { name: 'desc', label: 'Description', type: 'textarea', rows: 4 },
    ], base, v => {
      if (!v.date || !v.title.trim()) return false;
      const approx = v.precision === MOIS_SEUL;
      const out = { date: approx ? v.date.slice(0, 7) + '-01' : v.date, time: approx ? '' : v.time || '', title: v.title.trim(), type: v.type, place: v.place || '', desc: v.desc || '' };
      if (approx) out.approx = true;
      if (neuf) EVENTS.push(out); else EVENTS[EVENTS.indexOf(e)] = out;
      if (!saveEvents()) return false;
      build(); renderUpcoming(); select(keyOf(out));
    });
  }

  function renderAdmin() {
    adminEl.innerHTML = '';
    if (!Admin.on) return;
    const b = Admin.el('button', 'adm-add', '＋ Ajouter un événement');
    b.type = 'button'; b.onclick = () => eventForm(null);
    adminEl.append(b);
  }

  /* ---------- affichage complet (appelé aussi par le mode administrateur) ---------- */
  function full() {
    build(); renderUpcoming(); renderAdmin();
    if (!started) { started = true; selected = upcoming.length ? keyOf(upcoming[0]) : null; }
    if (selected && !eventsAt(selected)) selected = upcoming.length ? keyOf(upcoming[0]) : null;
    if (selected) { const [y, m] = selected.split("-").map(Number); year = y; month = m - 1; }
    renderGrid(); renderDetail();
  }
  window.renderCalendar = full;

  root.querySelectorAll('.cal-nav').forEach(b => b.addEventListener('click', () => {
    month += Number(b.dataset.dir);
    if (month < 0) { month = 11; year--; } else if (month > 11) { month = 0; year++; }
    renderGrid();
  }));

  full();
})();
