// ============================================================
// MEMBER DASHBOARD — used only by member.html
// ============================================================
import { LOGO_WHITE_URL } from './config.js';
import { showLoading, hideLoading, showToast } from './utils.js';
import { dbGetMemberByCode } from './db-members.js';
import { requireMemberSession, doLogout } from './auth.js';

// Module-scoped "current member" — replaces the old cross-page
// global `currentUser` now that each page is its own document.
let currentMember = null;

function renderMemberDashboard(m){
  document.getElementById('memberNavName').textContent=m.name;
  document.getElementById('micardLogo').src=LOGO_WHITE_URL;
  document.getElementById('mName').textContent=m.name;
  document.getElementById('mId').textContent=m.code;
  document.getElementById('mCodeDisplay').textContent=m.code;
  document.getElementById('mPhone').textContent=m.phone;
  document.getElementById('mPkg').textContent=m.pkgName;
  document.getElementById('mStart').textContent=m.startDate;
  document.getElementById('mExpiry').textContent=m.expiryDate;
  const today=new Date(); today.setHours(0,0,0,0);
  const exp=new Date(m.expiryDate);
  const diff=Math.ceil((exp-today)/86400000);
  const active=diff>=0;
  document.getElementById('mStatusPill').className='micard-status-pill '+(active?'':'expired');
  document.getElementById('mStatusText').textContent=active?'Active':'Expired';
  document.getElementById('mDays').textContent=active?diff+' days':'Expired';
  const qrDiv=document.getElementById('qr-container');
  qrDiv.innerHTML='';
  new QRCode(qrDiv,{text:m.code,width:128,height:128,colorDark:'#000',colorLight:'#fff'});
}

// Called once, at the top of member.html's own <script type="module">
async function initMemberPage(){
  const code = requireMemberSession(); // redirects to login.html if absent
  if(!code) return;
  showLoading('Loading your membership…');
  const m = await dbGetMemberByCode(code);
  hideLoading();
  if(!m){ showToast('Session expired, please log in again.'); doLogout(); return; }
  currentMember = m;
  renderMemberDashboard(m);
}

export { renderMemberDashboard, initMemberPage };
