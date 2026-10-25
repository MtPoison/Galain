/* ==========================================================
   GALIAN MCP – stockage des données modifiables
   - site-data.js : contenu « publié » (ce que voient tous les visiteurs)
   - navigateur   : brouillon de l'administrateur (visible seulement par lui)
   Clés : histoire, members, sorties, years, events, allies, galerie, order
   ========================================================== */
const Store = (() => {
  const KEY = 'galian-site-v1';
  const published = window.SITE_DATA || {};
  let draft = {};
  try { draft = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { draft = {}; }

  const clone = v => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
  const persist = () => {
    try { localStorage.setItem(KEY, JSON.stringify(draft)); return true; }
    catch (e) { alert('Le stockage du navigateur est plein. Exportez vos données puis retirez des images.'); return false; }
  };

  return {
    get: (k, def) => (k in draft ? clone(draft[k]) : k in published ? clone(published[k]) : def),
    set(k, v) { draft[k] = clone(v); return persist(); },
    /* tout le contenu actuel (publié + brouillon), prêt à être exporté */
    all() { return clone(Object.assign({}, published, draft)); },
    hasDraft: () => Object.keys(draft).length > 0,
    replaceDraft(obj) { draft = clone(obj) || {}; return persist(); },
    resetDraft() { draft = {}; try { localStorage.removeItem(KEY); } catch (e) {} },
  };
})();
