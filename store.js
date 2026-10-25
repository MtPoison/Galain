/* ==========================================================
   GALIAN MCP – stockage des données modifiables
   Avec Supabase (clés ci-dessous) : le contenu est stocké en ligne, les
   modifications de l'administrateur sont publiées immédiatement.
   Sans clés : site-data.js (publié) + brouillon dans le navigateur (export manuel).
   Clés : histoire, members, sorties, years, events, allies, galerie, order, likes
   ========================================================== */

/* Supabase : URL du projet et clé « publishable » (publique). Voir SUPABASE.md */
const SUPABASE_URL = 'https://hnmlvvmnpmiektatkspu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4U9ZfZdpriXK4c7Z2JUXnA_p1aWz3cR';

const Store = (() => {
  const KEY = 'galian-site-v1', CACHE = 'galian-remote-v1', PW = 'galian-admin-pw';
  const REMOTE = !!(SUPABASE_URL && SUPABASE_KEY);
  const published = window.SITE_DATA || {};
  const clone = v => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

  /* ---------- en ligne (Supabase) ---------- */
  /* les clés « sb_publishable_… » ne sont pas des JWT : seule l'ancienne clé anon (eyJ…) va aussi dans Authorization */
  const headers = Object.assign({ apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
    SUPABASE_KEY.startsWith('eyJ') ? { Authorization: 'Bearer ' + SUPABASE_KEY } : {});
  const rest = (path, body) => fetch(SUPABASE_URL + '/rest/v1/' + path, body === undefined ? { headers } : { method: 'POST', headers, body: JSON.stringify(body) });
  const rows = list => { const o = {}; list.forEach(r => { o[r.key] = r.value; }); return o; };
  const adminPw = () => { try { return sessionStorage.getItem(PW) || ''; } catch (e) { return ''; } };
  const saveCache = o => { try { localStorage.setItem(CACHE, JSON.stringify(o)); return true; } catch (e) { return false; } };
  const dropCache = () => { try { localStorage.removeItem(CACHE); } catch (e) {} };

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

  /* écritures envoyées une par une, dans l'ordre */
  let queue = Promise.resolve();
  const send = (fn, body, what) => {
    queue = queue.then(() => rest('rpc/' + fn, body)).then(r => r.ok ? null : r.text().then(t => { throw new Error(t); }))
      .catch(e => alert('Enregistrement en ligne impossible (' + what + ') : ' + (e.message || e) + '\nVérifiez la connexion et le mot de passe administrateur.'));
  };
  const push = (k, v) => send('save_content', { p_pass: adminPw(), p_key: k, p_value: v }, k);

  /* ---------- sans Supabase : brouillon dans le navigateur ---------- */
  let draft = {};
  try { draft = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { draft = {}; }
  const persist = () => {
    try { localStorage.setItem(KEY, JSON.stringify(draft)); return true; }
    catch (e) { alert('Le stockage du navigateur est plein. Exportez vos données puis retirez des images.'); return false; }
  };

  return {
    remote: REMOTE,
    get: (k, def) => REMOTE
      ? (k in remote ? clone(remote[k]) : k in published ? clone(published[k]) : def)
      : (k in draft ? clone(draft[k]) : k in published ? clone(published[k]) : def),
    set(k, v) {
      if (!REMOTE) { draft[k] = clone(v); return persist(); }
      remote[k] = clone(v); dropCache(); push(k, remote[k]); return true;
    },
    /* tout le contenu actuel, prêt à être exporté */
    all() { return clone(Object.assign({}, published, REMOTE ? remote : draft)); },
    hasDraft: () => REMOTE ? false : Object.keys(draft).length > 0,
    replaceDraft(obj) {
      if (!REMOTE) { draft = clone(obj) || {}; return persist(); }
      remote = clone(obj) || {}; dropCache();
      send('reset_content', { p_pass: adminPw() }, 'import');
      Object.entries(remote).forEach(([k, v]) => push(k, v));
      queue.then(() => location.reload());
      return false;                                              // le rechargement est fait une fois tout envoyé
    },
    resetDraft() {
      if (!REMOTE) { draft = {}; try { localStorage.removeItem(KEY); } catch (e) {} return; }
      remote = {}; dropCache(); send('reset_content', { p_pass: adminPw() }, 'réinitialisation');
    },
    /* connexion administrateur : le mot de passe est vérifié par le serveur */
    async checkAdmin(pw) {
      const r = await rest('rpc/check_admin', { p_pass: pw });
      if (!r.ok) throw new Error('Serveur injoignable');
      return (await r.json()) === true;
    },
    setAdminPw(pw) { try { sessionStorage.setItem(PW, pw); } catch (e) {} },
    clearAdminPw() { try { sessionStorage.removeItem(PW); } catch (e) {} },
    whenSaved: () => queue,
  };
})();
