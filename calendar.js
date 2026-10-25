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
  let byDate = {}, upcoming = [];
  let year = now.getFullYear(), month = now.getMonth(), selected = null, started = false;

  function build() {
    byDate = {};
    EVENTS.forEach(e => (byDate[e.date] = byDate[e.date] || []).push(e));
    upcoming = EVENTS.filter(e => e.date >= todayIso).sort((a, b) => a.date.localeCompare(b.date));
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
        el.insertAdjacentHTML('beforeend', `<i class="rune">${esc(EVENT_RUNES[evs[0].type] || 'ᛟ')}</i>`);
        el.addEventListener('click', () => select(key));
      }
      grid.appendChild(el);
    }
  }

  function eventEl(e) {
    const art = document.createElement('article');
    art.className = 'event';
    art.innerHTML = `
      <span class="rune ev-rune">${esc(EVENT_RUNES[e.type] || 'ᛟ')}</span>
      <div><h4>${esc(e.title)}</h4>
      <p class="ev-meta">${esc(fmtDate(e.date))} ·${esc(e.time)} · ${esc(e.type)}</p>
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
    const list = byDate[selected];
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
    upcomingEl.innerHTML = upcoming.slice(0, 5).map(e => `
      <li><button type="button" data-date="${esc(e.date)}">
        <span class="rune">${esc(EVENT_RUNES[e.type] || 'ᛟ')}</span>
        <span class="up-date">${esc(fmtDate(e.date))}</span>
        <span class="up-title">${esc(e.title)}</span>
      </button></li>`).join('') || '<li class="muted-note">Aucun événement à venir.</li>';
    upcomingEl.querySelectorAll('button').forEach(b => b.addEventListener('click', () => select(b.dataset.date)));
  }

  /* ---------- administration ---------- */
  const saveEvents = () => { EVENTS.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)); return Store.set('events', EVENTS); };
  function eventForm(e) {
    const neuf = !e, base = e || { date: selected || todayIso, time: '10:00', title: '', type: 'Run', place: '', desc: '' };
    Admin.form(neuf ? 'Ajouter un événement' : 'Modifier l’événement', [
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'time', label: 'Heure', type: 'time' },
      { name: 'title', label: 'Titre', required: true },
      { name: 'type', label: 'Type', type: 'select', options: Object.keys(EVENT_RUNES) },
      { name: 'place', label: 'Lieu' },
      { name: 'desc', label: 'Description', type: 'textarea', rows: 4 },
    ], base, v => {
      if (!v.date || !v.title.trim()) return false;
      const out = { date: v.date, time: v.time || '', title: v.title.trim(), type: v.type, place: v.place || '', desc: v.desc || '' };
      if (neuf) EVENTS.push(out); else EVENTS[EVENTS.indexOf(e)] = out;
      if (!saveEvents()) return false;
      build(); renderUpcoming(); select(out.date);
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
    if (!started) { started = true; selected = upcoming.length ? upcoming[0].date : null; }
    if (selected && !byDate[selected]) selected = upcoming.length ? upcoming[0].date : null;
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
