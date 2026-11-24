(() => {
  const section = document.getElementById('luger');
  const search = document.getElementById('luger-search');
  const grid = document.getElementById('luger-grid');
  const status = document.getElementById('luger-status');
  const pagination = section.querySelector('.luger-pagination');
  const pageLabel = document.getElementById('luger-page');
  const previous = document.getElementById('luger-prev');
  const next = document.getElementById('luger-next');
  const pageSize = 18;
  let page = 1;
  let artists = [];
  const normalize = text => text.toLocaleLowerCase('sv').normalize('NFD').replace(/\p{Diacritic}/gu,'');

  function render() {
    const q = normalize(search.value.trim());
    const visible = artists.filter(artist => normalize(artist.name).includes(q));
    const pageCount = Math.ceil(visible.length / pageSize);
    const start = (page - 1) * pageSize;
    grid.replaceChildren(...visible.slice(start,start + pageSize).map(artist => {
      const copy = {...artist, description: artist.description || 'Luger listar artisten i sin bokningsagentur.'};
      return VenueArtistCard.build(copy,{
        headingLevel:'h3',
        link:artist.url,
        label:'Artistprofil hos Luger'
      });
    }));
    status.textContent = visible.length ? visible.length + ' av ' + artists.length + ' artister' : 'Inga artister matchar sökningen.';
    pagination.hidden = pageCount < 2;
    previous.disabled = page <= 1;
    next.disabled = page >= pageCount;
    pageLabel.textContent = 'Sida ' + page + ' av ' + pageCount;
  }

  function changePage(direction) {
    page += direction;
    render();
    status.scrollIntoView({block:'start'});
  }

  fetch('./luger-roster.json')
    .then(response => {
      if (!response.ok) throw Error();
      return response.json();
    })
    .then(data => {
      artists = data.artists.sort((a,b)=>a.name.localeCompare(b.name,'sv'));
      search.addEventListener('input', () => { page = 1; render(); });
      previous.onclick = () => changePage(-1);
      next.onclick = () => changePage(1);
      render();
    })
    .catch(() => {
      status.textContent = 'Artistregistret kunde inte hämtas. Du kan öppna hela registret hos Luger.';
    });
})();
