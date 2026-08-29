// Used only by admin.html — members table, member details modal,
// register/extend/discount/delete member, CSV export.
import { showLoading, hideLoading, showToast, formatPrice, normCode } from './utils.js';
import { dbGetMembers, dbGetMemberByCode, dbSaveMember, dbUpdateMember, dbDeleteMember } from './db-members.js';
import { dbGetCheckInsByCode } from './db-checkins.js';
import { dbGetPackages } from './db-packages.js';
import { renderOverview } from './admin-core.js';

// ============================================================
// ADMIN — MEMBERS TABLE (with check-in count + details link)
// ============================================================
async function renderMembersTable(){
  showLoading('Loading members…');
  const members=await dbGetMembers();
  hideLoading();
  const search=(document.getElementById('searchMember')||{}).value||'';
  const today=new Date(); today.setHours(0,0,0,0);
  const filtered=members.filter(m=>
    m.name.toLowerCase().includes(search.toLowerCase())||
    (m.code||'').toUpperCase().includes(search.toUpperCase())||
    (m.phone||'').includes(search));
  document.getElementById('membersTbody').innerHTML=filtered.map(m=>`
    <tr>
      <td><small>${m.code}</small></td>
      <td>${m.name}</td><td>${m.phone||''}</td><td>${m.pkgName}</td>
      <td>${m.startDate}</td><td>${m.expiryDate}</td>
      <td><span class="badge ${new Date(m.expiryDate)>=today?'badge-active':'badge-expired'}">${new Date(m.expiryDate)>=today?'Active':'Expired'}</span></td>
      <td>${m.discount||0}%</td>
      <td><button class="action-btn" onclick="showMemberDetails('${m.code}')">Details</button></td>
      <td>
        <button class="action-btn" onclick="showDigitalCard('${m.code}')"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> Card</button>
        <button class="action-btn" onclick="extendMember('${m.code}')">Extend</button>
        <button class="action-btn" onclick="editDiscount('${m.code}')">Discount</button>
        <button class="action-btn danger" onclick="deleteMember('${m.code}')">Delete</button>
      </td>
    </tr>`).join('');
}
window.renderMembersTable=renderMembersTable;

// ============================================================
// ADMIN — MEMBER DETAILS MODAL (with check-in log)
// ============================================================
async function showMemberDetails(code){
  showLoading('Loading details…');
  const m=await dbGetMemberByCode(code);
  const logs=await dbGetCheckInsByCode(code);
  hideLoading();
  if(!m){ showToast('Member not found'); return; }
  const today=new Date(); today.setHours(0,0,0,0);
  const active=new Date(m.expiryDate)>=today;
  document.getElementById('detailsModalTitle').textContent=`${m.name} — Details`;
  document.getElementById('memberDetailsBody').innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
      <div style="background:var(--dark3);padding:1rem;border:1px solid var(--border);">
        <div style="font-family:var(--font-cond);font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--blue);margin-bottom:.25rem;">Member Code</div>
        <div style="font-size:14px;">${m.code}</div>
      </div>
      <div style="background:var(--dark3);padding:1rem;border:1px solid var(--border);">
        <div style="font-family:var(--font-cond);font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--blue);margin-bottom:.25rem;">Status</div>
        <span class="badge ${active?'badge-active':'badge-expired'}">${active?'Active':'Expired'}</span>
      </div>
      <div style="background:var(--dark3);padding:1rem;border:1px solid var(--border);">
        <div style="font-family:var(--font-cond);font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--blue);margin-bottom:.25rem;">Package</div>
        <div style="font-size:14px;">${m.pkgName}</div>
      </div>
      <div style="background:var(--dark3);padding:1rem;border:1px solid var(--border);">
        <div style="font-family:var(--font-cond);font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--blue);margin-bottom:.25rem;">Phone</div>
        <div style="font-size:14px;">${m.phone||'-'}</div>
      </div>
      <div style="background:var(--dark3);padding:1rem;border:1px solid var(--border);">
        <div style="font-family:var(--font-cond);font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--blue);margin-bottom:.25rem;">Start Date</div>
        <div style="font-size:14px;">${m.startDate}</div>
      </div>
      <div style="background:var(--dark3);padding:1rem;border:1px solid var(--border);">
        <div style="font-family:var(--font-cond);font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--blue);margin-bottom:.25rem;">Expiry Date</div>
        <div style="font-size:14px;color:${active?'var(--white)':'#ef4444'}">${m.expiryDate}</div>
      </div>
    </div>
    <div style="margin-bottom:1rem;display:flex;gap:.5rem;flex-wrap:wrap;">
      <button class="btn btn-primary btn-sm" onclick="showDigitalCard('${m.code}');document.getElementById('memberDetailsModal').style.display='none'"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> Digital Card</button>
      <button class="btn btn-outline btn-sm" onclick="extendMember('${m.code}')">Extend</button>
      <button class="btn btn-outline btn-sm" onclick="editDiscount('${m.code}')">Edit Discount</button>
    </div>
    <div style="font-family:var(--font-cond);font-size:12px;letter-spacing:2px;text-transform:uppercase;color:var(--blue);margin-bottom:.75rem;">Check-in History (${logs.length} visits)</div>
    ${logs.length===0?'<p style="font-size:13px;color:var(--gray);padding:1rem 0;">No check-ins recorded yet.</p>':
    `<div style="overflow-x:auto;"><table class="admin-table">
      <thead><tr><th>Date</th><th>Time</th><th>Package</th><th>Status</th></tr></thead>
      <tbody>${logs.map(l=>`
        <tr>
          <td>${l.date}</td><td>${l.time}</td><td>${l.pkgName||'-'}</td>
          <td><span class="badge ${l.status==='active'?'badge-active':'badge-expired'}">${l.status}</span></td>
        </tr>`).join('')}
      </tbody>
    </table></div>`}`;
  document.getElementById('memberDetailsModal').style.display='flex';
}
window.showMemberDetails=showMemberDetails;

// ============================================================

// ADMIN — MEMBER CRUD
// ============================================================
function generateCode(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code='DASH-'+new Date().getFullYear()+'-';
  for(let i=0;i<6;i++) code+=chars[Math.floor(Math.random()*chars.length)];
  return code;
}
// ── STACKED DISCOUNT HELPERS ──────────────────────────────
let _discTierCount = 1;
function recalcDiscount(){
  const pkgId = document.getElementById('newPkg').value;
  const pkgs_el = document.getElementById('newPriceDisplay');
  // get base price from display
  const rows = document.querySelectorAll('.disc-input');
  let baseText = (pkgs_el ? pkgs_el.getAttribute('data-base') : null);
  let base = baseText ? Number(baseText) : 0;
  if(!base) return;
  let price = base;
  rows.forEach((inp,i)=>{
    const d = Math.min(100,Math.max(0,Number(inp.value)||0));
    price = Math.round(price*(1-d/100));
    const res = document.getElementById('discResult'+i);
    if(res) res.textContent = d>0 ? '→ IDR '+formatPrice(price) : '';
  });
  const eff = base ? Math.round((1-price/base)*1000)/10 : 0;
  const tot = document.getElementById('discTotal');
  if(tot) tot.textContent = base>0 ? `Final: IDR ${formatPrice(price)} (${eff}% eff.)` : '';
  if(pkgs_el) pkgs_el.textContent = 'IDR '+formatPrice(price);
}

function addDiscountTier(){
  const stack = document.getElementById('discountStack');
  if(!stack) return;
  const rows = stack.querySelectorAll('.discount-row');
  const i = rows.length;
  if(i>=5){ showToast('Max 5 discount tiers'); return; }
  const row = document.createElement('div');
  row.className = 'discount-row'; row.id = 'discRow'+i;
  row.innerHTML = `
    <span class="disc-label">Tier ${i+1}</span>
    <input type="number" class="disc-input" id="disc${i}" placeholder="0" min="0" max="100" value="0"
      style="width:70px;" oninput="recalcDiscount()">
    <span style="font-size:12px;color:var(--gray);">%</span>
    <span class="disc-result" id="discResult${i}"></span>
    <button class="btn-rm-disc" onclick="removeDiscountTier(${i})">✕</button>`;
  stack.appendChild(row);
}

function removeDiscountTier(idx){
  const row = document.getElementById('discRow'+idx);
  if(row) row.remove();
  const rows = document.querySelectorAll('#discountStack .discount-row');
  rows.forEach((r,i)=>{
    r.id='discRow'+i;
    const inp=r.querySelector('.disc-input'); if(inp){inp.id='disc'+i;}
    const lbl=r.querySelector('.disc-label'); if(lbl) lbl.textContent='Tier '+(i+1);
    const res=r.querySelector('.disc-result'); if(res) res.id='discResult'+i;
    const btn=r.querySelector('.btn-rm-disc');
    if(btn&&i>0) btn.setAttribute('onclick','removeDiscountTier('+i+')');
    if(btn&&i===0) btn.remove();
  });
  recalcDiscount();
}
window.addDiscountTier=addDiscountTier; window.removeDiscountTier=removeDiscountTier; window.recalcDiscount=recalcDiscount;
// ────────────────────────────────────────────────────────────

function updateNewPrice(){
  const sel=document.getElementById('newPkg');
  const opt=sel.options[sel.selectedIndex];
  const price=opt?Number(opt.getAttribute('data-price')):0;
  const el=document.getElementById('newPriceDisplay');
  if(price){ el.textContent='IDR '+formatPrice(price); el.setAttribute('data-base',price); }
  else { el.textContent='–'; el.removeAttribute('data-base'); }
  recalcDiscount();
}

async function registerMember(){
  const name=document.getElementById('newName').value.trim();
  const phone=document.getElementById('newPhone').value.trim();
  const pkgId=document.getElementById('newPkg').value;
  const startDate=document.getElementById('newStart').value;
  // Collect stacked discount tiers
  const discInputs = document.querySelectorAll('#discountStack .disc-input');
  const discountTiers = Array.from(discInputs).map(inp=>Math.min(100,Math.max(0,Number(inp.value)||0)));
  const discount = discountTiers.length ? discountTiers[0] : 0; // keep compat
  if(!name||!phone||!pkgId||!startDate){ showToast('Fill all required fields'); return; }
  showLoading('Registering member…');
  const pkgs=await dbGetPackages();
  const p=pkgs.find(x=>x.id===pkgId);
  if(!p){ hideLoading(); showToast('Package not found'); return; }
  const code=generateCode();
  const start=new Date(startDate);
  const expiry=new Date(start);
  expiry.setDate(expiry.getDate()+p.days);
  // Apply stacked discounts sequentially (not additive)
  let discountedPrice = p.price;
  discountTiers.forEach(d=>{ discountedPrice = Math.round(discountedPrice*(1-d/100)); });
  const member={
    code, name, phone, pkgId, pkgName:p.name,
    startDate:start.toISOString().split('T')[0],
    expiryDate:expiry.toISOString().split('T')[0],
    discount:discountTiers[0]||0, discountTiers, price:discountedPrice,
    registeredAt:new Date().toISOString()
  };
  await dbSaveMember(member);
  hideLoading();

  // Show result panel
  document.getElementById('newMemberResult').style.display='block';
  document.getElementById('genCode').textContent=code;
  document.getElementById('genDetails').innerHTML=`
    Name: <strong style="color:var(--white)">${name}</strong><br>
    Phone: <strong style="color:var(--white)">${phone}</strong><br>
    Package: <strong style="color:var(--white)">${p.name}</strong><br>
    Price: <strong style="color:var(--blue)">IDR ${formatPrice(discountedPrice)}</strong>${discountTiers.some(d=>d>0)?` (${discountTiers.filter(d=>d>0).map(d=>d+'%').join(' → ')} off)`:''}<br>
    Start: <strong style="color:var(--white)">${member.startDate}</strong><br>
    Expiry: <strong style="color:var(--white)">${member.expiryDate}</strong><br><br>
    <button class="btn btn-primary btn-sm" onclick="showDigitalCard('${code}')"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> Generate Digital Card</button>`;
  const qrDiv=document.getElementById('genQR');
  qrDiv.innerHTML='';
  new QRCode(qrDiv,{text:code,width:128,height:128});
  showToast('✓ Member registered: '+code);
  ['newName','newPhone'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  // Reset discount tiers back to single row
  const stack=document.getElementById('discountStack');
  if(stack){ stack.innerHTML=`<div class="discount-row" id="discRow0"><span class="disc-label">Tier 1</span><input type="number" class="disc-input" id="disc0" placeholder="0" min="0" max="100" value="0" oninput="recalcDiscount()"><span style="font-size:12px;color:var(--gray);">%</span><span class="disc-result" id="discResult0"></span></div>`; }
  const tot=document.getElementById('discTotal'); if(tot) tot.textContent='';
  document.getElementById('newPkg').value='';
  document.getElementById('newPriceDisplay').textContent='–';
  document.getElementById('newStart').value=new Date().toISOString().split('T')[0];
  renderOverview();
}

async function extendMember(code){
  const pkgId=prompt('Enter package ID to extend\n(daily/2days/weekly/monthly/3months/6months/annual):');
  if(!pkgId) return;
  showLoading('Extending…');
  const pkgs=await dbGetPackages();
  const p=pkgs.find(x=>x.id===pkgId.trim().toLowerCase());
  if(!p){ hideLoading(); showToast('Invalid package ID'); return; }
  const m=await dbGetMemberByCode(code);
  if(!m){ hideLoading(); return; }
  const today=new Date(); today.setHours(0,0,0,0);
  const base=new Date(m.expiryDate)>=today?new Date(m.expiryDate):today;
  base.setDate(base.getDate()+p.days);
  await dbUpdateMember(code,{expiryDate:base.toISOString().split('T')[0],pkgName:p.name});
  hideLoading();
  renderMembersTable();
  showToast('✓ Extended to '+base.toISOString().split('T')[0]);
}

async function editDiscount(code){
  // Find member to get current discounts
  showLoading('Loading…');
  const members = await dbGetMembers();
  const m = members.find(x=>normCode(x.code)===normCode(code));
  hideLoading();
  if(!m) return;

  // Build modal HTML
  const tiers = Array.isArray(m.discountTiers) && m.discountTiers.length
    ? m.discountTiers : [m.discount||0];

  let tiersHtml = tiers.map((t,i)=>`
    <div class="discount-row" id="edDiscRow${i}">
      <span class="disc-label">Tier ${i+1}</span>
      <input type="number" class="ed-disc-input" id="edDisc${i}" value="${t}" min="0" max="100"
        style="width:70px;background:var(--dark3);border:1px solid var(--border);color:var(--white);
               padding:.4rem .6rem;font-size:13px;outline:none;text-align:center;"
        oninput="edRecalc()">
      <span style="font-size:12px;color:var(--gray);">%</span>
      <span class="disc-result" id="edDiscResult${i}"></span>
      ${i>0?`<button class="btn-rm-disc" onclick="edRemoveTier(${i})">✕</button>`:''}
    </div>`).join('');

  const pkg = m.pkgs || {};
  let basePrice = m.origPrice || m.price || 0;
  // Try to get original package price
  const pkgs = await dbGetPackages();
  const pkgObj = pkgs.find(x=>x.id===m.pkgId);
  if(pkgObj) basePrice = pkgObj.price;

  // Show in a modal
  const overlay = document.createElement('div');
  overlay.id = 'editDiscModal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:3000;display:flex;align-items:center;justify-content:center;padding:1rem;';
  overlay.innerHTML = `
    <div style="background:var(--dark2);border:1px solid var(--border);width:100%;max-width:460px;">
      <div style="padding:1.25rem 1.5rem;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
        <span style="font-family:var(--font-cond);font-size:16px;letter-spacing:1px;text-transform:uppercase;font-weight:600;">Edit Discount — ${m.name}</span>
        <button onclick="document.getElementById('editDiscModal').remove()" style="background:none;border:none;color:var(--gray);font-size:20px;cursor:pointer;">✕</button>
      </div>
      <div style="padding:1.5rem;">
        <div style="font-size:12px;color:var(--gray);margin-bottom:1rem;">
          Base price: <strong style="color:var(--white)">IDR ${formatPrice(basePrice)}</strong>
        </div>
        <div class="discount-stack" id="edDiscStack">${tiersHtml}</div>
        <div style="display:flex;gap:.5rem;margin-top:.5rem;margin-bottom:1.5rem;">
          <button type="button" class="btn-add-disc" onclick="edAddTier()">+ Add Tier</button>
          <span style="font-size:13px;color:var(--blue);align-self:center;font-family:var(--font-cond);" id="edDiscTotal"></span>
        </div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;" onclick="saveEditDiscount('${code}',${basePrice})">Save Discount</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  // store basePrice globally for recalc
  window._edBasePrice = basePrice;
  edRecalc();
}

function edRecalc(){
  const inputs = document.querySelectorAll('.ed-disc-input');
  let price = window._edBasePrice || 0;
  inputs.forEach((inp,i)=>{
    const d = Math.min(100, Math.max(0, Number(inp.value)||0));
    price = Math.round(price * (1 - d/100));
    const res = document.getElementById('edDiscResult'+i);
    if(res) res.textContent = 'IDR '+formatPrice(price);
  });
  const total = window._edBasePrice ? Math.round((1 - price/window._edBasePrice)*100*10)/10 : 0;
  const tot = document.getElementById('edDiscTotal');
  if(tot) tot.textContent = `Final: IDR ${formatPrice(price)} (${total}% eff.)`;
}

function edAddTier(){
  const stack = document.getElementById('edDiscStack');
  if(!stack) return;
  const i = stack.querySelectorAll('.discount-row').length;
  if(i>=5){ showToast('Max 5 discount tiers'); return; }
  const row = document.createElement('div');
  row.className = 'discount-row';
  row.id = 'edDiscRow'+i;
  row.innerHTML = `
    <span class="disc-label">Tier ${i+1}</span>
    <input type="number" class="ed-disc-input" id="edDisc${i}" value="0" min="0" max="100"
      style="width:70px;background:var(--dark3);border:1px solid var(--border);color:var(--white);
             padding:.4rem .6rem;font-size:13px;outline:none;text-align:center;"
      oninput="edRecalc()">
    <span style="font-size:12px;color:var(--gray);">%</span>
    <span class="disc-result" id="edDiscResult${i}"></span>
    <button class="btn-rm-disc" onclick="edRemoveTier(${i})">✕</button>`;
  stack.appendChild(row);
  edRecalc();
}

function edRemoveTier(idx){
  const row = document.getElementById('edDiscRow'+idx);
  if(row) row.remove();
  // Re-number remaining rows
  const rows = document.querySelectorAll('#edDiscStack .discount-row');
  rows.forEach((r,i)=>{
    r.id = 'edDiscRow'+i;
    const inp = r.querySelector('.ed-disc-input');
    if(inp){ inp.id='edDisc'+i; inp.setAttribute('oninput','edRecalc()'); }
    const lbl = r.querySelector('.disc-label');
    if(lbl) lbl.textContent = 'Tier '+(i+1);
    const res = r.querySelector('.disc-result');
    if(res) res.id = 'edDiscResult'+i;
    const btn = r.querySelector('.btn-rm-disc');
    if(btn && i>0) btn.setAttribute('onclick','edRemoveTier('+i+')');
    if(btn && i===0) btn.remove();
  });
  edRecalc();
}

async function saveEditDiscount(code, basePrice){
  const inputs = document.querySelectorAll('.ed-disc-input');
  const tiers = Array.from(inputs).map(inp=>Math.min(100,Math.max(0,Number(inp.value)||0)));
  let price = basePrice;
  tiers.forEach(d=>{ price = Math.round(price*(1-d/100)); });
  const effectiveDisc = basePrice ? Math.round((1-price/basePrice)*1000)/10 : 0;
  showLoading('Saving…');
  await dbUpdateMember(code,{ discount:effectiveDisc, discountTiers:tiers, price });
  hideLoading();
  document.getElementById('editDiscModal')?.remove();
  renderMembersTable();
  showToast('✓ Discount saved: '+tiers.map(t=>t+'%').join(' → '));
}
window.edRecalc=edRecalc; window.edAddTier=edAddTier; window.edRemoveTier=edRemoveTier; window.saveEditDiscount=saveEditDiscount;

async function deleteMember(code){
  if(!confirm('Delete member '+code+'?\nThis cannot be undone.')) return;
  showLoading('Deleting…');
  await dbDeleteMember(code);
  hideLoading();
  renderMembersTable(); renderOverview();
  showToast('Member deleted');
}

window.updateNewPrice=updateNewPrice; window.registerMember=registerMember;
window.extendMember=extendMember; window.editDiscount=editDiscount; window.deleteMember=deleteMember;

// ============================================================
// EXPORT CSV — with month/year filter
// ============================================================
async function exportMembers(src){
  // src=1 → overview filters, src=2 → members tab filters
  const monthSel = src===2 ? document.getElementById('csvMonth2') : document.getElementById('csvMonth');
  const yearSel  = src===2 ? document.getElementById('csvYear2')  : document.getElementById('csvYear');
  const month = monthSel ? monthSel.value : '';
  const year  = yearSel  ? yearSel.value  : '';

  showLoading('Preparing export…');
  let members = await dbGetMembers();
  hideLoading();

  if(month||year){
    members = members.filter(m=>{
      const d = new Date(m.startDate);
      const mOk = !month || (d.getMonth()+1)===Number(month);
      const yOk = !year  || d.getFullYear()===Number(year);
      return mOk && yOk;
    });
  }

  const today = new Date(); today.setHours(0,0,0,0);
  const header = 'Code,Name,Phone,Package,Start,Expiry,Status,Discount,Price\n';
  const rows   = members.map(m=>{
    const st = new Date(m.expiryDate)>=today ? 'Active' : 'Expired';
    return `${m.code},"${m.name}",${m.phone||''},${m.pkgName},${m.startDate},${m.expiryDate},${st},${m.discount||0}%,${m.price||''}`;
  }).join('\n');

  const suffix = [year,month?month.padStart(2,'0'):''].filter(Boolean).join('-');
  const blob = new Blob([header+rows],{type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `DASH_Members${suffix?'_'+suffix:''}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  showToast(`✓ Exported ${members.length} members`);
}
window.exportMembers=exportMembers;


export {
  renderMembersTable, showMemberDetails, generateCode,
  recalcDiscount, addDiscountTier, removeDiscountTier, updateNewPrice,
  registerMember, extendMember, editDiscount,
  edRecalc, edAddTier, edRemoveTier, saveEditDiscount,
  deleteMember, exportMembers
};
