'use strict';

const VenueArtistCard = (() => {
  const dateFormat = new Intl.DateTimeFormat('sv-SE',{
    day:'numeric', month:'long', year:'numeric', timeZone:'UTC'
  });

  function element(tag, value, cls) {
    const node = document.createElement(tag);
    if (value) node.textContent = value;
    if (cls) node.className = cls;
    return node;
  }

  function build(artist, options) {
    const card = element('article', '', 'artist-card');
    const image = element('img');
    image.alt = artist.image ? artist.name : '';
    image.loading = 'lazy';
    image.onerror = () => { image.onerror = null; image.src = './nocturne.webp'; image.alt = ''; };
    image.src = artist.image ? new URL(artist.image, options.imageBase || document.baseURI).href : './nocturne.webp';
    const copy = element('div','','artist-copy');
    if (artist.genre) copy.append(element('p',artist.genre,'genre'));
    copy.append(element(options.headingLevel || 'h2',artist.name));
    if (artist.date) {
      const time = element('time',dateFormat.format(new Date(artist.date + 'T12:00:00Z')));
      time.dateTime = artist.date;
      copy.append(time,element('p',[artist.venue,artist.city].filter(Boolean).join(' · '),'muted'));
    }
    if (artist.description) copy.append(element('p',artist.description,'description'));
    if (artist.credit && artist.creditUrl) {
      const credit = element('a','Bild: ' + artist.credit);
      credit.href = artist.creditUrl;
      const byline = element('small');
      byline.append(credit);
      copy.append(byline);
    }
    if (options.note) copy.append(element('p',options.note,'artist-note'));
    const action = element(options.eventId ? 'button' : 'a',options.label,'ticket');
    if (options.eventId) {
      action.type = 'button';
      action.dataset.open = options.eventId;
    } else {
      const link = new URL(options.link);
      if (link.protocol === 'https:') action.href = link.href;
    }
    action.setAttribute('aria-label',options.label + ' – ' + artist.name);
    copy.append(action);
    card.append(image,copy);
    return card;
  }
  return {build,element};
})();
