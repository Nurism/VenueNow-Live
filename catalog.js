(() => {
  const host = 'https://venuenow-live-nur.retrokiwi18.chatgpt.site';
  const grid = document.getElementById('artist-grid');
  const search = document.getElementById('artist-search');
  let artists = [], version;

  function card(artist) {
    const url = new URL(artist.url);
    const source = url.hostname === 'luger.se' ? 'Luger' : url.hostname === 'billetto.se' ? 'Billetto' : 'arrangören';
    return VenueArtistCard.build(artist, {
      imageBase: host,
      link: url.href,
      label: 'Biljetter hos ' + source
    });
  }

  function render() {
    const q = search.value.trim().toLocaleLowerCase('sv');
    const visible = artists.filter(a => [a.name,a.city,a.venue,a.genre].join(' ').toLocaleLowerCase('sv').includes(q));
    grid.replaceChildren(...visible.map(card));
    if (!visible.length) grid.append(VenueArtistCard.element('p','Inga konserter matchar din sökning.'));
  }

  async function refresh() {
    const paths = location.origin === host ? ['/api/artists'] : [host + '/api/artists','./artists.json'];
    for (const path of paths) {
      try {
        const response = await fetch(path);
        if (!response.ok) continue;
        const items = await response.json();
        artists = items.sort((a,b)=>a.date.localeCompare(b.date));
        version = response.headers.get('ETag');
        render();
        return true;
      } catch {}
    }
    grid.textContent = 'Konserterna kunde inte hämtas. Ladda om sidan för att försöka igen.';
    return false;
  }

  search.addEventListener('input',render);
  refresh();

  async function account() {
    if (location.origin !== host) return;
    const response = await fetch('/api/session');
    if (!response.ok) return;
    const session = await response.json();
    if (!session.user) return;
    const link = document.getElementById('account');
    link.textContent = 'Logga ut';
    link.href = '/signout-with-chatgpt?return_to=%2F';
    if (!session.admin) return;
    const open = document.getElementById('manage');
    const dialog = document.getElementById('artist-dialog');
    const select = document.getElementById('select-artist');
    const form = document.getElementById('edit-artist');
    const submit = form.querySelector('button');
    const status = document.getElementById('artist-status');

    function fill() {
      const selected = artists.find(a=>a.id===select.value) || {city:'Stockholm'};
      for (const field of form.querySelectorAll('[name]')) field.value = selected[field.name] || '';
    }
    function populate(id = '') {
      select.replaceChildren(new Option('Ny artist',''), ...artists.map(a=>new Option(a.name,a.id)));
      select.value = id;
      fill();
    }
    select.onchange = () => { status.textContent = ''; fill(); };
    open.hidden = false;
    open.onclick = async () => {
      status.textContent = '';
      submit.disabled = true;
      dialog.showModal();
      if (await refresh()) { populate(); submit.disabled = false; }
      else status.textContent = 'Katalogen gick inte att hämta. Försök igen.';
    };
    form.onsubmit = async event => {
      event.preventDefault();
      submit.disabled = true;
      status.textContent = '';
      try {
        const result = await fetch('/api/artists',{
          method:'POST',
          headers:{'Content-Type':'application/json','If-Match':version},
          body:JSON.stringify({...Object.fromEntries(new FormData(form)),id:select.value})
        });
        if (!result.ok) {
          status.textContent = result.status === 409 ? 'Katalogen har ändrats. Öppna panelen igen innan du sparar.' : 'Det gick inte att spara. Kontrollera dina uppgifter och din inloggning.';
          return;
        }
        const item = await result.json();
        if (await refresh()) populate(item.id);
        status.textContent = 'Ändringen har sparats.';
      } catch {
        status.textContent = 'Anslutningen bröts. Öppna panelen igen och kontrollera om ändringen sparades.';
      } finally {
        submit.disabled = false;
      }
    };
  }
  account().catch(()=>{});
})();
