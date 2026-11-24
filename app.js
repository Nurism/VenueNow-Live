'use strict';
const events = [
  {id:'iris', name:'Iris Vale', genre:'Indie', day:4, city:'Stockholm', venue:'Debaser', price:295, time:'20.00', description:'Gitarrdriven indie och nära sång på en intim klubbscen.'},
  {id:'echo', name:'Echo System', genre:'Elektroniskt', day:5, city:'Göteborg', venue:'Pustervik', price:345, time:'21.00', description:'Analoga syntar och pulserande bas i ett sammanhängande liveset.'},
  {id:'atlas', name:'Atlas North', genre:'Rock', day:11, city:'Malmö', venue:'Plan B', price:325, time:'19.30', description:'Alternativ rock med stora refränger och dubbla gitarrer.'},
  {id:'nocturne', name:'Nocturne After Hours', genre:'Elektroniskt', day:12, city:'Stockholm', venue:'Fållan', price:395, time:'21.00', description:'En kväll med djupa basgångar, svepande ljus och ett liveset byggt för dansgolvet.'}
];
const $ = selector => document.querySelector(selector);
const findEvent = id => events.find(event => event.id === id);
const dialog = $('#booking-dialog');
const panel = $('#panel');
const key = 'venueNowBookings.v1';
let state = {cart:{}, orders:[]};
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved && saved.cart && Array.isArray(saved.orders)) state = saved;
} catch {}
let genre = 'Alla';
const quantities = cart => events.map(e => [e,cart[e.id]]).filter(([,n])=>Number.isInteger(n) && n>0 && n<=8);
function countCart(){ $('#count').textContent=quantities(state.cart).reduce((sum,[,n])=>sum+n,0); }
function save(next){
  try { localStorage.setItem(key,JSON.stringify(next)); }
  catch { alert('Webbläsaren kunde inte spara bokningen. Tillåt lokal lagring och försök igen.'); return false; }
  state=next;
  countCart();
  return true;
}
function render(){
  const query=$('#query').value.trim().toLocaleLowerCase('sv');
  const visible=events.filter(e=>(genre==='Alla'||e.genre===genre) && [e.name,e.city,e.venue].join(' ').toLocaleLowerCase('sv').includes(query));
  const grid = $('#grid');
  grid.replaceChildren(...visible.map(event => {
    const details = {...event, image: event.id + '.webp', date: '2026-12-' + String(event.day).padStart(2,'0')};
    return VenueArtistCard.build(details, {
      headingLevel: 'h3',
      label: 'Boka demobiljetter',
      note: 'Demobiljett · ' + event.price + ' kr',
      eventId: event.id
    });
  }));
  if (!visible.length) grid.innerHTML='<p>Inga konserter matchar din sökning. <button class="remove" id="reset">Rensa filter</button></p>';
  document.querySelectorAll('#filters .chip').forEach(b=>b.setAttribute('aria-pressed',String(b.textContent===genre)));
}
$('#filters').innerHTML=['Alla','Indie','Elektroniskt','Rock'].map(g=>`<button class="chip">${g}</button>`).join('');
$('#query').oninput=render;
function show(title,body){panel.innerHTML=`<h2 id="heading">${title}</h2>${body}`; if(!dialog.open)dialog.showModal();dialog.scrollTop=0;}
function options(max,current=1){return Array.from({length:max},(_,i)=>`<option ${i+1===current?'selected':''}>${i+1}</option>`).join('');}
function detail(e){
  const remaining=8-(state.cart[e.id]||0);
  show(e.name,`<p class="kicker">${e.genre.toUpperCase()} / LIVE</p><p>${e.day} december 2026 kl. ${e.time}<br>${e.venue}, ${e.city}</p><p class="muted">${e.description}</p><div class="row"><strong>Ståplats</strong><b>${e.price} kr</b></div>${remaining?`<label class="qty">Antal biljetter <select id="quantity">${options(remaining)}</select></label><button class="cta" data-add="${e.id}">Lägg i kundvagn</button>`:'<p>Du har redan 8 biljetter till den här konserten i kundvagnen.</p><button class="cta" data-cart>Visa kundvagn</button>'}`);
}
function cart(){
  const items=quantities(state.cart);
  if(!items.length){show('Din kundvagn','<p>Din kundvagn är tom.</p><button class="cta" data-browse>Utforska konserter</button>');return;}
  const rows=items.map(([e,n])=>`<div class="row"><div><b>${e.name}</b><br><label>Antal <select data-qty="${e.id}">${options(8,n)}</select></label> <button class="remove" data-remove="${e.id}">Ta bort</button></div><b>${n*e.price} kr</b></div>`).join('');
  const total=items.reduce((s,[e,n])=>s+e.price*n,0);
  show('Din kundvagn',rows+`<p class="row"><b>Totalt</b><strong>${total} kr</strong></p><p class="muted">Det här är en demobokning. Ingen betalning tas ut. Biljetterna sparas i den här webbläsaren.</p><button class="cta" id="book">Bekräfta demobokning</button>`);
}
function tickets(fresh=false){
  const rows=state.orders.flatMap(o=>quantities(o.items).map(([e,n])=>`<div class="row"><div><span class="kicker">DEMOBILJETT</span><br><b>${e.name}</b><br>${e.day} december · ${e.venue}<br>${n} st · ${n*e.price} kr</div></div>`)).join('');
  show(fresh?'Din bokning är klar':'Mina biljetter',rows||'<p>Här visas dina biljetter när du gjort en demobokning.</p><button class="cta" data-browse>Utforska konserter</button>');
}
function updateQuantity(id,n){
  const cartItems={...state.cart};
  if(n)cartItems[id]=n; else delete cartItems[id];
  if(save({...state,cart:cartItems}))cart();
}
document.addEventListener('change',ev=>{if(ev.target.dataset.qty)updateQuantity(ev.target.dataset.qty,Number(ev.target.value));});
document.addEventListener('click',ev=>{
  const b=ev.target.closest('button');
  if(!b)return;
  if(b.closest('#artist-dialog'))return;
  if(b.className==='close')dialog.close();
  else if(b.matches('[data-browse]')){dialog.close();$('#program').scrollIntoView();}
  else if(b.matches('#filters .chip')){genre=b.textContent;render();}
  else if(b.id==='reset'){genre='Alla';$('#query').value='';render();}
  else if(b.dataset.open)detail(findEvent(b.dataset.open));
  else if(b.dataset.add)updateQuantity(b.dataset.add,(state.cart[b.dataset.add]||0)+Number($('#quantity').value));
  else if(b.dataset.remove)updateQuantity(b.dataset.remove,0);
  else if(b.id==='basket'||b.matches('[data-cart]'))cart();
  else if(b.id==='tickets')tickets();
  else if(b.id==='book' && quantities(state.cart).length && save({cart:{},orders:[{items:state.cart},...state.orders]}))tickets(true);
});
render();countCart();
