// ============================================================
// PUBLIC SITE — used only by index.html
// (hero slider, packages/promo rendering, join modal, chatbox, mobile nav)
// ============================================================
import { DEFAULT_PACKAGES } from './config.js';
import { currentLang, formatPrice, showToast, openModal, closeModal } from './utils.js';
import { dbGetPackages } from './db-packages.js';
import { dbGetPromos } from './db-promos.js';

let heroIndex = 0;

// HERO SLIDER
// ============================================================
function initHero(){
  const slides=document.querySelectorAll('.hero-slide');
  const ind=document.getElementById('heroIndicators');
  if(!ind) return;
  slides.forEach((_,i)=>{
    const d=document.createElement('div');
    d.className='hero-dot'+(i===0?' active':'');
    d.onclick=()=>goHero(i);
    ind.appendChild(d);
  });
  setInterval(()=>goHero((heroIndex+1)%slides.length),5000);
  initHeroTilt();
}
function initHeroTilt(){
  const heroEl=document.getElementById('hero');
  const tilt=document.getElementById('heroTilt');
  const glow=document.getElementById('heroGlow');
  if(!heroEl||!tilt) return;
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced) return;
  const MAX_TILT = 7; // degrees
  let rafId = null, targetRX = 0, targetRY = 0, curRX = 0, curRY = 0;
  function animate(){
    curRX += (targetRX - curRX) * 0.08;
    curRY += (targetRY - curRY) * 0.08;
    tilt.style.transform = `rotateX(${curRX}deg) rotateY(${curRY}deg) scale3d(1.02,1.02,1.02)`;
    rafId = requestAnimationFrame(animate);
  }
  heroEl.addEventListener('mousemove', (e)=>{
    const rect = heroEl.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;   // 0..1
    const py = (e.clientY - rect.top) / rect.height;   // 0..1
    targetRY = (px - 0.5) * MAX_TILT * 2;   // left/right look
    targetRX = -(py - 0.5) * MAX_TILT * 2;  // up/down look
    if(glow){ glow.style.setProperty('--mx', (px*100)+'%'); glow.style.setProperty('--my', (py*100)+'%'); }
    if(!rafId) animate();
  });
  heroEl.addEventListener('mouseleave', ()=>{
    targetRX = 0; targetRY = 0;
  });
}
window.initHeroTilt=initHeroTilt;
function goHero(i){
  const sl=document.querySelectorAll('.hero-slide'),dt=document.querySelectorAll('.hero-dot');
  sl[heroIndex].classList.remove('active'); dt[heroIndex].classList.remove('active');
  heroIndex=i; sl[i].classList.add('active'); dt[i].classList.add('active');
}
window.initHero=initHero; window.goHero=goHero;

// ============================================================

// PACKAGES RENDER
// ============================================================
async function renderPackages(){
  const pkgs=await dbGetPackages();
  window._pkgCache=pkgs;
  const grid=document.getElementById('pkgGrid');
  if(grid) grid.innerHTML=pkgs.map(p=>`
    <div class="pkg-card${p.featured?' featured':''}">
      ${p.featured?'<div class="pkg-badge">Most Popular</div>':''}
      <div class="pkg-name">${currentLang==='id'?(p.nameId||p.name):p.name}</div>
      <div class="pkg-price">${formatPrice(p.price)}</div>
      <div class="pkg-unit">IDR</div>
      ${p.promo?`<div class="pkg-promo">✨ ${p.promo}</div>`:''}
      <button class="btn btn-${p.featured?'primary':'outline'} pkg-btn" onclick="openJoin('${p.id}')">
        ${currentLang==='id'?'Daftar':'Join Now'}
      </button>
    </div>`).join('');
  const sel=document.getElementById('newPkg');
  if(sel) sel.innerHTML='<option value="">-- Select Package --</option>'+
    pkgs.map(p=>`<option value="${p.id}" data-days="${p.days}" data-price="${p.price}">${p.name} – IDR ${formatPrice(p.price)}</option>`).join('');
}
window.renderPackages=renderPackages;

// ============================================================
// PROMO RENDER
// ============================================================
async function renderPromos(){
  const promos=await dbGetPromos();
  const grid=document.getElementById('promoGrid');
  if(!grid) return;
  if(!promos.length){ grid.innerHTML='<div class="promo-empty"><p>No active promotions at the moment. Check back soon!</p></div>'; return; }
  grid.innerHTML=promos.map((pr,i)=>`
    <div class="promo-card" onclick="openPromoPopup(${i})">
      ${pr.img?`<img class="promo-img" src="${pr.img}" alt="${pr.title}" onerror="this.style.display='none'">`:''}
      <div class="promo-body">
        ${pr.tag?`<div class="promo-tag">${pr.tag}</div>`:''}
        <div class="promo-title">${pr.title}</div>
        <div class="promo-desc">${pr.desc||''}</div>
      </div>
    </div>`).join('');
  window._promoData = promos;
}

function openPromoPopup(idx){
  const pr = (window._promoData||[])[idx];
  if(!pr) return;

  const modal    = document.getElementById('promoPopupModal');
  const imgWrap  = document.getElementById('promoPopupImgWrap');
  const img      = document.getElementById('promoPopupImg');
  const caption  = document.getElementById('promoPopupCaption');
  const tagEl    = document.getElementById('promoPopupTag');
  const titleEl  = document.getElementById('promoPopupTitle');
  const descEl   = document.getElementById('promoPopupDesc');
  const waBtn    = document.getElementById('promoPopupWABtn');

  // --- Poster image (full 4:5, no crop) ---
  if(pr.img){
    img.src = pr.img;
    img.alt = pr.title||'Promo';
    imgWrap.style.display = 'block';
  } else {
    imgWrap.style.display = 'none';
  }

  // --- Caption (only show if title or tag exists) ---
  const hasText = !!(pr.title || pr.tag || pr.desc);
  caption.style.display = hasText ? 'block' : 'none';

  if(pr.tag){ tagEl.textContent=pr.tag; tagEl.style.display='block'; }
  else { tagEl.style.display='none'; }

  if(pr.title){ titleEl.textContent=pr.title; }
  else { titleEl.textContent=''; }

  if(pr.desc){ descEl.textContent=pr.desc; descEl.style.display='block'; }
  else { descEl.style.display='none'; }

  // --- WhatsApp link includes promo title ---
  const waMsg = `Halo Dash Gym Bali! 👋\n\nI am interested in the promo *${pr.title||''}*.\n\nCan I get more info? 🙏`;
  waBtn.href = `https://wa.me/6285190940487?text=${encodeURIComponent(waMsg)}`;

  modal.style.display = 'flex';
}
window.openPromoPopup=openPromoPopup;
window.renderPromos=renderPromos;


// ============================================================
// JOIN MODAL
// ============================================================
let selectedPkgId='';
function openJoin(pkgId){
  const pkgs=window._pkgCache||DEFAULT_PACKAGES;
  const p=pkgs.find(x=>x.id===pkgId); if(!p) return;
  selectedPkgId=pkgId;
  document.getElementById('selectedPkgInfo').innerHTML=`<div class="sp-name">${p.name}</div><div class="sp-price">IDR ${formatPrice(p.price)}</div>`;
  openModal('joinModal');
}
function submitJoin(){
  const name=document.getElementById('joinName').value.trim();
  const phone=document.getElementById('joinPhone').value.trim();
  if(!name||!phone){ showToast('Please fill in all fields'); return; }
  const pkgs=window._pkgCache||DEFAULT_PACKAGES;
  const p=pkgs.find(x=>x.id===selectedPkgId);
  const msg=`Hello Dash Gym Bali! 👋\n\nI'd like to register for the *${p?p.name:''}* membership.\n\nName: ${name}\nPhone: ${phone}\n\nPlease assist me with the registration.`;
  window.open(`https://wa.me/6285190940487?text=${encodeURIComponent(msg)}`,'_blank');
  closeModal('joinModal'); showToast('Redirecting to WhatsApp…');
}
window.openJoin=openJoin; window.submitJoin=submitJoin;

// ============================================================

// CHATBOX
// ============================================================
const chatKB={
  facilities:'Weight Training Zone, Cardio Zone, HIIT & Group Classes, Personal Training, Open Gym (1000sqm), Recovery Access (Sauna & Ice Bath — coming soon), Relaxation Area & Pool, Food & Drinks',
  packages:'Daily: 1 Day 270K, 2 Days 470K, 3 Days 670K | Weekly: 1 Week 1.1M, 2 Weeks 1.5M, 3 Weeks 1.8M | Monthly: 1 Month 2.3M, 2 Months 3.5M, 3 Months 4.7M | Membership: 6 Months 9.5M, 9 Months 13.5M, 12 Months 15.5M (taxes included, unlimited gym access + all gym-based classes)',
  services:'Personal Trainer (custom rates, ask us), Recovery Access — Sauna & Ice Bath coming soon (250K/person, taxes included), Relaxation Area (pool & lounge, included with Recovery Access), Food & Drinks (on request, ask at reception)',
  location:'Jl. Pecatu Indah Raya Blok G2, Pecatu, Kec. Kuta Sel., Kabupaten Badung, Bali 80361',
  contact:'WhatsApp: +62 851-9094-0487 | Instagram: @dash.gym.bali',
  hours:'Open daily, 07:00 – 19:00'
};
function getAIReply(msg){
  const m=msg.toLowerCase();
  if(m.includes('facility')||m.includes('fasilitas')||m.includes('sauna')||m.includes('pool')) return '🏋️ Our facilities:\n'+chatKB.facilities;
  if(m.includes('price')||m.includes('harga')||m.includes('package')||m.includes('paket')) return '💰 Our packages:\n'+chatKB.packages;
  if(m.includes('service')||m.includes('layanan')) return '🎯 Our services:\n'+chatKB.services;
  if(m.includes('location')||m.includes('where')||m.includes('lokasi')||m.includes('alamat')) return '📍 '+chatKB.location;
  if(m.includes('contact')||m.includes('whatsapp')||m.includes('kontak')) return '📱 '+chatKB.contact;
  if(m.includes('hour')||m.includes('open')||m.includes('jam')||m.includes('buka')) return '🕐 '+chatKB.hours;
  if(m.includes('join')||m.includes('member')||m.includes('register')||m.includes('daftar')) return '💪 Click "Join Now" and pick a package! Or WhatsApp us at +62 851-9094-0487.';
  if(m.includes('recovery')||m.includes('ice bath')||m.includes('sauna')) return '❄️ Recovery Access: IDR 250K/person (taxes included). Sauna & Ice Bath coming soon!';
  return "Great question! Contact us: WhatsApp +62 851-9094-0487 or visit us in Pecatu, Uluwatu, Bali. 🌴";
}
function sendChat(){
  const input=document.getElementById('chatInput'); const msg=input.value.trim(); if(!msg) return;
  const msgs=document.getElementById('chatMessages');
  msgs.innerHTML+=`<div class="chat-msg user">${msg}</div>`; input.value='';
  setTimeout(()=>{ const reply=getAIReply(msg); msgs.innerHTML+=`<div class="chat-msg bot">${reply.replace(/\n/g,'<br>')}</div>`; msgs.scrollTop=msgs.scrollHeight; },600);
  msgs.scrollTop=msgs.scrollHeight;
}
function toggleChat(){ document.getElementById('chatbox').classList.toggle('open'); }
window.sendChat=sendChat; window.toggleChat=toggleChat;

// ============================================================
// MOBILE NAV
// ============================================================
function toggleMobileNav(){
  const nav=document.getElementById('navLinks');
  const open=nav.style.display==='flex';
  Object.assign(nav.style,{display:open?'none':'flex',flexDirection:'column',position:'absolute',top:'70px',left:'0',right:'0',background:'var(--dark)',padding:'1rem 2rem',borderBottom:'1px solid var(--border)'});
}
window.toggleMobileNav=toggleMobileNav;

// ============================================================

export { initHero, initHeroTilt, goHero, renderPackages, renderPromos, openPromoPopup, openJoin, submitJoin, getAIReply, sendChat, toggleChat, toggleMobileNav };
