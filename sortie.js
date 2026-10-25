/* Page de détail d'une sortie : sortie.html?id=... (données dans data.js) */
(() => {
  const id = new URLSearchParams(location.search).get('id');
  const idx = SORTIES.findIndex(s => s.id === id);
  const main = document.getElementById('sortie');
  const s = SORTIES[idx];

  if (!s) {
    main.innerHTML = '<h1>Sortie introuvable</h1><p class="sub">Cette saga n’existe pas (encore).</p>';
    return;
  }
  const backYear = document.getElementById('back-year');

  const img = (src, alt) => { const i = new Image(); i.alt = alt; i.loading = 'lazy'; i.src = safeSrc(src); i.addEventListener('error', () => { i.onerror = null; i.src = PHOTO_FALLBACK; }, { once: true }); return i; };

  /* en-tête : titre, date, lieu */
  function renderEntete() {
    document.title = `${s.title} – Galian MCP`;
    const an = s.date.slice(0, 4);
    backYear.href = `annee.html?y=${an}`; backYear.textContent = `Retour aux sorties ${an}`;
    main.querySelector('.s-date').textContent = fmtDate(s.date);
    main.querySelector('h1').textContent = s.title;
    main.querySelector('.s-meta').innerHTML = s.place ? `<span class="s-place">${esc(s.place)}</span>` : '';
  }
  renderEntete();

  /* mode administrateur : crayon pour modifier les informations de la sortie */
  if (Admin.on) {
    const edit = document.createElement('button');
    edit.type = 'button'; edit.className = 'adm-btn adm-info-edit'; edit.textContent = '✎ Modifier les informations';
    edit.addEventListener('click', () => Admin.form('Modifier la sortie', [
      { name: 'title', label: 'Titre', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'place', label: 'Lieu' },
    ], { title: s.title, date: s.date, place: s.place }, v => {
      if (!v.title.trim() || !v.date) return false;
      const avant = { title: s.title, date: s.date, place: s.place };
      Object.assign(s, { title: v.title.trim(), date: v.date, place: v.place || '' });
      if (!Store.set('sorties', SORTIES)) { Object.assign(s, avant); return false; }
      renderEntete();
    }));
    main.querySelector('.s-meta').after(edit);
  }

  /* image principale : la première photo ; les suivantes forment un carrousel qui boucle */
  const [premiere, ...autres] = s.images;
  const principale = main.querySelector('.s-main');
  principale.appendChild(img(premiere, `${s.title} – photo principale`));
  principale.addEventListener('click', () => { if (!Admin.on) openBox([s.images[0]], 0); });

  /* mode administrateur : changer l'image principale (la première photo de la sortie) */
  if (Admin.on) {
    const VIDE = 'img/sorties/vide.jpg';
    const changer = document.createElement('button');
    changer.type = 'button'; changer.className = 'adm-mini adm-main-pencil'; changer.textContent = '✎';
    changer.title = 'Changer l’image principale'; changer.setAttribute('aria-label', 'Changer l’image principale');
    changer.addEventListener('click', e => {
      e.stopPropagation();
      Admin.form('Image principale', [
        { name: 'img', label: 'Nouvelle image principale', type: 'image', mode: 'photo' },
      ], { img: s.images[0] === VIDE ? '' : s.images[0] }, v => {
        s.images[0] = v.img || VIDE;                     // image retirée : retour à l'image vide
        if (!Store.set('sorties', SORTIES)) return false;
        const im = principale.querySelector('img'); im.onerror = null; im.src = safeSrc(s.images[0]);
      });
    });
    principale.append(changer);                          // crayon posé sur l'image elle-même
    Admin.dropFiles(principale, async files => {         // photo glissée sur l'image principale : elle la remplace
      try {
        s.images[0] = await Admin.processImage(files[0], 'photo');
        if (!Store.set('sorties', SORTIES)) return;
        const im = principale.querySelector('img'); im.onerror = null; im.src = safeSrc(s.images[0]);
      } catch (e) { alert(e.message); }
    });
  }

  /* mode administrateur : pas de carrousel, les photos secondaires sont empilées par ligne de trois et se déplacent à la poignée */
  let selection = false;                                       // mode « sélection » : cocher plusieurs photos puis les supprimer d'un coup
  const choix = new Set();                                     // indices (dans la grille) des photos cochées
  addEventListener('keydown', e => {                           // Échap quitte le mode sélection (sans fenêtre ouverte)
    if (e.key === 'Escape' && selection && !document.querySelector('.adm-modal')) { selection = false; choix.clear(); adminGrid(); }
  });
  function adminGrid() {
    const car2 = document.getElementById('carousel');
    car2.hidden = false; car2.innerHTML = '';
    car2.classList.toggle('car-select', selection);
    const grid = document.createElement('div'); grid.className = 'car-grid'; car2.append(grid);

    const bar = document.createElement('div'); bar.className = 'adm-selbar'; car2.prepend(bar);
    const mkBtn = (t, fn, cls = '') => { const b = document.createElement('button'); b.type = 'button'; b.className = 'adm-btn ' + cls; b.textContent = t; b.addEventListener('click', fn); bar.append(b); return b; };
    const total = s.images.length - 1;
    if (!selection) {
      if (total > 0) mkBtn('☑ Sélectionner', () => { selection = true; choix.clear(); adminGrid(); });
    } else {
      const del = mkBtn('', () => {
        if (!choix.size) return;
        Admin.confirm(`Supprimer ${choix.size} photo${choix.size > 1 ? 's' : ''} ?`, () => {
          const avant = s.images.slice();
          s.images = [s.images[0], ...s.images.slice(1).filter((_, i) => !choix.has(i))];
          if (!Store.set('sorties', SORTIES)) { s.images = avant; return; }
          selection = false; choix.clear(); adminGrid();
        });
      }, 'primary danger');
      const maj = () => {
        del.textContent = choix.size ? `Supprimer (${choix.size})` : 'Supprimer';
        del.disabled = !choix.size; all.textContent = choix.size === total ? 'Tout désélectionner' : 'Tout sélectionner';
        grid.querySelectorAll('.adm-img').forEach(f => f.classList.toggle('sel', choix.has(+f.dataset.i)));
      };
      const all = mkBtn('', () => { if (choix.size === total) choix.clear(); else for (let i = 0; i < total; i++) choix.add(i); maj(); });
      mkBtn('Annuler', () => { selection = false; choix.clear(); adminGrid(); });
      grid.addEventListener('click', e => {
        const fig = e.target.closest('.adm-img'); if (!fig) return;
        const i = +fig.dataset.i; if (choix.has(i)) choix.delete(i); else choix.add(i);
        maj();
      });
      queueMicrotask(maj);                                     // après la création des vignettes
    }

    s.images.slice(1).forEach((src, i) => {
      const fig = document.createElement('figure'); fig.className = 'adm-img'; fig.dataset.i = i;
      fig.appendChild(img(src, `${s.title} – photo ${i + 2}`));
      fig.querySelector('img').draggable = false;
      const x = document.createElement('button'); x.type = 'button'; x.className = 'adm-mini danger adm-x'; x.textContent = '✕'; x.title = 'Supprimer cette photo';
      x.addEventListener('click', () => Admin.confirm('Supprimer cette photo ?', () => { s.images.splice(i + 1, 1); Store.set('sorties', SORTIES); adminGrid(); }));
      fig.append(makeHandle(), x);
      grid.append(fig);
      holdDrag(fig, grid, '.adm-img', 'x', () => {
        const ordre = [...grid.querySelectorAll('.adm-img')].map(f => s.images[+f.dataset.i + 1]);
        s.images.splice(1, s.images.length - 1, ...ordre); Store.set('sorties', SORTIES); adminGrid();
      }, HANDLE);
    });
    const add = document.createElement('button'); add.type = 'button'; add.className = 'adm-add adm-img-add'; add.textContent = '＋ Ajouter une photo';
    /* sélection de plusieurs photos d'un coup : elles rejoignent directement le carrousel */
    const pick = document.createElement('input'); pick.type = 'file'; pick.accept = 'image/*'; pick.multiple = true; pick.hidden = true;
    add.addEventListener('click', () => pick.click());
    const ajouter = async files => {
      if (!files.length) return;
      add.disabled = true; add.textContent = 'Ajout en cours…';
      const ajoutees = [];
      for (const f of files) {
        try { ajoutees.push(await Admin.processImage(f, 'photo')); } catch (e) { alert(`${f.name} : ${e.message}`); }
      }
      if (ajoutees.length) {
        s.images.push(...ajoutees);
        if (!Store.set('sorties', SORTIES)) s.images.splice(s.images.length - ajoutees.length, ajoutees.length);
      }
      adminGrid();
    };
    pick.addEventListener('change', () => { const files = [...pick.files]; pick.value = ''; ajouter(files); });
    car2.ajouterPhotos = ajouter;                              // cible du glisser-déposer (branché une seule fois, plus bas)
    grid.append(pick);
    grid.append(add);
  }

  const car = document.getElementById('carousel');
  if (Admin.on) {
    adminGrid();
    Admin.dropFiles(car, files => car.ajouterPhotos(files));   // photos glissées sur la zone du carrousel
  } else if (autres.length) {
    car.hidden = false;
    car.innerHTML = '<div class="car-view"><div class="car-track"></div></div><button type="button" class="car-btn prev" aria-label="Image précédente">‹</button><button type="button" class="car-btn next" aria-label="Image suivante">›</button>';
    const track = car.querySelector('.car-track'), prev = car.querySelector('.prev'), next = car.querySelector('.next');
    autres.forEach((src, i) => {
      const fig = document.createElement('figure');
      fig.appendChild(img(src, `${s.title} – photo ${i + 2}`));
      fig.addEventListener('click', () => openBox(autres, i));
      track.appendChild(fig);
    });

    /* plusieurs petites images visibles à la fois (--n dans le CSS) ; les flèches font défiler en boucle */
    const visibles = () => parseInt(getComputedStyle(car).getPropertyValue('--n'), 10) || 3;
    const gap = () => parseFloat(getComputedStyle(track).columnGap) || 0;
    const majFleches = () => { const besoin = autres.length > visibles(); prev.hidden = next.hidden = !besoin; car.classList.toggle('car-nav', besoin); };
    majFleches(); addEventListener('resize', majFleches);

    let busy = false;
    const pas = () => track.firstElementChild.getBoundingClientRect().width + gap();
    /* boucle sans fin : après la dernière photo revient la première, avant la première vient la dernière.
       Un minuteur remplace « transitionend » (qui se déclenchait aussi pour les images, ou jamais si les animations sont coupées). */
    const DUREE = 450;
    const go = dir => {
      if (busy || autres.length <= visibles()) return;
      busy = true;
      if (dir > 0) {                                            // suivante : on glisse, puis la première passe à la fin
        track.style.transition = `transform ${DUREE}ms ease`; track.style.transform = `translateX(${-pas()}px)`;
        setTimeout(() => {
          track.style.transition = 'none'; track.append(track.firstElementChild); track.style.transform = 'none';
          track.getBoundingClientRect(); busy = false;
        }, DUREE + 30);
      } else {                                                  // précédente : la dernière passe au début, puis on glisse
        track.style.transition = 'none'; track.prepend(track.lastElementChild); track.style.transform = `translateX(${-pas()}px)`;
        track.getBoundingClientRect();
        track.style.transition = `transform ${DUREE}ms ease`; track.style.transform = 'none';
        setTimeout(() => { track.style.transition = 'none'; busy = false; }, DUREE + 30);
      }
    };
    prev.addEventListener('click', () => { go(-1); prev.blur(); });
    next.addEventListener('click', () => { go(1); next.blur(); });
    addEventListener('keydown', e => {
      if (document.getElementById('lightbox').classList.contains('open')) return;
      if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'ArrowRight') go(1);
    });
    let x0 = null;                                              // glisser du doigt
    car.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    car.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); x0 = null; });
  }


  /* texte de la sortie : en mode administrateur, paragraphes modifiables, déplaçables, et Entrée crée un nouveau paragraphe */
  const text = main.querySelector('.s-text');
  const saveText = () => Store.set('sorties', SORTIES);
  let focusIdx = null;
  function renderText() {
    text.innerHTML = '';
    if (!Admin.on) {
      s.text.filter(p => p.trim()).forEach((p, i) => { const el = document.createElement('p'); if (i === 0) { const drop = document.createElement('span'); drop.className = 'drop'; drop.textContent = p[0]; el.append(drop, p.slice(1)); } else el.textContent = p; text.appendChild(el); });
      return;
    }
    const mk = Admin.el, fi = focusIdx; focusIdx = null; let focusNode = null;
    s.text.forEach((txt, i) => {
      const wrap = mk('div', 'adm-para'), p = mk('p'); let cutting = false;
      wrap.dataset.i = i; p.textContent = txt;
      p.contentEditable = 'true'; p.spellcheck = false; p.classList.add('editable'); p.dataset.ph = 'Nouveau paragraphe…';
      p.addEventListener('blur', () => { if (!cutting) { s.text[i] = p.textContent.trim(); saveText(); } });
      const cut = parts => { cutting = true; s.text.splice(i, 1, ...parts); saveText(); focusIdx = i + parts.length - 1; renderText(); };
      const caret = () => {
        const sel = getSelection(); if (!sel.rangeCount) return p.textContent.length;
        const r = sel.getRangeAt(0).cloneRange(); r.selectNodeContents(p); r.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
        return r.toString().length;
      };
      p.addEventListener('keydown', e => {                      // Entrée : nouveau paragraphe
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const t = p.textContent, o = caret(); cut([t.slice(0, o).trim(), t.slice(o).trim()]);
      });
      p.addEventListener('paste', e => {                        // texte collé sur plusieurs lignes : un paragraphe par ligne
        e.preventDefault();
        const txt2 = (e.clipboardData || window.clipboardData).getData('text/plain');
        if (!/\n/.test(txt2)) { document.execCommand('insertText', false, txt2); return; }
        const t = p.textContent, o = caret(); cut((t.slice(0, o) + txt2 + t.slice(o)).split(/\r?\n+/).map(x => x.trim()));
      });
      const btn = (t, title, fn, cls = '') => { const b = mk('button', 'adm-mini ' + cls, t); b.type = 'button'; b.title = title; b.addEventListener('click', e => { e.preventDefault(); fn(); }); return b; };
      const del = btn('✕', 'Supprimer ce paragraphe', () => Admin.confirm('Supprimer ce paragraphe ?', () => { s.text.splice(i, 1); saveText(); renderText(); }), 'danger');
      wrap.append(p, del, makeHandle()); text.append(wrap);
      holdDrag(wrap, text, '.adm-para', 'y', () => {            // appui sur la poignée, puis glisser
        const ordre = [...text.querySelectorAll('.adm-para')].map(w => s.text[+w.dataset.i]);
        s.text.splice(0, s.text.length, ...ordre); saveText(); renderText();
      }, HANDLE);
      if (fi === i) focusNode = p;
    });
    const add = mk('button', 'adm-add', '＋ Ajouter un paragraphe'); add.type = 'button';
    add.addEventListener('click', () => { s.text.push(''); saveText(); focusIdx = s.text.length - 1; renderText(); });
    text.append(add);
    if (focusNode) setTimeout(() => {
      focusNode.focus();
      const r = document.createRange(); r.selectNodeContents(focusNode); r.collapse(true); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    }, 0);
  }
  renderText();


  /* visionneuse : on la ferme avec la croix (ou Échap) ; depuis le carrousel, les flèches font défiler les photos en boucle */
  const box = document.getElementById('lightbox'), boxImg = box.querySelector('img');
  const lbPrev = box.querySelector('.prev'), lbNext = box.querySelector('.next');
  let lbList = [], lbIdx = 0;
  function lbShow(n) {
    lbIdx = (n + lbList.length) % lbList.length;
    boxImg.onerror = () => { boxImg.onerror = null; boxImg.src = PHOTO_FALLBACK; };
    boxImg.src = safeSrc(lbList[lbIdx]); boxImg.alt = `${s.title} – photo`;
    lbPrev.hidden = lbNext.hidden = lbList.length < 2;
    box.querySelector('.lb-count').textContent = lbList.length > 1 ? `${lbIdx + 1} / ${lbList.length}` : '';
  }
  function openBox(list, i) { lbList = list; lbShow(i); box.classList.add('open'); box.setAttribute('aria-hidden', 'false'); }
  const closeBox = () => { box.classList.remove('open'); box.setAttribute('aria-hidden', 'true'); };
  box.querySelector('.lb-close').addEventListener('click', closeBox);
  /* un clic en dehors de la photo (fond noir, marges) ferme la visionneuse */
  box.addEventListener('click', e => {
    if (e.target.closest('.lb-close, .lb-btn, .lb-count')) return;
    if (e.target === boxImg) {                                  // l'image occupe un cadre : on ne compte que la photo elle-même
      const r = boxImg.getBoundingClientRect(), k = Math.min(r.width / boxImg.naturalWidth, r.height / boxImg.naturalHeight);
      const w = boxImg.naturalWidth * k, h = boxImg.naturalHeight * k;
      const x = e.clientX - r.left - (r.width - w) / 2, y = e.clientY - r.top - (r.height - h) / 2;
      if (x >= 0 && x <= w && y >= 0 && y <= h) return;
    }
    closeBox();
  });
  lbPrev.addEventListener('click', () => lbShow(lbIdx - 1));
  lbNext.addEventListener('click', () => lbShow(lbIdx + 1));
  addEventListener('keydown', e => {
    if (!box.classList.contains('open')) return;
    if (e.key === 'Escape') closeBox();
    else if (e.key === 'ArrowLeft' && lbList.length > 1) lbShow(lbIdx - 1);
    else if (e.key === 'ArrowRight' && lbList.length > 1) lbShow(lbIdx + 1);
  });
})();
