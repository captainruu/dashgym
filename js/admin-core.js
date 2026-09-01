// Used only by admin.html — tab navigation + overview stats.
// Orchestrates all the other admin-*.js modules.
import { showLoading, hideLoading } from './utils.js';
import { dbGetMembers } from './db-members.js';
import { renderMembersTable } from './admin-members.js';
import { renderPricingAdmin } from './admin-pricing.js';
import { maybeAutoStartScanner, stopScanner } from './admin-checkin.js';
import { renderPackages } from './public-site.js';

// ============================================================
// ADMIN — TAB NAVIGATION
// ============================================================
function adminTab(tab){
  const tabs=['overview','members','addmember','pricing','scan'];
  tabs.forEach(t=>{
    document.getElementById('admin-'+t).style.display=t===tab?'block':'none';
    const el=document.getElementById('tab-'+t);
    if(el) el.classList.toggle('active',t===tab);
  });
  if(tab==='overview')  renderOverview();
  if(tab==='members')   renderMembersTable();
  if(tab==='pricing')   renderPricingAdmin();
  if(tab==='addmember'){ renderPackages(); document.getElementById('newStart').value=new Date().toISOString().split('T')[0]; }
  if(tab==='scan')      setTimeout(maybeAutoStartScanner,300);
  if(tab!=='scan')      stopScanner();
}
function renderAdmin(){ adminTab('overview'); }
window.adminTab=adminTab; window.renderAdmin=renderAdmin;

// ============================================================
// ADMIN — OVERVIEW
// ============================================================
async function renderOverview(){
  showLoading('Loading dashboard…');
  const members=await dbGetMembers();
  hideLoading();
  const today=new Date(); today.setHours(0,0,0,0);
  const todayS=today.toISOString().split('T')[0];
  const active=members.filter(m=>new Date(m.expiryDate)>=today);
  const expired=members.filter(m=>new Date(m.expiryDate)<today);
  const todayExp=members.filter(m=>m.expiryDate===todayS);
  document.getElementById('totalMembers').textContent=members.length;
  document.getElementById('activeMembers').textContent=active.length;
  document.getElementById('expiredMembers').textContent=expired.length;
  document.getElementById('todayExpired').textContent=todayExp.length;
  const notif=document.getElementById('expiredNotif');
  if(todayExp.length){
    notif.style.display='flex';
    document.getElementById('expiredNotifText').textContent=`${todayExp.length} membership(s) expiring today: ${todayExp.map(m=>m.name).join(', ')}`;
  } else notif.style.display='none';
  document.getElementById('overviewTbody').innerHTML=members.slice().reverse().slice(0,10).map(m=>`
    <tr>
      <td>${m.code}</td><td>${m.name}</td><td>${m.phone||''}</td>
      <td>${m.pkgName}</td><td>${m.expiryDate}</td>
      <td><span class="badge ${new Date(m.expiryDate)>=today?'badge-active':'badge-expired'}">${new Date(m.expiryDate)>=today?'Active':'Expired'}</span></td>
    </tr>`).join('');
}
window.renderOverview=renderOverview;


export { adminTab, renderAdmin, renderOverview };
