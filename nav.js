/* Menu hamburger (mobile) : la barre n'affiche que la première ligne de rubriques ; le bouton ☰ déroule tout le menu. */
(() => {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'nav-toggle'; b.setAttribute('aria-label', 'Menu'); b.setAttribute('aria-expanded', 'false');
  b.innerHTML = '<span></span><span></span><span></span>';
  nav.append(b);
  const set = ouvert => { nav.classList.toggle('open', ouvert); b.setAttribute('aria-expanded', String(ouvert)); };
  b.addEventListener('click', () => set(!nav.classList.contains('open')));
  nav.addEventListener('click', e => { if (e.target.closest('a')) set(false); });          // choisir une rubrique referme le menu
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  document.addEventListener('click', e => { if (!nav.contains(e.target)) set(false); });   // un clic ailleurs referme le menu
})();
