const box = document.getElementById('art-gallery'), hint = document.getElementById('art-hint');

function render() {
  const liste = galerieListe();
  box.innerHTML = '';
  liste.forEach(({ g, i }) => {
    const fig = makeArtItem(g);
    fig.dataset.i = i;                                  // position d'origine dans la liste enregistrée
    if (Admin.on) {
      fig.querySelector('img').draggable = false;
      fig.append(makeHandle()); holdDrag(fig, box, '.art-item', 'x', save, HANDLE);                  // appui prolongé sur l'œuvre, puis glisser
      const bar = Admin.el('div', 'adm-card-bar'), btn = (t, title, fn, cls) => { const b = Admin.el('button', 'adm-mini ' + (cls || ''), t); b.type = 'button'; b.title = title; b.onclick = e => { e.preventDefault(); e.stopPropagation(); fn(); }; return b; };
      bar.append(btn('✎', 'Modifier', () => galerieForm(Store.get('galerie', GALERIE_DEFAULT), i, render)),
        btn('✕', 'Supprimer', () => {
          Admin.confirm('Supprimer cette œuvre ?', () => { const l = Store.get('galerie', GALERIE_DEFAULT); l.splice(i, 1); Store.set('galerie', l); render(); });
        }, 'danger'));
      fig.append(bar);
    }
    box.append(fig);
  });
  if (Admin.on) {
    const add = Admin.el('button', 'adm-add tile', '＋ Ajouter une œuvre'); add.type = 'button';
    add.onclick = () => galerieForm(Store.get('galerie', GALERIE_DEFAULT), null, render);
    box.prepend(add);
  }
  hint.hidden = !Admin.on;
  document.getElementById('art-count').innerHTML = `<span>ᛈ ${liste.length} image${liste.length > 1 ? 's' : ''}</span>`;
}

/* l'ordre affiché (plus récente d'abord) est l'inverse de l'ordre enregistré */
function save() {
  const list = Store.get('galerie', GALERIE_DEFAULT);
  const ordre = [...box.querySelectorAll(".art-item")].map(f => +f.dataset.i).reverse().map(i => list[i]);
  if (Store.set('galerie', ordre)) render();
}

Admin.onChange = render;
render();
