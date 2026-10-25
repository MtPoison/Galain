/* Page d'une année : annee.html?y=2026 – toutes les sorties de l'année (données dans data.js) */
(() => {
  const parAnnee = sortiesParAnnee();
  const annees = Object.keys(parAnnee).sort((a, b) => b - a);
  const an = new URLSearchParams(location.search).get('y') || annees[0];
  const liste = parAnnee[an];
  const main = document.getElementById('annee');

  main.querySelector('.year-title').textContent = an;
  document.title = `Sorties ${an} – Galian MCP`;

  if (!liste) {
    main.querySelector('.s-meta').textContent = 'Aucune sortie cette année-là.';
  } else {
    const km = liste.reduce((t, s) => t + parseInt(s.km, 10), 0);
    main.querySelector('.s-meta').innerHTML = `<span>ᚱ ${liste.length} sortie${liste.length > 1 ? 's' : ''}</span><span>ᛗ ${km} km parcourus</span>`;
    /* un bloc par mois : le nom du mois, puis les sorties en dessous */
    const conteneur = main.querySelector('.months');
    const parMois = {};
    liste.forEach(s => (parMois[s.date.slice(5, 7)] = parMois[s.date.slice(5, 7)] || []).push(s));
    Object.keys(parMois).sort((a, b) => b - a).forEach(m => {
      const bloc = document.createElement('section');
      bloc.className = 'month';
      bloc.innerHTML = `<h2 class="month-title">${MOIS[m - 1]}</h2><div class="cards"></div>`;
      parMois[m].forEach(s => bloc.querySelector('.cards').appendChild(makeSortieCard(s)));
      conteneur.appendChild(bloc);
    });
  }

  /* liens vers les autres années */
  main.querySelector('.year-links').innerHTML = annees
    .map(a => `<a href="annee.html?y=${encodeURIComponent(a)}" class="${a === an ? 'current' : ''}">${esc(a)}</a>`).join('');
})();
