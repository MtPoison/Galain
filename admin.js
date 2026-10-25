/* ==========================================================
   GALIAN MCP – mode administrateur
   ATTENTION : ce mot de passe est vérifié dans le navigateur, il
   n'empêche pas un développeur de lire le code. Il sert à éviter
   les fausses manipulations. Les modifications sont enregistrées
   dans CE navigateur ; pour les publier, utilisez « Exporter ».
   ========================================================== */
const Admin = (() => {
  const SESSION = 'galian-admin', PASS = 'galian-admin-pass';
  const api = { on: sessionStorage.getItem(SESSION) === '1', onChange: () => {} };
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const getPass = () => localStorage.getItem(PASS) || 'galian';
  api.el = el;

  /* ---------- portrait : même traitement que les portraits du site ----------
     1. le fond uni (blanc, gris…) est détecté et remplacé par du noir
     2. le dessin est centré, à la même taille pour tous (grande dimension = 65 % de la largeur)
     3. un dessin sombre reçoit un fin contour blanc pour rester visible sur le noir
     Une vraie photo (fond non uni) est seulement centrée sur le cadre noir. */
  function portraitCanvas(img) {
    const CW = 600, CH = 800, TARGET = CW * 0.65;
    const out = document.createElement('canvas'); out.width = CW; out.height = CH;
    const o = out.getContext('2d'); o.fillStyle = '#000'; o.fillRect(0, 0, CW, CH);
    o.imageSmoothingQuality = 'high';

    const k = Math.min(1, 900 / Math.max(img.width, img.height));
    const W = Math.max(1, Math.round(img.width * k)), H = Math.max(1, Math.round(img.height * k));
    const src = document.createElement('canvas'); src.width = W; src.height = H;
    const sg = src.getContext('2d', { willReadFrequently: true }); sg.drawImage(img, 0, 0, W, H);
    const d = sg.getImageData(0, 0, W, H), px = d.data;

    const fit = () => {                                // pas de fond uni : image entière, centrée
      const s = Math.min(CW * 0.82 / W, CH * 0.82 / H);
      o.drawImage(img, (CW - W * s) / 2, (CH - H * s) / 2, W * s, H * s); return out;
    };
    /* couleur du fond = moyenne du pourtour, et vérification qu'il est uni */
    /* le fond est échantillonné un peu à l'intérieur (les photos ont souvent un liseré sur le bord) */
    const inset = Math.max(3, Math.round(Math.min(W, H) * 0.03)), edge = [];
    for (let x = inset; x < W - inset; x++) edge.push(inset * W + x, (H - 1 - inset) * W + x);
    for (let y = inset; y < H - inset; y++) edge.push(y * W + inset, y * W + W - 1 - inset);
    const med = c => { const v = edge.map(p => px[p * 4 + c]).sort((a, b) => a - b); return v[v.length >> 1]; };
    const mr = med(0), mg = med(1), mb = med(2);
    let far = 0; edge.forEach(p => { if (Math.hypot(px[p * 4] - mr, px[p * 4 + 1] - mg, px[p * 4 + 2] - mb) > 45) far++; });
    if (far / edge.length > 0.2) return fit();        // le pourtour n'est pas uni : c'est une photo

    const TOL = 42, dist = p => Math.hypot(px[p * 4] - mr, px[p * 4 + 1] - mg, px[p * 4 + 2] - mb);
    const bg = new Uint8Array(W * H), stack = [];
    const push = p => { if (!bg[p] && dist(p) < TOL) { bg[p] = 1; stack.push(p); } };
    edge.forEach(push);
    while (stack.length) {
      const p = stack.pop(), x = p % W, y = (p / W) | 0;
      if (x > 0) push(p - 1); if (x < W - 1) push(p + 1); if (y > 0) push(p - W); if (y < H - 1) push(p + W);
    }
    /* bords de la photo (traits parasites) puis frange claire le long du contour */
    const m = Math.max(2, Math.round(Math.min(W, H) * 0.012));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < m || y < m || x >= W - m || y >= H - m) bg[y * W + x] = 1;
    for (let pass = 0; pass < 2; pass++) {
      const add = [];
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        const p = y * W + x;
        if (!bg[p] && dist(p) < TOL * 1.6 && (bg[p - 1] || bg[p + 1] || bg[p - W] || bg[p + W])) add.push(p);
      }
      add.forEach(p => { bg[p] = 1; });
    }
    /* dessin détouré (alpha) + boîte englobante + luminosité moyenne */
    let x0 = W, y0 = H, x1 = 0, y1 = 0, lum = 0, cnt = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const p = y * W + x;
      if (bg[p]) { px[p * 4 + 3] = 0; continue; }
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      lum += 0.3 * px[p * 4] + 0.59 * px[p * 4 + 1] + 0.11 * px[p * 4 + 2]; cnt++;
    }
    if (cnt < 50) return fit();
    sg.putImageData(d, 0, 0);
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, s = TARGET / Math.max(bw, bh);
    const dw = bw * s, dh = bh * s, dx = (CW - dw) / 2, dy = (CH - dh) / 2;

    if (lum / cnt < 90) {                              // dessin sombre : contour blanc tout autour
      const w = document.createElement('canvas'); w.width = W; w.height = H;
      const wg = w.getContext('2d'); wg.drawImage(src, 0, 0);
      wg.globalCompositeOperation = 'source-in'; wg.fillStyle = '#f5f5f5'; wg.fillRect(0, 0, W, H);
      [1.5, 3, 4.5].forEach(r => { for (let a = 0; a < 24; a++) {
        const t = a * Math.PI / 12;
        o.drawImage(w, x0, y0, bw, bh, dx + Math.cos(t) * r, dy + Math.sin(t) * r, dw, dh);
      } });
    }
    o.drawImage(src, x0, y0, bw, bh, dx, dy, dw, dh);
    return out;
  }

  /* ---------- images : réduites et compressées avant d'être stockées ---------- */
  api.processImage = (file, mode) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height, c = document.createElement('canvas'), g;
      if (mode === 'portrait') {                       // détourage + fond noir + taille unifiée (voir portraitCanvas)
        c = portraitCanvas(img);
      } else if (mode === 'bike') {                    // 16:10, recadrée
        c.width = 800; c.height = 500; g = c.getContext('2d');
        const s = Math.max(800 / w, 500 / h);
        g.drawImage(img, (800 - w * s) / 2, (500 - h * s) / 2, w * s, h * s);
      } else {                                         // photo ou logo : réduite
        const max = mode === 'logo' ? 260 : 1000, s = Math.min(1, max / Math.max(w, h));
        c.width = Math.round(w * s); c.height = Math.round(h * s); g = c.getContext('2d');
        g.drawImage(img, 0, 0, c.width, c.height);
      }
      URL.revokeObjectURL(url);
      resolve(mode === 'logo' ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image illisible')); };
    img.src = url;
  });

  /* ---------- fenêtre modale ---------- */
  function modal(title, content) {
    const back = el('div', 'adm-modal'), box = el('div', 'adm-box');
    box.append(el('h3', '', title), content);
    back.append(box); document.body.append(back);
    const close = () => back.remove();
    return { box, close };
  }
  api.modal = modal;

  /* fenêtre de confirmation stylisée (remplace le pop-up du navigateur) : `onOk` n'est appelé que si on confirme */
  api.confirm = (message, onOk, label = 'Supprimer') => {
    const box = el('div', 'adm-confirm'), txt = el('p', 'adm-confirm-text'), bar = el('div', 'adm-actions');
    box.append(el('span', 'adm-confirm-rune runes', 'ᛉ'), txt); txt.textContent = message;
    const no = el('button', 'adm-btn', 'Annuler'), ok = el('button', 'adm-btn primary danger', label);
    no.type = ok.type = 'button'; bar.append(no, ok); box.append(bar);
    const m = modal('Êtes-vous sûr ?', box); m.box.classList.add('adm-box-confirm');
    no.onclick = m.close; ok.onclick = () => { m.close(); onOk(); };
    no.focus();                                                  // par défaut, Entrée annule : plus prudent
  };

  /* ---------- formulaire générique ---------- */
  api.form = (title, fields, values, onSubmit) => {
    const f = el('form', 'adm-form'), vals = Object.assign({}, values);
    fields.forEach(fd => {
      const row = el('div', 'adm-row'); row.append(el('span', 'adm-label', fd.label));
      if (fd.type === 'textarea') {
        const t = el('textarea'); t.rows = fd.rows || 6; t.value = vals[fd.name] || '';
        t.oninput = () => { vals[fd.name] = t.value; }; row.append(t);
      } else if (fd.type === 'select') {
        const s = el('select');
        fd.options.forEach(o => { const op = el('option', '', o); op.value = o; s.append(op); });
        s.value = vals[fd.name] || fd.options[0]; vals[fd.name] = s.value;
        s.onchange = () => { vals[fd.name] = s.value; }; row.append(s);
      } else if (fd.type === 'image') {
        const prev = el('img', 'adm-prev'); prev.alt = ''; if (vals[fd.name]) prev.src = vals[fd.name]; else prev.hidden = true;
        const inp = el('input'); inp.type = 'file'; inp.accept = 'image/*';
        inp.onchange = async () => {
          if (!inp.files[0]) return;
          try { vals[fd.name] = await api.processImage(inp.files[0], fd.mode); prev.src = vals[fd.name]; prev.hidden = false; }
          catch (e) { alert(e.message); }
        };
        row.append(prev, inp);
      } else if (fd.type === 'images') {
        vals[fd.name] = (vals[fd.name] || []).slice();
        const list = el('div', 'adm-thumbs'), inp = el('input');
        inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true;
        const draw = () => {
          list.innerHTML = '';
          vals[fd.name].forEach((src, i) => {
            const t = el('div', 'adm-thumb'), im = el('img'), x = el('button', 'adm-x', '✕');
            im.src = src; im.onerror = () => { im.onerror = null; im.src = PHOTO_FALLBACK; };
            x.type = 'button'; x.title = 'Retirer cette image'; x.onclick = () => { vals[fd.name].splice(i, 1); draw(); };
            t.append(im, x); list.append(t);
          });
        };
        inp.onchange = async () => {
          for (const file of inp.files) {
            try { vals[fd.name].push(await api.processImage(file, fd.mode || 'photo')); } catch (e) { alert(e.message); }
          }
          inp.value = ''; draw();
        };
        draw(); row.append(list, inp);
      } else {
        const i = el('input'); i.type = fd.type || 'text'; i.value = vals[fd.name] ?? '';
        if (fd.required) i.required = true; if (fd.placeholder) i.placeholder = fd.placeholder;
        if (fd.lower) i.style.textTransform = 'lowercase';
        i.oninput = () => { vals[fd.name] = fd.lower ? i.value.toLowerCase() : i.value; }; row.append(i);
      }
      if (fd.hint) row.append(el('small', 'adm-hint', fd.hint));
      f.append(row);
    });
    const bar = el('div', 'adm-actions'), ok = el('button', 'adm-btn primary', 'Enregistrer'), no = el('button', 'adm-btn', 'Annuler');
    ok.type = 'submit'; no.type = 'button'; bar.append(no, ok); f.append(bar);
    const m = modal(title, f);
    no.onclick = m.close;
    f.onsubmit = e => { e.preventDefault(); if (onSubmit(vals) !== false) m.close(); };
    const first = f.querySelector('input:not([type=file]), textarea'); if (first) first.focus();
  };

  /* ---------- connexion ---------- */
  api.login = () => {
    const f = el('form', 'adm-form'), i = el('input'), msg = el('small', 'adm-hint', '');
    i.type = 'password'; i.placeholder = 'Mot de passe'; i.autocomplete = 'current-password';
    const bar = el('div', 'adm-actions'), ok = el('button', 'adm-btn primary', 'Entrer'), no = el('button', 'adm-btn', 'Annuler');
    ok.type = 'submit'; no.type = 'button'; bar.append(no, ok);
    f.append(i, msg, bar);
    const m = modal('Mode administrateur', f);
    no.onclick = m.close; i.focus();
    const entrer = () => { sessionStorage.setItem(SESSION, '1'); api.on = true; m.close(); mount(); api.onChange(); };
    f.onsubmit = async e => {
      e.preventDefault();
      if (!Store.remote) {                                         // sans serveur : mot de passe local
        if (i.value !== getPass()) { msg.textContent = 'Mot de passe incorrect.'; i.select(); return; }
        return entrer();
      }
      msg.textContent = 'Vérification…';
      try {
        if (!(await Store.checkAdmin(i.value))) { msg.textContent = 'Mot de passe incorrect.'; i.select(); return; }
      } catch (err) { msg.textContent = 'Connexion au serveur impossible.'; return; }
      Store.setAdminPw(i.value); entrer();                          // le mot de passe sert à signer chaque enregistrement
    };
  };
  api.logout = () => { sessionStorage.removeItem(SESSION); Store.clearAdminPw(); api.on = false; mount(); api.onChange(); };

  /* ---------- export / import ---------- */
  function exporter() {
    const txt = '/* Contenu publié – généré par le mode administrateur */\nwindow.SITE_DATA = ' + JSON.stringify(Store.all()) + ';\n';
    const a = el('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/javascript' })); a.download = 'site-data.js';
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function importer() {
    const inp = el('input'); inp.type = 'file'; inp.accept = '.js,.json';
    inp.onchange = async () => {
      if (!inp.files[0]) return;
      try {
        const t = await inp.files[0].text(), obj = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1));
        if (Store.replaceDraft(obj)) location.reload();
      } catch (e) { alert('Fichier invalide.'); }
    };
    inp.click();
  }

  /* ---------- barre d'outils et lien d'entrée ---------- */
  function mount() {
    document.body.classList.toggle('admin-on', api.on);
    let bar = document.getElementById('adm-bar'), link = document.getElementById('adm-link');
    if (bar) bar.remove();
    if (!link) {
      link = el('a', 'adm-link', 'ᛟ Administration'); link.id = 'adm-link'; link.href = '#';
      link.onclick = e => { e.preventDefault(); api.login(); };
      (document.querySelector('.footer') || document.body).append(link);
    }
    link.hidden = api.on;
    if (!api.on) return;
    bar = el('div', 'adm-bar'); bar.id = 'adm-bar';
    bar.innerHTML = '<strong><span class="runes">ᛟ</span> Mode administrateur</strong>';
    const btn = (t, fn, cls) => { const b = el('button', 'adm-btn ' + (cls || ''), t); b.type = 'button'; b.onclick = fn; bar.append(b); };
    if (Store.remote) bar.append(el('span', 'adm-hint', 'Vos modifications sont publiées automatiquement'));
    btn(Store.remote ? 'Exporter (sauvegarde)' : 'Exporter pour publier', exporter, Store.remote ? '' : 'primary');
    btn('Importer', importer);
    if (!Store.remote) btn('Mot de passe', () => { const p = prompt('Nouveau mot de passe :'); if (p) { localStorage.setItem(PASS, p); alert('Mot de passe modifié.'); } });
    btn('Tout réinitialiser', () => api.confirm(Store.remote ? 'Effacer TOUT le contenu modifié en ligne et revenir au contenu d’origine du site ?' : 'Effacer toutes vos modifications et revenir au contenu publié ?',
      () => { Store.resetDraft(); Store.whenSaved().then(api.onChange); }, 'Réinitialiser'));
    btn('Quitter', api.logout);
    document.body.append(bar);
  }
  /* touche Échap : ferme la fenêtre ouverte, sinon quitte le mode administrateur */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const m = document.querySelector('.adm-modal');
    if (m) { m.remove(); return; }
    const a = document.activeElement;
    if (a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) { a.blur(); return; }   // d'abord sortir du champ
    if (api.on) api.logout();
  });
  document.addEventListener('DOMContentLoaded', mount);
  if (document.readyState !== 'loading') mount();

  return api;
})();
