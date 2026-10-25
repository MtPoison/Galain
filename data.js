/* ================================================
   GALIAN MCP – sorties et calendrier
   Pour ajouter une sortie : copiez un bloc de SORTIES.
   Ses photos vont dans img/sorties/ (chemins ci-dessous).
   Pour ajouter un événement : ajoutez une ligne à EVENTS.
   ================================================ */
/* Compteur de pouces partagé (Supabase) : collez ici l'URL et la clé « anon public » du projet. Voir SUPABASE.md */
const SUPABASE_URL = 'https://hnmlvvmnpmiektatkspu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4U9ZfZdpriXK4c7Z2JUXnA_p1aWz3cR';

const LOREM_A ='Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
const LOREM_B = 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
const LOREM_C = 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.';

const SORTIES = [
  { id: 'grand-run-du-nord', title: 'Le Grand Run du Nord', date: '2026-09-20', place: 'Route des Crêtes', km: '420 km', riders: 24,
    images: ['img/sorties/grand-run-1.jpg', 'img/sorties/grand-run-2.jpg', 'img/sorties/grand-run-3.jpg', 'img/sorties/grand-run-4.jpg'],
    text: [LOREM_A, LOREM_B, LOREM_C] },
  { id: 'traversee-des-cols', title: 'Traversée des Cols', date: '2026-07-12', place: 'Massif des Alpes', km: '310 km', riders: 18,
    images: ['img/sorties/cols-1.jpg', 'img/sorties/cols-2.jpg', 'img/sorties/cols-3.jpg'],
    text: [LOREM_B, LOREM_A, LOREM_C] },
  { id: 'balade-du-solstice', title: 'Balade du Solstice', date: '2026-06-21', place: 'Bord de mer', km: '180 km', riders: 31,
    images: ['img/sorties/solstice-1.jpg', 'img/sorties/solstice-2.jpg', 'img/sorties/solstice-3.jpg'],
    text: [LOREM_C, LOREM_A, LOREM_B] },
  { id: 'rassemblement-des-clans', title: 'Rassemblement des Clans', date: '2026-06-14', place: 'Plaine de Midgard', km: '95 km', riders: 62,
    images: ['img/sorties/clans-1.jpg', 'img/sorties/clans-2.jpg', 'img/sorties/clans-3.jpg', 'img/sorties/clans-4.jpg'],
    text: [LOREM_A, LOREM_C, LOREM_B] },
  { id: 'feux-de-beltane', title: 'Nuit des Feux de Beltane', date: '2026-05-01', place: 'Forêt de Brocéliande', km: '140 km', riders: 22,
    images: ['img/sorties/beltane-1.jpg', 'img/sorties/beltane-2.jpg', 'img/sorties/beltane-3.jpg'],
    text: [LOREM_B, LOREM_C, LOREM_A] },
  { id: 'run-de-yule', title: 'Run de Yule', date: '2025-12-21', place: 'Vallée du Nord', km: '120 km', riders: 27,
    images: ['img/sorties/yule-1.jpg', 'img/sorties/yule-2.jpg', 'img/sorties/yule-3.jpg'],
    text: [LOREM_C, LOREM_B, LOREM_A] },
];

/* sorties des années précédentes */
SORTIES.push(
  { id: 'rassemblement-du-printemps', title: 'Rassemblement du Printemps', date: '2025-04-26', place: 'Plaine de Midgard', km: '110 km', riders: 40,
    images: ['img/sorties/printemps-1.jpg', 'img/sorties/printemps-2.jpg', 'img/sorties/printemps-3.jpg'], text: [LOREM_A, LOREM_B, LOREM_C] },
  { id: 'run-des-fjords', title: 'Run des Fjords', date: '2025-08-09', place: 'Côte Atlantique', km: '350 km', riders: 21,
    images: ['img/sorties/fjords-1.jpg', 'img/sorties/fjords-2.jpg', 'img/sorties/fjords-3.jpg'], text: [LOREM_B, LOREM_C, LOREM_A] },
  { id: 'nuit-de-samhain-2025', title: 'Nuit de Samhain', date: '2025-10-31', place: 'Le Hall du Clan', km: '60 km', riders: 33,
    images: ['img/sorties/samhain-1.jpg', 'img/sorties/samhain-2.jpg', 'img/sorties/samhain-3.jpg'], text: [LOREM_C, LOREM_A, LOREM_B] },
  { id: 'grand-run-des-cretes', title: 'Grand Run des Crêtes', date: '2024-06-15', place: 'Route des Crêtes', km: '390 km', riders: 19,
    images: ['img/sorties/cretes-1.jpg', 'img/sorties/cretes-2.jpg', 'img/sorties/cretes-3.jpg'], text: [LOREM_A, LOREM_C, LOREM_B] },
  { id: 'balade-de-lete', title: 'Balade de l’Été', date: '2024-07-27', place: 'Vallée du Nord', km: '160 km', riders: 28,
    images: ['img/sorties/ete-1.jpg', 'img/sorties/ete-2.jpg', 'img/sorties/ete-3.jpg'], text: [LOREM_B, LOREM_A, LOREM_C] },
  { id: 'run-de-yule-2024', title: 'Run de Yule', date: '2024-12-21', place: 'Forêt de Brocéliande', km: '100 km', riders: 25,
    images: ['img/sorties/yule24-1.jpg', 'img/sorties/yule24-2.jpg', 'img/sorties/yule24-3.jpg'], text: [LOREM_C, LOREM_B, LOREM_A] },
);
SORTIES.sort((a, b) => b.date.localeCompare(a.date));          // les plus récentes d'abord
const sortiesParAnnee = () => {
  const m = {};
  Store.get('years', []).forEach(y => { m[y] = []; });       // années ajoutées par l'administrateur (même vides)
  SORTIES.forEach(s => (m[s.date.slice(0, 4)] = m[s.date.slice(0, 4)] || []).push(s));
  return m;                                                    // { '2026': [...], '2025': [...], ... }
};

/* sorties « likées » par l'administrateur : 3 au maximum PAR ANNÉE, la plus ancienne est retirée au 4e like */
const MAX_LIKES = 3;
const anneeDe = s => s.date.slice(0, 4);
const likesChoisis = () => Store.get('likes', []).filter(id => SORTIES.some(s => s.id === id));   // likes faits à la main
const getLikes = () => {
  const choisis = likesChoisis(), out = [];
  [...new Set(SORTIES.map(anneeDe))].forEach(an => {
    const delAn = SORTIES.filter(s => anneeDe(s) === an);               // trié du plus récent au plus ancien
    const l = choisis.filter(id => delAn.some(s => s.id === id)).slice(-MAX_LIKES);
    /* moins de 3 likes dans l'année : on complète avec ses sorties les plus récentes */
    delAn.filter(s => !l.includes(s.id)).slice(0, MAX_LIKES - l.length).forEach(s => l.push(s.id));
    out.push(...l);
  });
  return out;
};
const estLike = id => getLikes().includes(id);
function toggleLike(id) {
  const s = SORTIES.find(x => x.id === id);
  let l = likesChoisis();
  if (l.includes(id)) l = l.filter(x => x !== id);
  else {
    l.push(id);
    const memeAn = l.filter(x => anneeDe(SORTIES.find(y => y.id === x)) === anneeDe(s));
    if (memeAn.length > MAX_LIKES) l.splice(l.indexOf(memeAn[0]), 1);   // 4e like de l'année : la plus ancienne est retirée
  }
  Store.set('likes', l);
  const eff = getLikes();
  document.querySelectorAll('.star[data-id]').forEach(st => st.classList.toggle('liked', eff.includes(st.dataset.id)));
}

/* carte d'une sortie (page d'accueil et pages d'année) */
function makeSortieCard(s) {
  const el = document.createElement('a');
  el.className = 'card';
  el.href = `sortie.html?id=${s.id}`;
  el.innerHTML = `
    <div class="card-img"><img src="${s.images[0]}" alt="${s.title}" loading="lazy"><span class="card-date">${fmtDate(s.date)}</span></div>
    <div class="card-body">
      <div class="card-title"><h3>${s.title}</h3>
        <div class="card-actions">
          <span class="star${estLike(s.id) ? ' liked' : ''}" data-id="${s.id}" role="img" aria-label="Sortie à la une"><svg viewBox="0 0 24 24"><path d="M12 2.500l2.900 6.100 6.600.8-4.900 4.600 1.300 6.600L12 17.300 6.100 20.600l1.300-6.600L2.500 9.400l6.600-.8z"/></svg></span>
          <span class="thumb-count" data-id="${s.id}">${nbPouces(s.id)}</span>
          <button type="button" class="thumb${aPouce(s.id) ? ' liked' : ''}" data-id="${s.id}" aria-label="J’aime cette sortie"><svg viewBox="0 0 24 24"><path d="M1 21h4V9H1zm22-11a2 2 0 0 0-2-2h-6.300l.9-4.600v-.3a1.500 1.500 0 0 0-.4-1.100L14.200 1 7.600 7.600A2 2 0 0 0 7 9v10a2 2 0 0 0 2 2h9a2 2 0 0 0 1.800-1.200l3-7a2 2 0 0 0 .2-.8z"/></svg></button>
        </div>
      </div>
      <p class="card-meta"><span class="runes">ᛗ</span> ${s.place} &nbsp; <span class="runes">ᚱ</span> ${s.km}</p>
      <span class="card-more">Lire la saga <span class="runes">ᚨ</span></span>
    </div>`;
  el.querySelector('.star').addEventListener('click', e => {
    if (typeof Admin === 'undefined' || !Admin.on) return;                     // seul l'administrateur peut liker
    e.preventDefault(); e.stopPropagation(); toggleLike(s.id);
  });
  el.querySelector('.thumb').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); togglePouce(s.id); });
  const img = el.querySelector('img');
  img.addEventListener('error', () => { img.onerror = null; img.src = PHOTO_FALLBACK; }, { once: true });
  return el;
}

/* pouces des visiteurs : mémorisés dans leur navigateur (pas de serveur). Le compteur = pouces publiés (SITE_DATA.thumbs) + le sien */
const THUMB_KEY = 'galian-thumbs';
const mesPouces = () => { try { return JSON.parse(localStorage.getItem(THUMB_KEY)) || []; } catch (e) { return []; } };
const aPouce = id => mesPouces().includes(id);
/* Compteur partagé via Supabase (voir SUPABASE_URL / SUPABASE_KEY en haut du fichier). Sans ces clés : compteur local. */
const THUMBS_ON = !!(SUPABASE_URL && SUPABASE_KEY);
const thumbCounts = {};
const sbFetch = (path, opts = {}) => fetch(SUPABASE_URL + '/rest/v1/' + path, Object.assign({
  /* les clés « sb_publishable_… » ne sont pas des JWT : seule l'ancienne clé anon (eyJ…) va aussi dans Authorization */
  headers: Object.assign({ apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
    SUPABASE_KEY.startsWith('eyJ') ? { Authorization: 'Bearer ' + SUPABASE_KEY } : {}) }, opts));
const nbPouces = THUMBS_ON
  ? id => thumbCounts[id] || 0
  : id => ((window.SITE_DATA && SITE_DATA.thumbs && SITE_DATA.thumbs[id]) || 0) + (aPouce(id) ? 1 : 0);
const majCompteurs = id => document.querySelectorAll(id ? `.thumb-count[data-id="${id}"]` : '.thumb-count').forEach(c => { c.textContent = nbPouces(c.dataset.id); });
if (THUMBS_ON) {
  sbFetch('thumbs?select=sortie_id,count').then(r => r.json())
    .then(rows => { rows.forEach(r => { thumbCounts[r.sortie_id] = r.count; }); majCompteurs(); }).catch(() => {});
}
function togglePouce(id) {
  const l = mesPouces(), i = l.indexOf(id), delta = i < 0 ? 1 : -1;
  if (i < 0) l.push(id); else l.splice(i, 1);
  try { localStorage.setItem(THUMB_KEY, JSON.stringify(l)); } catch (e) {}
  document.querySelectorAll(`.thumb[data-id="${id}"]`).forEach(b => b.classList.toggle('liked', i < 0));
  if (THUMBS_ON) {
    thumbCounts[id] = Math.max(0, (thumbCounts[id] || 0) + delta);                 // affichage immédiat, puis envoi au serveur
    sbFetch('rpc/toggle_thumb', { method: 'POST', body: JSON.stringify({ p_id: id, p_delta: delta }) })
      .then(r => r.json()).then(n => { if (typeof n === 'number') { thumbCounts[id] = n; majCompteurs(id); } }).catch(() => {});
  }
  majCompteurs(id);
}

/* type : Run · Rassemblement · Soirée · Atelier · Salon · Assemblée */
const EVENTS = [
  { date: '2026-10-31', time: '20:00', title: 'Nuit de Samhain', type: 'Soirée', place: 'Le Hall du Clan', desc: 'Balade nocturne aux flambeaux puis festin dans le hall. Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
  { date: '2026-11-08', time: '09:30', title: 'Run d’Automne', type: 'Run', place: 'Départ : place du village', desc: '150 km à travers les forêts rousses. Ut enim ad minim veniam, quis nostrud exercitation.' },
  { date: '2026-11-21', time: '14:00', title: 'La Forge – Atelier mécanique', type: 'Atelier', place: 'Garage du club', desc: 'Révision hivernale des montures, huile et outils partagés. Duis aute irure dolor in reprehenderit.' },
  { date: '2026-12-13', time: '10:00', title: 'Run de Yule', type: 'Run', place: 'Vallée du Nord', desc: 'Notre run de fin d’année, guirlandes et feux de camp. Excepteur sint occaecat cupidatat.' },
  { date: '2026-12-21', time: '19:00', title: 'Solstice d’Hiver', type: 'Soirée', place: 'Le Hall du Clan', desc: 'La nuit la plus longue, l’hydromel le plus fort. Sed ut perspiciatis unde omnis.' },
  { date: '2027-01-16', time: '15:00', title: 'Assemblée du Clan', type: 'Assemblée', place: 'Le Hall du Clan', desc: 'Bilan de la saison et programme à venir. Nemo enim ipsam voluptatem quia voluptas.' },
  { date: '2027-02-13', time: '10:00', title: 'Salon de la Moto', type: 'Salon', place: 'Parc des expositions', desc: 'Visite groupée du salon, départ en convoi. Neque porro quisquam est qui dolorem.' },
  { date: '2027-03-20', time: '11:00', title: 'Ouverture de Saison – Équinoxe', type: 'Rassemblement', place: 'Plaine de Midgard', desc: 'Bénédiction des motos et premier grand run de l’année. Ut enim ad minima veniam.' },
  { date: '2027-04-24', time: '09:00', title: 'Grand Run du Printemps', type: 'Run', place: 'Route des Crêtes', desc: '400 km, deux étapes, une seule meute. Quis autem vel eum iure reprehenderit.' },
  { date: '2027-05-29', time: '12:00', title: 'Rassemblement des Clans Alliés', type: 'Rassemblement', place: 'Plaine de Midgard', desc: 'Tous nos frères d’armes réunis. At vero eos et accusamus et iusto odio dignissimos.' },
];

const EVENT_RUNES = { Run: 'ᚱ', Rassemblement: 'ᛗ', Soirée: 'ᛒ', Atelier: 'ᚲ', Salon: 'ᛊ', Assemblée: 'ᚦ' };

/* image de secours si une photo manque */
const PHOTO_FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260"><rect width="400" height="260" fill="#0f0f0f"/>
   <path d="M0 200l70-70 50 45 80-100 90 110 50-40 60 55v60H0z" fill="#1c1c1c"/>
   <circle cx="310" cy="70" r="22" fill="none" stroke="#4d4d4d" stroke-width="3"/>
   <text x="200" y="245" text-anchor="middle" font-size="18" fill="#6a6a6a" font-family="serif">ᛟ  PHOTO  ᛟ</text></svg>`);

const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const fmtDate = iso => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MOIS[m - 1].toLowerCase()} ${y}`; };

/* ---------- contenu modifié par l'administrateur (voir store.js) ---------- */
(() => {
  const s = Store.get('sorties', null);
  if (s) { SORTIES.length = 0; SORTIES.push(...s); SORTIES.sort((a, b) => b.date.localeCompare(a.date)); }
  const e = Store.get('events', null);
  if (e) { EVENTS.length = 0; EVENTS.push(...e); }
})();
