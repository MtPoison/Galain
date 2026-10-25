/* ================================================
   GALIAN MCP – galerie art (partagé par index.html et galerie.html)
   Les images ajoutées en dernier sont à la fin de la liste ; on les affiche en premier.
   ================================================ */
const GALERIE_H = 240;                                   // hauteur visée d'une rangée (px)
const GALERIE_APERCU = 4;                                // nombre d'images sur la page d'accueil
/* images d'exemple de formats variés (remplacées via le mode administrateur) */
const galleryPlaceholder = (w, h, label) => 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#101010"/><path d="M0 ${h * .8}l${w * .2}-${h * .25} ${w * .15} ${h * .12} ${w * .25}-${h * .3} ${w * .25} ${h * .35} ${w * .15}-${h * .1}V${h}H0z" fill="#1c1c1c"/><text x="${w / 2}" y="${h * .45}" text-anchor="middle" font-size="${Math.min(w, h) / 9}" fill="#6a6a6a" font-family="serif">ᛟ ${label} ᛟ</text></svg>`);
const GALERIE_DEFAULT = [
  { img: 'img/galerie/carre.webp', text: 'Image carrée : Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
  { img: 'img/galerie/portrait.webp', text: 'Image portrait : Ut enim ad minim veniam, quis nostrud exercitation.' },
  { img: galleryPlaceholder(600, 400, 'RECTANGLE'), text: 'Image rectangle : Duis aute irure dolor in reprehenderit in voluptate.' },
  { img: galleryPlaceholder(400, 400, 'CARRÉ'), text: 'Excepteur sint occaecat cupidatat non proident.' },
  { img: galleryPlaceholder(300, 450, 'PORTRAIT'), text: 'Sed ut perspiciatis unde omnis iste natus error.' },
  { img: galleryPlaceholder(600, 400, 'RECTANGLE'), text: 'Nemo enim ipsam voluptatem quia voluptas sit.' },
];

/* liste (plus récente d'abord) avec l'index d'origine, pour modifier / supprimer */
const galerieListe = () => Store.get('galerie', GALERIE_DEFAULT).map((g, i) => ({ g, i })).reverse();

/* figure d'une image : garde son format (largeur proportionnelle à son ratio) */
function makeArtItem(g) {
  const fig = document.createElement('figure'), img = document.createElement('img');
  fig.className = 'art-item';
  img.loading = 'lazy'; img.alt = g.text || 'Galerie art';
  const setRatio = () => {
    const r = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
    (fig.parentElement && fig.parentElement.classList.contains('art-wrap') ? fig.parentElement : fig).style.flex = `0 1 ${Math.round(r * GALERIE_H)}px`;
  };
  fig.style.flex = `0 1 ${GALERIE_H}px`;
  img.addEventListener('load', setRatio);
  img.addEventListener('error', () => { img.onerror = null; img.src = PHOTO_FALLBACK; setRatio(); }, { once: true });
  img.src = safeSrc(g.img);
  fig.append(img);
  return fig;
}

/* défilement automatique pendant un glisser-déposer : près du haut ou du bas de l'écran, la page défile doucement */
const AutoScroll = (() => {
  const EDGE = 110, MAX = 20;                                // zone sensible (px) et vitesse maximale (px par image)
  let y = null, raf = 0;
  const onOver = e => { y = e.clientY; };                    // dragover (glisser natif) ou pointermove (appui prolongé)
  const tick = () => {
    if (y != null) {
      const h = innerHeight; let v = 0;
      if (y < EDGE) v = -MAX * (EDGE - y) / EDGE; else if (y > h - EDGE) v = MAX * (y - (h - EDGE)) / EDGE;
      if (v) scrollBy({ top: v, behavior: 'instant' });
    }
    raf = requestAnimationFrame(tick);
  };
  return {
    start() { y = null; document.addEventListener('dragover', onOver); document.addEventListener('pointermove', onOver); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); },
    stop() { document.removeEventListener('dragover', onOver); document.removeEventListener('pointermove', onOver); cancelAnimationFrame(raf); y = null; },
  };
})();

/* ajout / modification d'une œuvre (mode administrateur) ; `done` redessine la galerie */
function galerieForm(list, i, done) {
  const g = i == null ? {} : list[i];
  Admin.form(i == null ? 'Ajouter une œuvre' : 'Modifier l’œuvre', [
    { name: 'img', label: 'Image (carrée, portrait ou rectangle : son format est conservé)', type: 'image', mode: 'photo' },
  ], { img: g.img || '' }, v => {
    if (!v.img) return false;
    const n = { img: v.img, text: g.text || '' };
    if (i == null) list.push(n); else list[i] = n;
    if (Store.set('galerie', list)) done(); else return false;
  });
}

/* ---------- glisser-déposer par appui prolongé (souris ou doigt) ----------
   On maintient l'appui ~0,35 s sur l'élément sans bouger : il se « décroche » et on le fait glisser
   parmi ses voisins (`sel`, enfants directs de `box`). `opts.grip` : sélecteur de la zone qui déclenche
   (par défaut, tout l'élément). `onEnd` est appelé au relâchement. */
function holdDrag(item, box, sel, axis, onEnd, opts = {}) {
  if (item._hold) return; item._hold = true;
  const HOLD = 350, MOVE = 8;
  let timer = null, active = false, sx = 0, sy = 0, pid = null;
  const block = e => e.preventDefault();
  const cancel = () => { clearTimeout(timer); timer = null; };
  const move = e => {
    const el = document.elementFromPoint(e.clientX, e.clientY), t = el && el.closest(sel);
    if (!t || t === item || t.parentElement !== box) return;
    const r = t.getBoundingClientRect();
    const avant = axis === 'x' ? e.clientX < r.left + r.width / 2 : e.clientY < r.top + r.height / 2;
    box.insertBefore(item, avant ? t : t.nextSibling);
  };
  const end = () => {
    document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', end);
    document.removeEventListener('pointercancel', end); document.removeEventListener('touchmove', block);
    item.classList.remove('dragging-item'); document.body.classList.remove('is-dragging');
    AutoScroll.stop(); active = false;
    onEnd();
  };
  const start = () => {
    timer = null; active = true;
    item.classList.add('dragging-item'); document.body.classList.add('is-dragging');
    try { item.setPointerCapture(pid); } catch (e) {}
    if (navigator.vibrate) navigator.vibrate(15);
    getSelection().removeAllRanges(); AutoScroll.start();
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', end);
    document.addEventListener('pointercancel', end); document.addEventListener('touchmove', block, { passive: false });
  };
  item.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const gripEl = opts.grip && item.querySelector(opts.grip);   // la poignée de CET élément (pas celle d'un élément imbriqué)
    if (opts.grip ? e.target.closest(opts.grip) !== gripEl : e.target.closest('button, a, input, select')) return;   // avec une poignée : seule elle déclenche
    sx = e.clientX; sy = e.clientY; pid = e.pointerId;
    cancel(); timer = setTimeout(start, opts.hold ?? HOLD);
  });
  item.addEventListener('pointermove', e => { if (timer && Math.hypot(e.clientX - sx, e.clientY - sy) > MOVE) cancel(); });
  item.addEventListener('pointerup', cancel);
  item.addEventListener('pointercancel', () => { if (!active) cancel(); });
  item.addEventListener('contextmenu', e => { if (timer || active) e.preventDefault(); });   // pas de menu pendant l'appui prolongé
  item.addEventListener('dragstart', e => { if (timer || active) e.preventDefault(); });      // pas de glisser natif d'image
}

/* poignée de déplacement (grand bouton, pratique au doigt) : à utiliser avec holdDrag(..., { grip: '.adm-handle', hold: 60 }) */
function makeHandle() {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'adm-mini adm-handle'; b.textContent = '⠿';
  b.title = 'Appuyer et glisser pour déplacer'; b.setAttribute('aria-label', 'Déplacer');
  return b;
}
const HANDLE = { grip: '.adm-handle', hold: 60 };
