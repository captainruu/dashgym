// ============================================================
// UTILS — shared by every page
// ============================================================
let currentLang = 'en';

function normCode(c){ return (c||'').trim().toUpperCase().replace(/\s+/g,''); }
function formatPrice(n){ return Number(n).toLocaleString('id-ID'); }
function todayStr(){ return new Date().toISOString().split('T')[0]; }
function nowTs(){ return new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}); }

// ============================================================
// LOADING OVERLAY
// ============================================================
function showLoading(msg='Loading…'){
  let ov = document.getElementById('dbLoadingOverlay');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'dbLoadingOverlay';
    ov.style.cssText='position:fixed;inset:0;background:rgba(10,10,10,.88);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;';
    ov.innerHTML=`<div style="width:40px;height:40px;border:3px solid rgba(233,219,194,.25);border-top-color:#e9dbc2;border-radius:50%;animation:_spin .7s linear infinite;"></div>
      <div id="dbLoadingMsg" style="font-family:'Barlow Condensed',sans-serif;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#e9dbc2;"></div>
      <style>@keyframes _spin{to{transform:rotate(360deg)}}</style>`;
    document.body.appendChild(ov);
  }
  document.getElementById('dbLoadingMsg').textContent = msg;
  ov.style.display = 'flex';
}
function hideLoading(){
  const ov = document.getElementById('dbLoadingOverlay');
  if(ov) ov.style.display = 'none';
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg, dur=3500){
  const t=document.getElementById('toast');
  if(!t) return;
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),dur);
}

// ============================================================
// LANGUAGE
// ============================================================
function setLang(lang){
  currentLang=lang;
  document.querySelectorAll('.lang-btn').forEach(b=>b.classList.toggle('active',b.textContent===lang.toUpperCase()));
  document.querySelectorAll('[data-en]').forEach(el=>{const t=el.getAttribute('data-'+lang);if(t)el.textContent=t;});
}

// ============================================================
// MODAL
// ============================================================
function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
function initModalOverlayClose(){
  document.querySelectorAll('.modal-overlay').forEach(el=>{
    el.addEventListener('click', e=>{ if(e.target===el) el.classList.remove('open'); });
  });
}

// ============================================================
// MEMBER SESSION (persists across page loads — replaces the old
// in-memory `currentUser` variable now that pages are separate)
// ============================================================
const MEMBER_SESSION_KEY = 'dash_member_code';
function setMemberSession(code){ sessionStorage.setItem(MEMBER_SESSION_KEY, code); }
function getMemberSession(){ return sessionStorage.getItem(MEMBER_SESSION_KEY); }
function clearMemberSession(){ sessionStorage.removeItem(MEMBER_SESSION_KEY); }

// Expose the ones used directly from inline HTML onclick="" handlers
window.showToast=showToast; window.setLang=setLang;
window.openModal=openModal; window.closeModal=closeModal;

export {
  currentLang, normCode, formatPrice, todayStr, nowTs,
  showLoading, hideLoading, showToast, setLang,
  openModal, closeModal, initModalOverlayClose,
  setMemberSession, getMemberSession, clearMemberSession
};
