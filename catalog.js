(() => {
  const host = 'https://venuenow-live-nur.retrokiwi18.chatgpt.site';
  const grid = document.getElementById('artist-grid');
  const search = document.getElementById('artist-search');
  const dateFormat = new Intl.DateTimeFormat('sv-SE',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
  let artists = [], version;

  function element(tag, value, cls) {
    const el = document.createElement(tag);
    el.textContent = value || '';
    if (cls) el.className = cls;
    return el;
  }

  function card(artist) {
    const article = element('article', '', 'artist-card');
    const img = document.createElement('img');
    img.alt = artist.name;
    img.loading = 'lazy';
    img.onerror = () => { img.onerror = null; img.src = './nocturne.webp'; img.alt = ''; };
    img.src = new URL(artist.image, host).href;
    const content = element('div', '', 'artist-copy');
    const time = element('time', dateFormat.format(new Date(artist.date + 'T12:00:00Z')));
    time.dateTime = artist.date;
    content.append(element('p',artist.genre,'genre'),element('h2',artist.name),time,
      element('p',artist.venue + ' · ' + artist.city,'muted'),element('p',artist.description,'description'));
    if (artist.credit) {
      const credit = element('a', 'Bild: ' + artist.credit);
      credit.href = artist.creditUrl;
      const label = document.createElement('small');
      label.append(credit);
      content.append(label);
    }
    const url = new URL(artist.url);
    if (url.protocol === 'https:') {
      const source = url.hostname === 'luger.se' ? 'Luger' : url.hostname === 'billetto.se' ? 'Billetto' : 'arrangören';
      const link = element('a','Biljetter hos ' + source,'ticket');
      link.href = url.href;
      content.append(link);
    }
    article.append(img,content);
    return article;
  }

  function render() {
    const q = search.value.trim().toLocaleLowerCase('sv');
    const visible = artists.filter(a => [a.name,a.city,a.venue,a.genre].join(' ').toLocaleLowerCase('sv').includes(q));
    grid.replaceChildren(...visible.map(card));
    if (!visible.length) grid.append(element('p','Inga konserter matchar din sökning.'));
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
