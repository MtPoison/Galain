/* ================================================
   GALIAN MCP – contenu du site
   Les valeurs ci-dessous sont le contenu PAR DÉFAUT.
   Elles peuvent être modifiées depuis le mode administrateur
   (voir admin.js / store.js) sans toucher à ce fichier.
   ================================================ */
const HISTOIRE_DEFAULT = {
  paragraphs: [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Galian est né sur la route, forgé par le vent, la pluie et le grondement des moteurs. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua, ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  ],
  values: [
    { rune: 'ᛏ', title: 'Honneur',    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod.' },
    { rune: 'ᚹ', title: 'Fraternité', text: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.' },
    { rune: 'ᚱ', title: 'Liberté',    text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse.' },
  ],
};

const MEMBERS_DEFAULT = [
  { surname: 'alain',   portrait: 'img/membre1.png', bike: 'img/moto1.jpg' },
  { surname: 'roadger', portrait: 'img/membre2.png', bike: 'img/moto2.jpg' },
  { surname: 'lapin',   portrait: 'img/membre3.png', bike: 'img/moto3.jpg' },
  { surname: 'vador',   portrait: 'img/membre4.png', bike: 'img/moto4.jpg' },
  { surname: 'david',   portrait: 'img/membre5.png', bike: 'img/moto5.jpg' },
];

const ALLIES_DEFAULT = [
  { name: 'Odin Riders',    logo: 'img/ally1.png', url: '#' },
  { name: 'Valkyrie MC',    logo: 'img/ally2.png', url: '#' },
  { name: 'Thor’s Wheels',  logo: 'img/ally3.png', url: '#' },
  { name: 'Fenrir Pack',    logo: 'img/ally4.png', url: '#' },
  { name: 'Midgard Bikers', logo: 'img/ally5.png', url: '#' },
];

/* ---------- images de secours (si le fichier n'existe pas) ---------- */
const svg = s => 'data:image/svg+xml;utf8,' + encodeURIComponent(s);
const FALLBACK = {
  photo: PHOTO_FALLBACK,
  portrait: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1c1c"/><stop offset="1" stop-color="#050505"/></linearGradient></defs><rect width="300" height="400" fill="url(#g)"/><circle cx="150" cy="150" r="62" fill="#333"/><path d="M40 400c0-90 50-135 110-135s110 45 110 135z" fill="#333"/><text x="150" y="375" text-anchor="middle" font-size="22" fill="#f4f4f4" font-family="serif" opacity=".7">PORTRAIT</text></svg>`),
  bike: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><rect width="320" height="200" fill="#0f0f0f"/><g fill="none" stroke="#4d4d4d" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><circle cx="75" cy="135" r="38"/><circle cx="245" cy="135" r="38"/><path d="M75 135l55-55h60l55 55M130 80l-12-22h-22M190 80l-8-28h30"/></g></svg>`),
  ally: svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 8l36 14v28c0 24-16 38-36 44C30 88 14 74 14 50V22z" fill="none" stroke="#f4f4f4" stroke-width="5"/><text x="50" y="62" text-anchor="middle" font-size="34" fill="#f4f4f4" font-family="serif">ᛟ</text></svg>`),
};
function safeImg(img, type) {
  img.addEventListener('error', () => { img.onerror = null; img.src = FALLBACK[type]; }, { once: true });
}

/* ---------- outils ---------- */
const $ = s => document.querySelector(s);
const el = Admin.el;
const A = () => Admin.on;
const adminBtn = (txt, title, fn, cls = '') => {
  const b = el('button', 'adm-mini ' + cls, txt); b.type = 'button'; b.title = title;
  b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); fn(); });
  return b;
};
const addTile = (txt, fn, cls = '') => {
  const b = el('button', 'adm-add ' + cls, txt); b.type = 'button'; b.addEventListener('click', fn); return b;
};
/* champ modifiable sur place ; `ph` = texte indicatif grisé, affiché seulement quand le champ est vide */
const editable = (node, onChange, ph) => {
  node.contentEditable = 'true'; node.classList.add('editable'); node.spellcheck = false;
  if (ph) node.dataset.ph = ph;
  node.addEventListener('blur', () => onChange(node.textContent.trim()));
  node.addEventListener('keydown', e => { if (e.key === 'Enter' && node.tagName !== 'P') { e.preventDefault(); node.blur(); } });
};

/* ---------- apparition au scroll ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const delay = e.target.classList.contains('member')
        ? [...e.target.parentElement.children].indexOf(e.target) % 3 * 120 : 0;
      setTimeout(() => e.target.classList.add('in'), delay);
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ================= NOTRE HISTOIRE ================= */
let focusWanted = null, focusPara = null;                  // focusPara : index du paragraphe à rouvrir après un saut de ligne
function renderHistoire() {
  const h = Store.get('histoire', HISTOIRE_DEFAULT);
  const lead = $('#histoire-text'), cards = $('#histoire-cards');
  const save = () => Store.set('histoire', h);
  /* nouvel ordre lu dans la page, puis enregistré */
  const reorder = (box, sel, key) => {
    const cur = Store.get('histoire', HISTOIRE_DEFAULT);
    cur[key] = [...box.querySelectorAll(sel)].map(n => cur[key][+n.dataset.i]);
    if (Store.set('histoire', cur)) renderHistoire();
  };
  lead.innerHTML = ''; cards.innerHTML = '';

  /* un nouvel élément est créé VIDE : le texte indicatif grisé disparaît dès qu'on écrit */
  let focusNode = null, caretStart = false;
  const want = focusWanted; focusWanted = null; const fp = focusPara; focusPara = null;             // 'p' ou 'card' : juste après un ajout
  const premier = h.paragraphs.findIndex(t => t.trim());     // première lettrine = premier paragraphe non vide

  h.paragraphs.forEach((txt, i) => {
    if (!A() && !txt.trim()) return;                        // les paragraphes vides ne s'affichent pas aux visiteurs
    const p = el('p', i === premier ? 'p-first' : ''); p.textContent = txt;
    if (!A()) { lead.append(p); return; }
    const wrap = el('div', 'adm-para'); let cutting = false;
    editable(p, v => { if (!cutting) { h.paragraphs[i] = v; save(); } }, 'Nouveau paragraphe…');
    /* un saut de ligne (Entrée, ou un texte collé sur plusieurs lignes) crée un nouveau paragraphe */
    const cut = parts => {
      cutting = true;                                       // évite que l'ancien champ réécrive son texte en perdant le focus
      h.paragraphs.splice(i, 1, ...parts); save(); focusPara = i + parts.length - 1; renderHistoire();
    };
    const caret = () => {
      const s = getSelection(); if (!s.rangeCount) return p.textContent.length;
      const r = s.getRangeAt(0).cloneRange(); r.selectNodeContents(p); r.setEnd(s.getRangeAt(0).endContainer, s.getRangeAt(0).endOffset);
      return r.toString().length;
    };
    p.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const t = p.textContent, o = caret();
      cut([t.slice(0, o).trim(), t.slice(o).trim()]);
    });
    p.addEventListener('paste', e => {
      e.preventDefault();
      const txt = (e.clipboardData || window.clipboardData).getData('text/plain');
      if (!/\n/.test(txt)) { document.execCommand('insertText', false, txt); return; }
      const t = p.textContent, o = caret();
      cut((t.slice(0, o) + txt + t.slice(o)).split(/\r?\n+/).map(x => x.trim()));
    });
    wrap.append(p, adminBtn('✕', 'Supprimer ce paragraphe', () => {
      Admin.confirm('Supprimer ce paragraphe ?', () => { h.paragraphs.splice(i, 1); save(); renderHistoire(); });
    }, 'danger'));
    wrap.dataset.i = i; wrap.append(makeHandle()); holdDrag(wrap, lead, '.adm-para', 'y', () => reorder(lead, '.adm-para', 'paragraphs'), HANDLE);
    lead.append(wrap);
    if (want === 'p' && i === h.paragraphs.length - 1) focusNode = p;
    if (fp === i) { focusNode = p; caretStart = true; }
  });
  if (A()) lead.append(addTile('＋ Ajouter un paragraphe', () => { h.paragraphs.push(''); save(); focusWanted = 'p'; renderHistoire(); }));
  lead.hidden = !A() && !h.paragraphs.some(t => t.trim());

  h.values.forEach((v, i) => {
    if (!A() && !(v.title || v.text || '').trim()) return;  // carte vide : invisible pour les visiteurs
    const a = el('article');
    const r = el('span', 'runes'), t = el('h3'), p = el('p');
    r.textContent = v.rune; t.textContent = v.title; p.textContent = v.text;
    a.append(r, t, p);
    if (A()) {
      editable(r, x => { h.values[i].rune = x; save(); }, 'ᛟ');
      editable(t, x => { h.values[i].title = x; save(); }, 'Nouveau titre');
      editable(p, x => { h.values[i].text = x; save(); }, 'Votre texte ici…');
      a.append(adminBtn('✕', 'Supprimer cette carte', () => {
        Admin.confirm('Supprimer cette carte ?', () => { h.values.splice(i, 1); save(); renderHistoire(); });
      }, 'danger corner'));
      a.dataset.i = i; a.append(makeHandle()); holdDrag(a, cards, 'article[data-i]', 'x', () => reorder(cards, 'article[data-i]', 'values'), HANDLE);
      if (want === 'card' && i === h.values.length - 1) focusNode = t;
    }
    cards.append(a);
  });
  if (A()) cards.append(addTile('＋ Ajouter une carte', () => {
    h.values.push({ rune: '', title: '', text: '' }); save(); focusWanted = 'card'; renderHistoire();
  }, 'tile'));

  if (focusNode) setTimeout(() => {                           // curseur directement dans le nouveau champ
    focusNode.focus();
    if (caretStart) { const r = document.createRange(); r.selectNodeContents(focusNode); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }   // au début du nouveau paragraphe
  }, 0);
}

/* ================= MEMBRES ================= */
function memberForm(list, i) {
  const m = i == null ? {} : list[i];
  Admin.form(i == null ? 'Ajouter un membre' : 'Modifier le membre', [
    { name: 'surname', label: 'Nom (affiché au survol, toujours en minuscules)', required: true, lower: true },
    { name: 'portrait', label: 'Portrait', type: 'image', mode: 'portrait', hint: 'Idéal : image sur fond noir ou détourée. Elle est centrée sur un cadre noir 3:4.' },
    { name: 'bike', label: 'Photo de la moto', type: 'image', mode: 'bike', hint: 'La moto est détourée (fond uni retiré) et centrée sur fond noir. Idéal : photo sur fond uni.' },
  ], { surname: m.surname || '', portrait: m.portrait || '', bike: m.bike || '' }, v => {
    if (!v.surname.trim()) return false;
    const nm = { surname: v.surname.trim().toLowerCase(), portrait: v.portrait, bike: v.bike };
    if (i == null) list.push(nm); else list[i] = nm;
    if (Store.set('members', list)) renderMembers(); else return false;
  });
}
/* ordre des membres (mode administrateur) : appui prolongé puis glisser */
function saveMemberOrder(box) {
  const list = Store.get('members', MEMBERS_DEFAULT);
  const ordre = [...box.querySelectorAll('.member[data-i]')].map(a => list[+a.dataset.i]);
  if (Store.set('members', ordre)) renderMembers();
}
function renderMembers() {
  const list = Store.get('members', MEMBERS_DEFAULT), box = $('#members');
  box.innerHTML = '';
  list.forEach((m, i) => {
    const art = el('article', 'member');
    art.innerHTML = `
      <div class="portrait">
        <img src="${esc(safeSrc(m.portrait))}" alt="Portrait" loading="lazy" draggable="false">
        <div class="overlay"><span class="rune-line">ᚦ ᛟ ᚦ</span><span class="surname"></span></div>
      </div>
      <figure class="bike"><img src="${esc(safeSrc(m.bike))}" alt="Moto" loading="lazy"></figure>`;
    art.querySelector('.surname').textContent = m.surname;
    safeImg(art.querySelector('.portrait img'), 'portrait');
    safeImg(art.querySelector('.bike img'), 'bike');
    if (A()) {
      art.dataset.i = i;
      art.append(makeHandle()); holdDrag(art, box, '.member[data-i]', 'x', () => saveMemberOrder(box), HANDLE);
    }
    if (A()) {
      const bar = el('div', 'adm-card-bar');
      bar.append(adminBtn('✎', 'Modifier', () => memberForm(list, i)),
        adminBtn('✕', 'Supprimer ce membre', () => {
          Admin.confirm(`Supprimer « ${m.surname} » ?`, () => { list.splice(i, 1); Store.set('members', list); renderMembers(); });
        }, 'danger'));
      art.append(bar);
    }
    box.append(art); io.observe(art);
  });
  if (A()) {
    const tile = el('article', 'member in');
    tile.append(addTile('＋ Ajouter un membre', () => memberForm(list, null), 'tile portrait-tile'));
    box.append(tile);
  }
}

/* ================= SORTIES ================= */
const PAR_ANNEE = 3;                                           // nombre de sorties montrées par année sur l'accueil
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const saveSorties = () => { SORTIES.sort((a, b) => b.date.localeCompare(a.date)); return Store.set('sorties', SORTIES); };

function sortieForm(s, an) {
  const neuf = !s;
  const base = s || { id: '', title: '', date: `${an}-06-01`, place: '', km: '', riders: '', images: [], text: [] };
  Admin.form(neuf ? `Ajouter une sortie (${an})` : 'Modifier la sortie', [
    { name: 'title', label: 'Titre', required: true },
    { name: 'date', label: 'Date (détermine l’année)', type: 'date', required: true },
    { name: 'place', label: 'Lieu' },
    { name: 'km', label: 'Distance', placeholder: 'ex. 250 km' },
    { name: 'riders', label: 'Nombre de motards', type: 'number' },
    { name: 'images', label: 'Images (la première sert de couverture)', type: 'images', mode: 'photo' },
    { name: 'text', label: 'Texte (séparez les paragraphes par une ligne vide)', type: 'textarea', rows: 9 },
  ], Object.assign({}, base, { text: base.text.join('\n\n') }), v => {
    if (!v.title.trim() || !v.date) return false;
    const out = {
      id: neuf ? `${slug(v.title) || 'sortie'}-${Date.now().toString(36)}` : base.id,
      title: v.title.trim(), date: v.date, place: v.place || '', km: v.km || '', riders: Number(v.riders) || 0,
      images: v.images.length ? v.images : ['img/sorties/vide.jpg'],
      text: v.text.split(/\n\s*\n/).map(t => t.trim()).filter(Boolean),
    };
    if (neuf) SORTIES.push(out); else SORTIES[SORTIES.findIndex(x => x.id === base.id)] = out;
    if (!saveSorties()) return false;
    renderSorties();
  });
}
function renderSorties() {
  const yearsEl = $('#sorties-years'), parAnnee = sortiesParAnnee();
  yearsEl.innerHTML = '';
  if (A()) {
    yearsEl.append(addTile('＋ Ajouter une année', () => {
      const y = (prompt('Quelle année ? (ex. 2027)') || '').trim();
      if (!/^\d{4}$/.test(y)) { if (y) alert('Entrez une année à 4 chiffres.'); return; }
      const ys = Store.get('years', []); if (!ys.includes(y) && !parAnnee[y]) { ys.push(y); Store.set('years', ys); }
      renderSorties();
    }, 'wide'));
  }
  Object.keys(parAnnee).sort((a, b) => b - a).forEach(an => {
    const liste = parAnnee[an], bloc = el('div', 'year-block reveal');
    bloc.innerHTML = `
      <a class="year-head" href="annee.html?y=${encodeURIComponent(an)}" aria-label="Toutes les sorties ${esc(an)}">
        <span class="year-num">${esc(an)}</span>
        <span class="year-count">${liste.length} sortie${liste.length > 1 ? 's' : ''}</span>
        <span class="year-more">Voir toutes les sorties</span>
      </a>`;
    if (A()) {
      const bar = el('div', 'adm-year-bar');
      bar.append(addTile('＋ Ajouter une sortie', () => sortieForm(null, an)),
        adminBtn('✕ Supprimer l’année', 'Supprimer cette année' + (liste.length ? ' et ses sorties' : ''), () => {
          Admin.confirm(liste.length ? `Supprimer ${an} ET ses ${liste.length} sortie(s) ?` : `Supprimer l’année ${an} ?`, () => {
            for (let k = SORTIES.length - 1; k >= 0; k--) if (SORTIES[k].date.slice(0, 4) === an) SORTIES.splice(k, 1);
            Store.set('years', Store.get('years', []).filter(y => y !== an));
            saveSorties(); renderSorties();
          });
        }, 'danger text'));
      bloc.append(bar);
    }
    const cartes = el('div', 'cards');
    /* l'accueil n'affiche que les sorties likées (les likes se font sur les pages d'année) */
    const likees = liste.filter(s => estLike(s.id));
    likees.forEach(s => {
      const card = makeSortieCard(s);
      if (!A()) { cartes.append(card); return; }
      const wrap = el('div', 'card-wrap'), bar = el('div', 'adm-card-bar');
      bar.append(adminBtn('✎', 'Modifier', () => sortieForm(s, an)),
        adminBtn('✕', 'Supprimer', () => {
          Admin.confirm(`Supprimer « ${s.title} » ?`, () => { SORTIES.splice(SORTIES.findIndex(x => x.id === s.id), 1); saveSorties(); renderSorties(); });
        }, 'danger'));
      wrap.append(card, bar); cartes.append(wrap);
    });
    bloc.append(cartes); yearsEl.append(bloc); io.observe(bloc);
  });
}

/* ================= CLUBS AMIS ================= */
function allyForm(list, i) {
  const a = i == null ? {} : list[i];
  Admin.form(i == null ? 'Ajouter un club ami' : 'Modifier le club', [
    { name: 'name', label: 'Nom du club', required: true },
    { name: 'logo', label: 'Logo', type: 'image', mode: 'logo' },
  ], { name: a.name || '', logo: a.logo || '' }, v => {
    if (!v.name.trim()) return false;
    const n = { name: v.name.trim(), logo: v.logo, url: a.url || '#' };
    if (i == null) list.push(n); else list[i] = n;
    if (Store.set('allies', list)) renderAllies(); else return false;
  });
}
function renderAllies() {
  const list = Store.get('allies', ALLIES_DEFAULT), box = $('#allies-list');
  box.innerHTML = '';
  list.forEach((a, i) => {
    const link = el('div', 'ally');                       // pas un lien : un clic ne fait rien
    link.innerHTML = '<img alt="" loading="lazy"><span></span>';
    link.querySelector('img').src = safeSrc(a.logo); link.querySelector('img').alt = 'Logo ' + a.name;
    link.querySelector('span').textContent = a.name;
    safeImg(link.querySelector('img'), 'ally');
    if (!A()) { box.append(link); return; }
    link.addEventListener('click', e => e.preventDefault());
    const wrap = el('div', 'ally-wrap'), bar = el('div', 'adm-card-bar');
    bar.append(adminBtn('✎', 'Modifier', () => allyForm(list, i)),
      adminBtn('✕', 'Retirer ce club', () => {
        Admin.confirm(`Retirer « ${a.name} » ?`, () => { list.splice(i, 1); Store.set('allies', list); renderAllies(); });
      }, 'danger'));
    wrap.append(link, bar); box.append(wrap);
  });
  if (A()) box.append(addTile('＋ Ajouter un club', () => allyForm(list, null), 'tile ally-tile'));
}

/* ================= GALERIE ART ================= */
function renderGalerie() {
  const box = $('#art-gallery'), tout = galerieListe();
  box.innerHTML = '';
  /* les 4 dernières images ajoutées ; les autres sont sur galerie.html */
  tout.slice(0, GALERIE_APERCU).forEach(({ g, i }) => {
    const fig = makeArtItem(g);
    if (!A()) { box.append(fig); return; }
    const list = Store.get('galerie', GALERIE_DEFAULT);
    const cell = el('div', 'art-wrap'), bar = el('div', 'adm-card-bar');
    bar.append(adminBtn('✎', 'Modifier', () => galerieForm(list, i, renderGalerie)),
      adminBtn('✕', 'Supprimer', () => {
        Admin.confirm('Supprimer cette image ?', () => { list.splice(i, 1); Store.set('galerie', list); renderGalerie(); });
      }, 'danger'));
    cell.style.flex = fig.style.flex; cell.append(fig, bar); box.append(cell);
    fig.querySelector('img').addEventListener('load', () => { cell.style.flex = fig.style.flex; });
  });
  if (A()) box.prepend(addTile('＋ Ajouter une image', () => galerieForm(Store.get('galerie', GALERIE_DEFAULT), null, renderGalerie), 'tile'));
  $('#galerie-more').hidden = false;
}

/* ================= ORDRE DES TOPIQUES ================= */
const SECTIONS_DEFAULT = ['philosophie', 'freres', 'sorties', 'galerie', 'calendrier', 'allies'];
const SECTION_NAMES = { philosophie: 'Notre histoire', freres: 'Membres', sorties: 'Sorties', galerie: 'Galerie art', calendrier: 'Calendrier', allies: 'Clubs amis' };
function renderOrder() {
  let order = Store.get('order', SECTIONS_DEFAULT).filter(id => SECTIONS_DEFAULT.includes(id));
  SECTIONS_DEFAULT.forEach(id => { if (!order.includes(id)) order.push(id); });
  const page = $('.page'), footer = $('#reseaux'), nav = $('.nav'), reseaux = nav.querySelector('a[href="#reseaux"]');
  order.forEach(id => {
    page.insertBefore($('#' + id), footer);                           // les sections, dans l'ordre choisi
    const a = nav.querySelector(`a[href="#${id}"]`); if (a) nav.append(a);   // le menu suit le même ordre
  });
  if (reseaux) nav.append(reseaux);
  document.querySelectorAll('.adm-order').forEach(n => n.remove());
  if (!A()) return;
  order.forEach((id, i) => {
    const bar = el('div', 'adm-order'), move = d => {
      const j = i + d; if (j < 0 || j >= order.length) return;
      [order[i], order[j]] = [order[j], order[i]]; Store.set('order', order); renderOrder();
      $('#' + id).scrollIntoView({ block: 'center' });
    };
    bar.append(makeHandle(), el('span', '', SECTION_NAMES[id]), adminBtn('↑', 'Monter ce topique', () => move(-1)), adminBtn('↓', 'Descendre ce topique', () => move(1)));
    $('#' + id).prepend(bar);
    holdDrag($('#' + id), page, '.page > .section', 'y', () => {      // appui sur la poignée, puis glisser
      Store.set('order', [...page.querySelectorAll(':scope > .section')].map(s => s.id)); renderOrder();
    }, HANDLE);
  });
}

/* ================= tout redessiner ================= */
function renderAll() {
  renderHistoire(); renderMembers(); renderSorties(); renderGalerie(); renderAllies(); renderOrder();
  if (window.renderCalendar) renderCalendar();
}
Admin.onChange = renderAll;
renderAll();

/* ---------- braises flottantes ---------- */
(() => {
  const c = document.getElementById('embers');
  const ctx = c.getContext('2d');
  let w, h, parts;
  const spawn = (initial) => ({
    x: Math.random() * w,
    y: initial ? Math.random() * h : h + 10,
    r: Math.random() * 2 + .5,
    vy: Math.random() * .6 + .2,
    vx: (Math.random() - .5) * .4,
    a: Math.random() * .7 + .2,
    p: Math.random() * Math.PI * 2,
  });
  function resize() {
    w = c.width = innerWidth; h = c.height = innerHeight;
    parts = Array.from({ length: Math.min(70, Math.floor(w / 18)) }, () => spawn(true));
  }
  addEventListener('resize', resize); resize();
  /* les braises tournent aussi quand Windows a coupé les animations (« réduire les animations ») : sinon elles ne s'affichent jamais sur PC */
  (function loop() {
    ctx.clearRect(0, 0, w, h);
    parts.forEach((p, i) => {
      p.y -= p.vy; p.p += .02; p.x += p.vx + Math.sin(p.p) * .3;
      if (p.y < -10) parts[i] = spawn(false);
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${p.a * .5})`;
      ctx.shadowColor = '#fff'; ctx.shadowBlur = 6;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(loop);
  })();
})();


/* ================= MOTO EN GRAND ================= */
(() => {
  const box = document.createElement('div');
  box.className = 'lightbox moto-box'; box.setAttribute('aria-hidden', 'true');
  box.innerHTML = '<button type="button" class="lb-close" aria-label="Fermer">✕</button><img alt="Moto">';
  document.body.append(box);
  const img = box.querySelector('img');
  const close = () => { box.classList.remove('open'); box.setAttribute('aria-hidden', 'true'); };
  /* clic sur une moto : elle s'ouvre en grand (pas en mode administrateur, où l'appui sert à déplacer) */
  $('#members').addEventListener('click', e => {
    const src = e.target.closest('.bike img');
    if (!src || A()) return;
    img.src = safeSrc(src.getAttribute('src')); box.classList.add('open'); box.setAttribute('aria-hidden', 'false');
  });
  box.addEventListener('click', e => { if (e.target !== img) close(); });       // croix ou clic à côté de l'image
  addEventListener('keydown', e => { if (e.key === 'Escape' && box.classList.contains('open')) close(); });
})();

/* affiche le fond viking seulement une fois la page défilée (voir .deja-defile dans style.css) */
(() => {
  const maj = () => { const c = document.documentElement.classList; c.toggle('deja-defile', scrollY >= 2); c.toggle('tire', scrollY < 0); };
  addEventListener('scroll', maj, { passive: true }); addEventListener('pageshow', maj); maj();
})();
