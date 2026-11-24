const noCache = {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const catalogKey = 'artists.json';
const sourceOrigin = 'https://nurism.github.io';

function json(body, status = 200, headers = {}) {
  return Response.json(body, {status, headers: {...noCache, ...headers}});
}

function httpsUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
  return url.href;
}

function validate(input) {
  const artist = {};
  const fields = {name:120, genre:60, description:2400, venue:120, city:100, date:10, image:800, url:800};
  for (const [key, limit] of Object.entries(fields)) {
    const value = input[key];
    if (typeof value !== 'string' || !value.trim() || value.length > limit) throw new Error();
    artist[key] = value.trim();
  }
  if (!/^\d{4}-\d\d-\d\d$/.test(artist.date) || new Date(artist.date).toISOString().slice(0,10) !== artist.date) throw new Error();
  artist.url = httpsUrl(artist.url);
  if (!/^[\w-]+\.(webp|jpe?g|png)$/.test(artist.image) || !Object.hasOwn(assets, artist.image)) artist.image = httpsUrl(artist.image);
  return artist;
}

async function catalogue(request, env, admin, url) {
  if (request.method === 'GET') {
    const stored = await env.BUCKET.get(catalogKey);
    return json(stored ? await stored.json() : seeds, 200, {
      ETag: stored?.httpEtag ?? '"initial"',
      'Access-Control-Allow-Origin': sourceOrigin
    });
  }
  if (request.method !== 'POST') return json({}, 405, {Allow:'GET, POST'});
  if (!admin || request.headers.get('Origin') !== url.origin) return json({}, 403);
  if (request.headers.get('Content-Type')?.split(';')[0] !== 'application/json') return json({}, 415);
  const text = await request.text();
  if (text.length > 9000) return json({}, 413);
  let input, artist;
  try {
    input = JSON.parse(text);
    artist = validate(input);
    if (input.id !== undefined && typeof input.id !== 'string') throw new Error();
  } catch {
    return json({}, 400);
  }
  const stored = await env.BUCKET.get(catalogKey);
  if (request.headers.get('If-Match') !== (stored?.httpEtag ?? '"initial"')) return json({},409);
  const items = stored ? await stored.json() : [...seeds];
  const index = items.findIndex(item => item.id === input.id);
  if (input.id && index < 0) return json({},404);
  artist.id = input.id || crypto.randomUUID();
  if (index < 0) {
    items.push(artist);
  } else {
    const old = items[index];
    if (artist.image === old.image && old.credit) {
      artist.credit = old.credit;
      artist.creditUrl = old.creditUrl;
    }
    items[index] = artist;
  }
  const saved = await env.BUCKET.put(catalogKey, JSON.stringify(items), {
    onlyIf: stored ? {etagMatches:stored.etag} : {etagDoesNotMatch:'*'}
  });
  return saved ? json(artist) : json({},409);
}

export default {async fetch(request, env) {
  const url = new URL(request.url);
  const email = request.headers.get('oai-authenticated-user-email');
  const user = Boolean(email && request.headers.get('oai-authenticated-user-id'));
  const admin = Boolean(user && env.ADMIN_EMAIL && email.toLowerCase() === env.ADMIN_EMAIL.trim().toLowerCase());
  if (url.pathname === '/api/session' && request.method === 'GET') return json({user, admin});
  if (url.pathname === '/api/artists') return catalogue(request, env, admin, url);
  if (!['GET','HEAD'].includes(request.method)) return new Response(null,{status:405});
  const path = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  if (!Object.hasOwn(assets,path)) return new Response('Sidan saknas', {status:404});
  const [type, data] = assets[path];
  return new Response(request.method === 'HEAD' ? null : Uint8Array.from(atob(data), c=>c.charCodeAt(0)), {
    headers: {...noCache, 'Content-Type':type}
  });
}};
