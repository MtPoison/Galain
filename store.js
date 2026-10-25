/* ==========================================================
   GALIAN MCP – stockage des données modifiables
   Avec Supabase (clés ci-dessous) : le contenu publié est stocké en ligne.
   Les modifications de l'administrateur restent en brouillon dans son navigateur
   jusqu'au clic sur « Sauvegarder », qui les publie pour tous les visiteurs.
   Sans clés : site-data.js (publié) + brouillon dans le navigateur (export manuel).
   Clés : histoire, members, sorties, years, events, allies, galerie, order, likes
   ========================================================== */

/* Supabase : URL du projet et clé « publishable » (publique). Voir SUPABASE.md */
const SUPABASE_URL = 'https://hnmlvvmnpmiektatkspu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4U9ZfZdpriXK4c7Z2JUXnA_p1aWz3cR';

/* Sécurité : tout texte venant des données (Supabase, brouillon, import) passe par esc() avant d'entrer dans un innerHTML,
   et toute adresse d'image par safeSrc() (refuse javascript:, data:text/html, etc.). Préférer textContent quand c'est possible. */
const esc = s => String(s == null ? '' : s).replace(/[&<>"'`]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[c]));
const safeSrc = u => {
  u = String(u == null ? '' : u).trim();
  if (/^data:image\/(png|jpe?g|webp|gif|svg\+xml)[;,]/i.test(u)) return u;          // images enregistrées par l'administrateur
  if (/^(https:\/\/|\/(?!\/)|\.\/|[\w][\w\-./ %]*$)/i.test(u) && !/^[a-z][a-z0-9+.-]*:(?!\/\/)/i.test(u)) return u;   // https:// ou chemin relatif du site
  return 'img/sorties/vide.jpg';
};

const Store = (() => {
  const KEY = 'galian-site-v1', CACHE = 'galian-remote-v1', PW = 'galian-admin-pw', SESSION = 'galian-admin';
  const REMOTE = !!(SUPABASE_URL && SUPABASE_KEY);
  const published = window.SITE_DATA || {};
  const clone = v => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
  const adminOn = () => { try { return sessionStorage.getItem(SESSION) === '1'; } catch (e) { return false; } };

  /* ---------- en ligne (Supabase) ---------- */
  /* les clés « sb_publishable_… » ne sont pas des JWT : seule l'ancienne clé anon (eyJ…) va aussi dans Authorization */
  const headers = Object.assign({ apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
    SUPABASE_KEY.startsWith('eyJ') ? { Authorization: 'Bearer ' + SUPABASE_KEY } : {});
  const rest = (path, body) => fetch(SUPABASE_URL + '/rest/v1/' + path, body === undefined ? { headers } : { method: 'POST', headers, body: JSON.stringify(body) });
  const rows = list => { const o = {}; list.forEach(r => { o[r.key] = r.value; }); return o; };
  const adminPw = () => { try { return sessionStorage.getItem(PW) || ''; } catch (e) { return ''; } };
  const dropCache = () => { try { localStorage.removeItem(CACHE); } catch (e) {} };
  /* l'administrateur ne garde pas de copie du site : la place du navigateur reste pour son brouillon (il relit le site à chaque page) */
  const saveCache = o => { if (adminOn()) { dropCache(); return true; } try { localStorage.setItem(CACHE, JSON.stringify(o)); return true; } catch (e) { return false; } };
  if (adminOn()) dropCache();

  let remote = {};
  if (REMOTE) {
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(CACHE)); } catch (e) {}
    if (cached) {
      /* contenu connu : affichage immédiat, puis vérification en arrière-plan (la page se recharge si le contenu a changé) */
      remote = cached;
      fetch(SUPABASE_URL + '/rest/v1/site_content?select=key,value', { headers }).then(r => r.json()).then(list => {
        const fresh = rows(list);
        if (JSON.stringify(fresh) !== JSON.stringify(cached) && saveCache(fresh)) location.reload();
      }).catch(() => {});
    } else {
      /* première visite : lecture directe, la page a besoin du contenu pour s'afficher */
      try {
        const x = new XMLHttpRequest();
        x.open('GET', SUPABASE_URL + '/rest/v1/site_content?select=key,value', false);
        Object.entries(headers).forEach(([k, v]) => x.setRequestHeader(k, v));
        x.send();
        if (x.status === 200) { remote = rows(JSON.parse(x.responseText)); saveCache(remote); }
      } catch (e) {}
    }
  }

  /* appel d'une fonction du serveur : true si réussi, sinon message d'erreur affiché et false */
  const call = async (fn, body, what) => {
    try {
      const r = await rest('rpc/' + fn, body);
      if (r.ok) {
        if (r.status !== 204 && (await r.json().catch(() => null)) === false) throw new Error('mot de passe incorrect ou trop de tentatives');   // le serveur répond false sans lever d'erreur (voir SECURITY.sql)
        return true;
      }
      throw new Error((await r.json().catch(() => ({}))).message || r.statusText);
    } catch (e) {
      alert('Enregistrement en ligne impossible (' + what + ') : ' + (e.message || e));
      return false;
    }
  };

  /* ---------- brouillon : modifications de l'administrateur pas encore publiées ---------- */
  let draft = {};
  try { draft = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { draft = {}; }
  const persist = () => {
    try { localStorage.setItem(KEY, JSON.stringify(draft)); return true; }
    catch (e) {}
    dropCache();                                                  // la copie du site gardée pour l'affichage rapide prend aussi de la place : on la libère, elle se recrée toute seule
    try { localStorage.setItem(KEY, JSON.stringify(draft)); return true; }
    catch (e) { alert('Le stockage du navigateur est plein. Exportez vos données puis retirez des images.'); return false; }
  };
  const clearDraft = () => { draft = {}; try { localStorage.removeItem(KEY); } catch (e) {} };
  /* le brouillon n'est visible que de l'administrateur connecté */
  const base = () => (REMOTE ? remote : {});
  const has = (o, k) => k in o;

  return {
    remote: REMOTE,
    get(k, def) {
      if (adminOn() && has(draft, k)) return clone(draft[k]);
      const b = base();
      return has(b, k) ? clone(b[k]) : has(published, k) ? clone(published[k]) : def;
    },
    set(k, v) { draft[k] = clone(v); return persist(); },
    /* tout le contenu actuel, prêt à être exporté */
    all() { return clone(Object.assign({}, published, base(), adminOn() ? draft : {})); },
    hasDraft: () => Object.keys(draft).length > 0,
    replaceDraft(obj) { draft = clone(obj) || {}; return persist(); },
    /* publie le brouillon pour tous les visiteurs ; true si tout est enregistré */
    async save() {
      for (const k of Object.keys(draft)) if (!(await call('save_content', { p_pass: adminPw(), p_key: k, p_value: draft[k] }, k))) return false;
      Object.assign(remote, draft); clearDraft(); dropCache();
      return true;
    },
    discardDraft: clearDraft,
    /* efface tout : le brouillon et, en ligne, le contenu publié */
    async resetAll() {
      if (REMOTE && !(await call('reset_content', { p_pass: adminPw() }, 'réinitialisation'))) return false;
      remote = {}; dropCache(); clearDraft();
      return true;
    },
    /* connexion administrateur : le mot de passe est vérifié par le serveur */
    async checkAdmin(pw) {
      const r = await rest('rpc/check_admin', { p_pass: pw });
      if (!r.ok) throw new Error('Serveur injoignable');
      return (await r.json()) === true;
    },
    async changePassword(ancien, neuf) {
      if (!(await call('change_admin_password', { p_old: ancien, p_new: neuf }, 'mot de passe'))) return false;
      try { sessionStorage.setItem(PW, neuf); } catch (e) {}
      return true;
    },
    setAdminPw(pw) { try { sessionStorage.setItem(PW, pw); } catch (e) {} },
    clearAdminPw() { try { sessionStorage.removeItem(PW); } catch (e) {} },
  };
})();
